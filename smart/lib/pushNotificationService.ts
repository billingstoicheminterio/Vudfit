"use client";

// Mobile Push Notification Service
export const requestPushPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("Push notifications not supported on this device/browser.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const triggerNativePushNotification = (title: string, message: string) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: message,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        vibrate: [200, 100, 200],
      } as any);
    } catch (e) {
      console.error("Error triggering native push notification:", e);
    }
  }
};
