"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

export function AppHeader({
  title,
  backHref,
}: {
  title?: string;
  backHref?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function onImport(file: File) {
    setImporting(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/import", { method: "POST", body: form });
      const data = (await response.json()) as {
        error?: string;
        project?: { id: string };
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Import failed");
      }
      toast.success("Package restored");
      if (data.project?.id) {
        router.push(`/p/${data.project.id}`);
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setImporting(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        {backHref ? (
          <Button variant="ghost" className="min-h-11 px-3" asChild>
            <Link href={backHref}>Back</Link>
          </Button>
        ) : (
          <Link href="/" className="text-sm font-medium tracking-wide">
            Vic checklist
          </Link>
        )}
        <div className="min-w-0 flex-1 truncate font-heading text-lg">
          {title}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void onImport(file);
            }
          }}
        />
        <Button
          variant="outline"
          className="min-h-11"
          disabled={importing}
          onClick={() => inputRef.current?.click()}
        >
          {importing ? "Importing…" : "Import ZIP"}
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
}
