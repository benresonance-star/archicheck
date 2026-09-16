"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

const HOME_OPEN_KEY = "vic-arch-checklist-scout-home-open";

export function ScoutSection({
  title,
  subtitle,
  badges,
  storageKey,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  badges?: string[];
  storageKey?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!storageKey) {
      return;
    }
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "0") {
      setOpen(false);
    } else if (stored === "1") {
      setOpen(true);
    }
  }, [storageKey]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (storageKey) {
      window.localStorage.setItem(storageKey, next ? "1" : "0");
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-scout-border bg-scout text-scout-foreground shadow-sm">
      <button
        type="button"
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium uppercase tracking-[0.16em] text-scout-accent">
            Code scout
          </span>
          <span className="font-heading text-2xl leading-tight">{title}</span>
          {subtitle ? (
            <span className="mt-1 block text-sm text-scout-foreground/80">
              {subtitle}
            </span>
          ) : null}
          {badges && badges.length > 0 ? (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <Badge
                  key={badge}
                  variant="outline"
                  className="border-scout-border bg-scout-foreground/5 text-scout-foreground"
                >
                  {badge}
                </Badge>
              ))}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`size-5 shrink-0 text-scout-accent transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="space-y-4 border-t border-scout-border px-4 py-4">{children}</div> : null}
    </section>
  );
}

export const SCOUT_HOME_OPEN_KEY = HOME_OPEN_KEY;
