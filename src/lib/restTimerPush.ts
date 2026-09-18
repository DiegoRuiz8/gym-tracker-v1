import { supabase } from "./supabase";
import type { RestTimer } from "../types/session";

const WEB_PUSH_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;

type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    auth: string;
    p256dh: string;
  };
};

type TimerPushPayload = {
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

type SubscribePushPayload = {
  action: "subscribe";
  subscription: PushSubscriptionPayload;
};

type CancelPushPayload = {
  action: "cancel_timer";
  sessionId: string;
};

type UnsubscribePushPayload = {
  action: "unsubscribe";
  endpoint: string;
};

function supportsPushSubscriptions(): boolean {
  return (
    Boolean(WEB_PUSH_PUBLIC_KEY) &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function decodeUrlSafeBase64(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = window.atob(base64);

  const bytes = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return bytes.buffer;
}

function toPayload(subscription: PushSubscription): PushSubscriptionPayload | null {
  const json = subscription.toJSON();
  const auth = json.keys?.auth;
  const p256dh = json.keys?.p256dh;

  if (!json.endpoint || !auth || !p256dh) return null;

  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: { auth, p256dh },
  };
}

async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!supportsPushSubscriptions()) return null;

  const publicKey = WEB_PUSH_PUBLIC_KEY;
  if (!publicKey) return null;

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) return existingSubscription;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeUrlSafeBase64(publicKey),
  });
}

async function invokeTimerPush(
  payload:
    | TimerPushPayload
    | SubscribePushPayload
    | CancelPushPayload
    | UnsubscribePushPayload,
): Promise<void> {
  const { error } = await supabase.functions.invoke("rest-timer-notifications", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function registerRestTimerPushSubscription(): Promise<void> {
  const subscription = await getPushSubscription();
  const payload = subscription ? toPayload(subscription) : null;
  if (!payload) return;

  await invokeTimerPush({
    action: "subscribe",
    subscription: payload,
  });
}

export async function syncRestTimerPush({
  sessionId,
  restTimer,
  nextExerciseName,
}: {
  sessionId: string;
  restTimer: RestTimer;
  nextExerciseName: string | undefined;
}): Promise<void> {
  if (restTimer.status !== "running") return;

  const subscription = await getPushSubscription();
  const payload = subscription ? toPayload(subscription) : null;
  if (!payload) return;

  const dueAt = new Date(
    new Date(restTimer.startedAt).getTime() + restTimer.durationSeconds * 1000,
  ).toISOString();
  const target = nextExerciseName ? `Next: ${nextExerciseName}` : "Ready for your next set";

  await invokeTimerPush({
    action: "sync_timer",
    subscription: payload,
    timer: {
      sessionId,
      timerKey: restTimer.sourceSetId,
      dueAt,
      title: "Rest complete",
      body: target,
    },
  });
}

export async function cancelRestTimerPush(sessionId: string): Promise<void> {
  if (!supportsPushSubscriptions()) return;

  await invokeTimerPush({ action: "cancel_timer", sessionId });
}

export async function unregisterRestTimerPushSubscription(): Promise<void> {
  if (!supportsPushSubscriptions()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const payload = toPayload(subscription);
  if (payload) {
    await invokeTimerPush({ action: "unsubscribe", endpoint: payload.endpoint });
  }

  await subscription.unsubscribe();
}
