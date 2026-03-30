"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";

type TooltipProps = {
  content: string;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
};

export function Tooltip({ content, children, side = "bottom" }: TooltipProps) {
  return (
    <BaseTooltip.Provider delay={400}>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger render={children} />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner side={side} sideOffset={6}>
            <BaseTooltip.Popup className="bg-foreground text-background px-2 py-1 font-mono text-[10px] border border-border z-50 max-w-48 pointer-events-none">
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}
