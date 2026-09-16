"use client";

import { useEffect, useRef, useState } from "react";
import { arrayMove } from "@/lib/template/checklist-crud";
import { cn } from "@/lib/utils";

export function DragHandle({
  label,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
}: {
  label: string;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Drag to reorder ${label}`}
      className="flex size-11 shrink-0 touch-none items-center justify-center text-edit-accent"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
    >
      <span aria-hidden className="grid grid-cols-2 gap-0.5">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className="size-1 rounded-full bg-current" />
        ))}
      </span>
    </button>
  );
}

function sameIds(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
}

export function usePointerReorder(input: {
  ids: string[];
  enabled: boolean;
  onCommit: (nextIds: string[]) => void;
}) {
  const [draftIds, setDraftIds] = useState(input.ids);
  const [activeId, setActiveId] = useState<string | null>(null);
  const draggingId = useRef<string | null>(null);
  const draftRef = useRef(draftIds);
  const originIds = useRef(input.ids);
  const startPoint = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const suppressClick = useRef(false);
  draftRef.current = draftIds;

  useEffect(() => {
    if (activeId) {
      return;
    }
    setDraftIds((current) => (sameIds(current, input.ids) ? current : input.ids));
    originIds.current = input.ids;
  }, [input.ids, activeId]);

  function start(id: string, event: React.PointerEvent<HTMLButtonElement>) {
    if (!input.enabled) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingId.current = id;
    startPoint.current = { x: event.clientX, y: event.clientY };
    moved.current = false;
    setActiveId(id);
  }

  function move(event: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingId.current) {
      return;
    }
    if (
      Math.abs(event.clientX - startPoint.current.x) > 4 ||
      Math.abs(event.clientY - startPoint.current.y) > 4
    ) {
      moved.current = true;
    }
    const node = document.elementFromPoint(event.clientX, event.clientY);
    const row = node?.closest("[data-reorder-id]");
    const overId = row?.getAttribute("data-reorder-id");
    if (!overId || overId === draggingId.current) {
      return;
    }
    setDraftIds((current) => {
      const from = current.indexOf(draggingId.current ?? "");
      const to = current.indexOf(overId);
      if (from < 0 || to < 0 || from === to) {
        return current;
      }
      return arrayMove(current, from, to);
    });
  }

  function end() {
    if (!draggingId.current) {
      return;
    }
    const next = draftRef.current;
    const changed =
      moved.current &&
      next.some((id, index) => id !== originIds.current[index]);
    draggingId.current = null;
    setActiveId(null);
    if (moved.current) {
      suppressClick.current = true;
    }
    if (changed) {
      input.onCommit(next);
    }
  }

  function handleKey(id: string, event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!input.enabled) {
      return;
    }
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }
    event.preventDefault();
    const from = input.ids.indexOf(id);
    const to = event.key === "ArrowUp" ? from - 1 : from + 1;
    if (to < 0 || to >= input.ids.length) {
      return;
    }
    input.onCommit(arrayMove(input.ids, from, to));
  }

  function consumeClick(): boolean {
    if (!suppressClick.current) {
      return false;
    }
    suppressClick.current = false;
    return true;
  }

  return {
    ids: draftIds,
    activeId,
    start,
    move,
    end,
    handleKey,
    consumeClick,
  };
}

export function reorderRowClass(active: boolean): string {
  return cn(active && "rounded-lg bg-muted/70 opacity-70");
}
