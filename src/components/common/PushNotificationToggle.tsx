"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PermissionState = "default" | "granted" | "denied";
type ToggleState = "idle" | "loading" | "subscribed" | "unsupported";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationToggle({ className }: { className?: string }) {
  const [state, setState] = useState<ToggleState>("idle");
  const [permission, setPermission] = useState<PermissionState>("default");

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    if (!isSupported) {
      setState("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) setState("subscribed");
      })
      .catch(() => {
        // Ignore — SW not yet registered
      });
  }, [isSupported]);

  const registerServiceWorker = useCallback(async () => {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  }, []);

  const subscribe = useCallback(async () => {
    setState("loading");
    try {
      // 1. Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== "granted") {
        setState("idle");
        return;
      }

      // 2. Fetch VAPID public key
      const keyRes = await fetch("/api/push/vapid-key");
      const { data } = await keyRes.json();
      const publicKey: string = data?.publicKey ?? "";

      if (!publicKey) {
        console.error("[PushNotificationToggle] VAPID public key missing");
        setState("idle");
        return;
      }

      // 3. Register SW and subscribe
      const reg = await registerServiceWorker();
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      // 4. Save subscription on server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
      });

      setState("subscribed");
    } catch (err) {
      console.error("[PushNotificationToggle] Subscribe failed", err);
      setState("idle");
    }
  }, [registerServiceWorker]);

  const unsubscribe = useCallback(async () => {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ endpoint }),
        });
      }
      setState("idle");
    } catch (err) {
      console.error("[PushNotificationToggle] Unsubscribe failed", err);
      setState("subscribed");
    }
  }, []);

  const handleClick = () => {
    if (state === "loading" || state === "unsupported") return;
    if (state === "subscribed") {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  const isLoading = state === "loading";
  const isSubscribed = state === "subscribed";
  const isDisabled =
    state === "unsupported" || permission === "denied" || isLoading;

  const label =
    state === "unsupported"
      ? "مرورگر پشتیبانی نمی‌کند"
      : permission === "denied"
      ? "اعلان‌ها مسدود شده‌اند"
      : isSubscribed
      ? "غیرفعال‌سازی اعلان‌های مرورگر"
      : "فعال‌سازی اعلان‌های مرورگر";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      title={label}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
        "border border-border bg-card hover:bg-accent text-foreground",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isSubscribed && "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span>{label}</span>
    </button>
  );
}
