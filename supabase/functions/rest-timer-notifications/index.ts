import { createClient } from "npm:@supabase/supabase-js@2";

type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    auth: string;
    p256dh: string;
  };
};

type SubscribeRequest = {
  action: "subscribe";
  subscription: PushSubscriptionPayload;
};

type SyncTimerRequest = {
  action: "sync_timer";
  subscription: PushSubscriptionPayload;
  timer: {
    sessionId: string;
    timerKey: string;
    dueAt: string;
    title: string;
    body: string;
  };
};

type CancelTimerRequest = {
  action: "cancel_timer";
  sessionId: string;
};

type UnsubscribeRequest = {
  action: "unsubscribe";
  endpoint: string;
};

type VapidPublicKeyRequest = {
  action: "get_vapid_public_key";
};

type TimerNotificationRequest =
  | SubscribeRequest
  | SyncTimerRequest
  | CancelTimerRequest
  | UnsubscribeRequest
  | VapidPublicKeyRequest;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";

function json(body: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidSubscription(subscription: PushSubscriptionPayload): boolean {
  return Boolean(
    subscription.endpoint && subscription.keys.auth && subscription.keys.p256dh,
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const payload = (await request.json()) as TimerNotificationRequest;

  if (payload.action === "get_vapid_public_key") {
    if (!vapidPublicKey) return json({ error: "Push is not configured" }, 500);
    return json({ publicKey: vapidPublicKey });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization || !supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return json({ error: "Unauthorized" }, 401);
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  const user = userData.user;

  if (userError || !user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey);

  if (payload.action === "subscribe" || payload.action === "sync_timer") {
    if (!isValidSubscription(payload.subscription)) {
      return json({ error: "Invalid push subscription" }, 400);
    }

    const { data: subscription, error: subscriptionError } = await admin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: payload.subscription.endpoint,
          p256dh: payload.subscription.keys.p256dh,
          auth: payload.subscription.keys.auth,
          expiration_time: payload.subscription.expirationTime
            ? new Date(payload.subscription.expirationTime).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      )
      .select("id")
      .single();

    if (subscriptionError || !subscription) {
      return json({ error: "Unable to save push subscription" }, 500);
    }

    if (payload.action === "subscribe") return json({ ok: "true" });

    const dueAt = new Date(payload.timer.dueAt);
    if (
      Number.isNaN(dueAt.getTime()) ||
      !payload.timer.sessionId ||
      !payload.timer.timerKey ||
      !payload.timer.title ||
      !payload.timer.body
    ) {
      return json({ error: "Invalid timer" }, 400);
    }

    const { error: timerError } = await admin
      .from("rest_timer_push_jobs")
      .upsert(
        {
          user_id: user.id,
          subscription_id: subscription.id,
          session_id: payload.timer.sessionId,
          timer_key: payload.timer.timerKey,
          due_at: dueAt.toISOString(),
          title: payload.timer.title,
          body: payload.timer.body,
          status: "scheduled",
          delivered_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "subscription_id,session_id" },
      );

    if (timerError) return json({ error: "Unable to schedule timer" }, 500);
    const { error: cronError } = await admin.rpc(
      "ensure_rest_timer_delivery_cron",
    );
    if (cronError) return json({ error: "Unable to start timer delivery" }, 500);
    return json({ ok: "true" });
  }

  if (payload.action === "cancel_timer") {
    let query = admin
      .from("rest_timer_push_jobs")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "scheduled");

    if (payload.sessionId) query = query.eq("session_id", payload.sessionId);

    const { error } = await query;
    if (error) return json({ error: "Unable to cancel timer" }, 500);
    await admin.rpc("stop_rest_timer_delivery_cron_if_idle");
    return json({ ok: "true" });
  }

  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", payload.endpoint);

  if (error) return json({ error: "Unable to remove push subscription" }, 500);
  await admin.rpc("stop_rest_timer_delivery_cron_if_idle");
  return json({ ok: "true" });
});
