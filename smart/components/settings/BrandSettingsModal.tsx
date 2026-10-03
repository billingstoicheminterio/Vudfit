"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { AppColorTheme } from "@/lib/types";
import {
  Sparkles,
  Zap,
  Layers,
  Rocket,
  Crown,
  Flame,
  Shield,
  Globe,
  Hexagon,
  Infinity as InfinityIcon,
  Briefcase,
  Cpu,
  X,
  Palette,
  Image as ImageIcon,
  Check,
  CheckCircle2,
} from "lucide-react";

export const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Zap,
  Layers,
  Rocket,
  Crown,
  Flame,
  Shield,
  Globe,
  Hexagon,
  Infinity: InfinityIcon,
  Briefcase,
  Cpu,
};

const THEMES: { id: AppColorTheme; name: string; hex: string; desc: string }[] = [
  { id: "vudfit_gold", name: "VUDFIT Luxury Gold Accent", hex: "#D7C18A", desc: "Exact gold swatch (#D7C18A) from your attached image" },
  { id: "vudfit_gold_bg", name: "VUDFIT Gold Full Background", hex: "#D7C18A", desc: "Gold #D7C18A background for full application" },
  { id: "vudfit_green", name: "VUDFIT Forest Green", hex: "#162E26", desc: "Official VUDFIT deep forest green" },
  { id: "vudfit_bronze", name: "VUDFIT Espresso Bronze", hex: "#42341D", desc: "Official VUDFIT deep bronze" },
  { id: "indigo", name: "Indigo Modern", hex: "#6366F1", desc: "Sleek tech indigo" },
  { id: "emerald", name: "Emerald Luxe", hex: "#10B981", desc: "Vibrant organic emerald green" },
  { id: "sapphire", name: "Ocean Sapphire", hex: "#0284C7", desc: "Deep executive sapphire blue" },
  { id: "amber", name: "Amber Sunset", hex: "#F59E0B", desc: "Warm energetic gold amber" },
  { id: "violet", name: "Neon Violet", hex: "#8B5CF6", desc: "Futuristic purple neon glow" },
  { id: "rose", name: "Rose Crimson", hex: "#F43F5E", desc: "Bold passionate crimson rose" },
  { id: "cyan", name: "Electric Cyan", hex: "#06B6D4", desc: "Bright high-contrast cyan" },
];

export const BrandSettingsModal: React.FC = () => {
  const {
    isBrandSettingsOpen,
    setBrandSettingsOpen,
    brandSettings,
    updateBrandSettings,
  } = useAppStore();

  const [brandName, setBrandName] = useState(brandSettings.brandName);
  const [brandTagline, setBrandTagline] = useState(brandSettings.brandTagline || "");
  const [logoType, setLogoType] = useState(brandSettings.logoType);
  const [logoIcon, setLogoIcon] = useState(brandSettings.logoIcon);
  const [logoImageUrl, setLogoImageUrl] = useState(brandSettings.logoImageUrl || "");
  const [colorTheme, setColorTheme] = useState<AppColorTheme>(brandSettings.colorTheme);

  useEffect(() => {
    if (isBrandSettingsOpen) {
      setBrandName(brandSettings.brandName);
      setBrandTagline(brandSettings.brandTagline || "");
      setLogoType(brandSettings.logoType);
      setLogoIcon(brandSettings.logoIcon);
      setLogoImageUrl(brandSettings.logoImageUrl || "");
      setColorTheme(brandSettings.colorTheme);
    }
  }, [isBrandSettingsOpen, brandSettings]);

  if (!isBrandSettingsOpen) return null;

  const handleThemeSelect = (themeId: AppColorTheme) => {
    setColorTheme(themeId);
    // Instant live preview
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-color-theme", themeId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandSettings({
      brandName: brandName.trim() || "Stoichem Interio",
      brandTagline: brandTagline.trim(),
      logoType,
      logoIcon,
      logoImageUrl: logoImageUrl.trim(),
      colorTheme,
    });
    setBrandSettingsOpen(false);
  };

  const SelectedIconComponent = ICON_MAP[logoIcon] || Sparkles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center border border-brand-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Brand & App Theme Customization</h2>
              <p className="text-xs text-muted-foreground">Customize logo, brand name & global color palette</p>
            </div>
          </div>
          <button
            onClick={() => {
              // Revert preview if cancelled
              if (typeof document !== "undefined") {
                document.documentElement.setAttribute("data-color-theme", brandSettings.colorTheme);
              }
              setBrandSettingsOpen(false);
            }}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Live Preview Box */}
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Header Preview</span>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-card border border-border shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25 overflow-hidden">
                {logoType === "image" && logoImageUrl ? (
                  <img src={logoImageUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <SelectedIconComponent className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                {brandName || "Stoichem Interio"}
                {brandTagline && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-semibold border border-brand-500/20">
                    {brandTagline}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* 1. Brand Name & Badge */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-1">
              1. Brand Name & Badge
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  App / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Stoichem Interio, VUDFIT, Acme HQ"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Tagline / Version
                </label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  placeholder="e.g. 2.0, PRO"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                />
              </div>
            </div>
          </div>

          {/* 2. Logo Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-1">
              2. App Logo Customization
            </h3>

            {/* Type Selector Tabs */}
            <div className="flex rounded-xl bg-secondary/60 p-1 border border-border/60">
              <button
                type="button"
                onClick={() => setLogoType("icon")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  logoType === "icon" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preset Icon</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoType("image")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  logoType === "image" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Custom Image URL</span>
              </button>
            </div>

            {logoType === "icon" ? (
              <div className="grid grid-cols-6 gap-2 pt-1">
                {Object.keys(ICON_MAP).map((iconKey) => {
                  const IconComp = ICON_MAP[iconKey];
                  const isSelected = logoIcon === iconKey;
                  return (
                    <button
                      type="button"
                      key={iconKey}
                      onClick={() => setLogoIcon(iconKey)}
                      className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-brand-500/10 border-brand-500 text-brand-500 ring-1 ring-brand-500"
                          : "border-border/60 bg-card hover:bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                      <span className="text-[10px] font-medium truncate w-full text-center">{iconKey}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-foreground">Logo Image URL</label>
                <input
                  type="url"
                  value={logoImageUrl}
                  onChange={(e) => setLogoImageUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                />
                <p className="text-[11px] text-muted-foreground">
                  Paste a direct link to your transparent PNG, SVG, or JPEG logo icon.
                </p>
              </div>
            )}
          </div>

          {/* 3. App Color Theme */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-1">
              3. App Accent Color Theme
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {THEMES.map((theme) => {
                const isSelected = colorTheme === theme.id;
                return (
                  <button
                    type="button"
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-secondary border-brand-500 ring-2 ring-brand-500/30"
                        : "bg-card border-border/60 hover:bg-secondary/60"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm font-bold text-xs"
                      style={{ backgroundColor: theme.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{theme.name}</span>
                        {isSelected && <span className="text-[10px] text-brand-500 font-bold uppercase">Active</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{theme.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof document !== "undefined") {
                  document.documentElement.setAttribute("data-color-theme", brandSettings.colorTheme);
                }
                setBrandSettingsOpen(false);
              }}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply & Save Branding</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
