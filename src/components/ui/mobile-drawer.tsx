"use client";

import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function MobileDrawer({
  open,
  onClose,
  title,
  children,
}: MobileDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 bg-black/60 z-50" />
        <Drawer.Popup className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border max-h-[85dvh] flex flex-col">
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-8 h-1 bg-border" />
          </div>
          <div className="flex items-center justify-between px-4 pb-2 border-b border-border">
            <Drawer.Title className="font-mono text-xs font-semibold uppercase tracking-wider">
              {title}
            </Drawer.Title>
            <Drawer.Close className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </Drawer.Close>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
