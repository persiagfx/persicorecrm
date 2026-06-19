"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsOverlay } from "./KeyboardShortcutsOverlay";

const G_SEQUENCE_TIMEOUT = 1000; // ms to wait for second key after "g"

export function GlobalShortcuts() {
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState(false);
  const gPressedRef = useRef(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGSequence = useCallback(() => {
    gPressedRef.current = false;
    if (gTimerRef.current) {
      clearTimeout(gTimerRef.current);
      gTimerRef.current = null;
    }
  }, []);

  const startGSequence = useCallback(() => {
    gPressedRef.current = true;
    if (gTimerRef.current) clearTimeout(gTimerRef.current);
    gTimerRef.current = setTimeout(clearGSequence, G_SEQUENCE_TIMEOUT);
  }, [clearGSequence]);

  const navigateIfG = useCallback(
    (path: string) => {
      if (gPressedRef.current) {
        clearGSequence();
        router.push(path);
      }
    },
    [router, clearGSequence]
  );

  // Register shortcuts — stable object via useMemo-like pattern with useRef
  const shortcutsRef = useRef<Record<string, () => void>>({});

  shortcutsRef.current = {
    g: startGSequence,
    d: () => navigateIfG("/dashboard"),
    l: () => navigateIfG("/leads"),
    c: () => navigateIfG("/clients"),
    p: () => navigateIfG("/projects"),
    m: () => navigateIfG("/messages"),
    i: () => navigateIfG("/invoicing"),
    "?": () => setShowOverlay((v) => !v),
    "ctrl+k": () => {
      window.dispatchEvent(new CustomEvent("focus-search"));
    },
    "meta+k": () => {
      window.dispatchEvent(new CustomEvent("focus-search"));
    },
  };

  // We need a stable shortcuts object for the hook; wrap in a proxy via useEffect
  useKeyboardShortcuts(shortcutsRef.current);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (gTimerRef.current) clearTimeout(gTimerRef.current);
    };
  }, []);

  return (
    <KeyboardShortcutsOverlay
      open={showOverlay}
      onClose={() => setShowOverlay(false)}
    />
  );
}
