import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type RestTimerPushJob = {
  id: string;
  subscription_id: string;
  timer_key: string;
  title: string;
  body: string;
};

type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const cronSecret = Deno.env.get("REST_TIMER_CRON_SECRET") ?? "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "";
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

function json(body: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (
    request.method !== "POST" ||
    !cronSecret ||
    request.headers.get("x-rest-timer-cron-secret") !== cronSecret
  ) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (!supabaseUrl || !supabaseServiceRoleKey || !vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
    return json({ error: "Server is not configured" }, 500);
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const admin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data, error } = await admin.rpc("claim_due_rest_timer_push_jobs", {
    batch_size: 100,
  });

  if (error) return json({ error: "Unable to claim due timers" }, 500);

  const jobs = (data ?? []) as RestTimerPushJob[];
  if (jobs.length === 0) {
    await admin.rpc("stop_rest_timer_delivery_cron_if_idle");
    return json({ delivered: "0" });
  }

  const subscriptionIds = jobs.map((job) => job.subscription_id);
  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("id", subscriptionIds);

  if (subscriptionsError) return json({ error: "Unable to load push subscriptions" }, 500);

  const subscriptionById = new Map(
    ((subscriptions ?? []) as PushSubscriptionRecord[]).map((subscription) => [
      subscription.id,
      subscription,
    ]),
  );

  await Promise.all(
    jobs.map(async (job) => {
      const subscription = subscriptionById.get(job.subscription_id);
      if (!subscription) {
        await admin
          .from("rest_timer_push_jobs")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", job.id);
        return;
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: job.title,
            body: job.body,
            tag: "active-workout",
            data: { path: "/active-workout", timerKey: job.timer_key },
          }),
          { TTL: 60 },
        );
        await admin
          .from("rest_timer_push_jobs")
          .update({
            status: "delivered",
            delivered_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      } catch (error) {
        console.error("Unable to deliver rest timer push", error);
        await admin
          .from("rest_timer_push_jobs")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", job.id);
      }
    }),
  );

  await admin.rpc("stop_rest_timer_delivery_cron_if_idle");

  return json({ delivered: String(jobs.length) });
});
