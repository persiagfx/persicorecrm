"use client";

import { ReactNode, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { HelpCircle, X } from "lucide-react";

interface HelpTooltipProps {
  content: string | ReactNode;
  title?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function HelpTooltip({ content, title, side = "top" }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="راهنما"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <HelpCircle className="w-3 h-3" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side={side}
          sideOffset={6}
          align="center"
          className="z-[9999] max-w-[280px] rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-xl p-3 text-right animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          style={{ direction: "rtl" }}
        >
          {title && (
            <p className="text-xs font-semibold text-popover-foreground mb-1.5">{title}</p>
          )}
          <div className="text-xs text-muted-foreground leading-relaxed">
            {content}
          </div>
          <Popover.Close className="absolute top-2 left-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3 h-3" />
          </Popover.Close>
          <Popover.Arrow className="fill-popover" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
