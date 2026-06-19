"use client";

import { useEffect } from "react";
import { useCompanyStore } from "@/lib/store";

// Injects --primary CSS variable override from company settings
// so white-label brand color applies everywhere
export function BrandColorInjector() {
  const { settings } = useCompanyStore();

  useEffect(() => {
    if (!settings.primaryColor) return;

    // Convert hex to HSL for CSS variable
    const hex = settings.primaryColor.replace("#", "");
    if (hex.length !== 6) return;

    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);
    const hsl = `${hDeg} ${sPct}% ${lPct}%`;

    document.documentElement.style.setProperty("--primary", hsl);
    return () => {
      document.documentElement.style.removeProperty("--primary");
    };
  }, [settings.primaryColor]);

  return null;
}
