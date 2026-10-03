"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, Bell, Download, X, Check } from "lucide-react";
import { requestPushPermission } from "@/lib/pushNotificationService";

export const MobilePwaPrompt: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasPermission(Notification.permission === "granted");
    }
  }, []);

  const handleEnablePush = async () => {
    const granted = await requestPushPermission();
    setHasPermission(granted);
    if (granted) {
      alert("🎉 Mobile Push Notifications Enabled! You will now receive instant push alerts on your phone.");
    }
  };

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-20 left-6 z-40 max-w-sm w-full animate-in slide-in-from-bottom duration-300">
      <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 shadow-2xl bg-gradient-to-r from-emerald-500/10 via-card to-card flex items-start gap-3 relative overflow-hidden">
        {/* Left Icon */}
        <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-md shadow-emerald-600/30">
          <Smartphone className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-xs text-foreground">VUDFIT Mobile App & Push Alerts</h4>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
              Android & iOS
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            Install on your phone & enable Mobile Push Notifications for real-time task alerts.
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            {!hasPermission ? (
              <button
                onClick={handleEnablePush}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Push Alerts</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                <Check className="w-3.5 h-3.5" /> Push Alerts Enabled
              </span>
            )}

            <button
              onClick={() => {
                alert("📲 To install as Mobile App:\n\nAndroid: Tap browser menu (⋮) -> 'Install app'\niOS Safari: Tap Share (⎋) -> 'Add to Home Screen'");
              }}
              className="px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-[11px] border border-border"
            >
              Install App
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
