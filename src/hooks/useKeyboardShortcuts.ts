"use client";

import { useEffect } from "react";

type Modifier = "ctrl" | "meta" | "shift" | "alt";

interface ShortcutDefinition {
  key: string;
  modifiers?: Modifier[];
  handler: () => void;
}

function parseShortcut(shortcut: string): { key: string; modifiers: Modifier[] } {
  const parts = shortcut.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1) as Modifier[];
  return { key, modifiers };
}

function matchesShortcut(
  event: KeyboardEvent,
  key: string,
  modifiers: Modifier[]
): boolean {
  const eventKey = event.key.toLowerCase();
  if (eventKey !== key) return false;

  const ctrlRequired = modifiers.includes("ctrl");
  const metaRequired = modifiers.includes("meta");
  const shiftRequired = modifiers.includes("shift");
  const altRequired = modifiers.includes("alt");

  if (ctrlRequired !== event.ctrlKey) return false;
  if (metaRequired !== event.metaKey) return false;
  if (shiftRequired !== event.shiftKey) return false;
  if (altRequired !== event.altKey) return false;

  return true;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el as HTMLElement).tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (el as HTMLElement).isContentEditable
  );
}

export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>
): void {
  useEffect(() => {
    const definitions: ShortcutDefinition[] = Object.entries(shortcuts).map(
      ([shortcut, handler]) => {
        const { key, modifiers } = parseShortcut(shortcut);
        return { key, modifiers, handler };
      }
    );

    function handleKeyDown(event: KeyboardEvent) {
      // Ignore when focus is in form fields (unless modifiers are used)
      const hasModifier =
        event.ctrlKey || event.metaKey || event.altKey;
      if (!hasModifier && isInputFocused()) return;

      for (const def of definitions) {
        if (matchesShortcut(event, def.key, def.modifiers ?? [])) {
          def.handler();
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
