"use client";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LockOverlayProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
  variant?: "default" | "secondary" | "outline";
  className?: string;
};

export function LockOverlay({
  title,
  description,
  actionLabel,
  onAction,
  disabled,
  variant = "default",
  className,
}: LockOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_rgba(0,0,0,0.65)_55%)] px-6 text-center backdrop-blur-xl",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
        <Lock className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold tracking-wide text-foreground">
          {title}
        </p>
        <p className="max-w-[28ch] text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <Button
          size="sm"
          variant={variant}
          onClick={onAction}
          disabled={disabled}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
