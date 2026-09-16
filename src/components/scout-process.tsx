"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { loadScoutSettings, saveScoutSettings } from "@/lib/client-store";
import {
  CADENCE_DAYS,
  categoryLabel,
  defaultScoutSettings,
  runnerLabel,
  runnerSummary,
  SCOUT_RUNNERS,
  type ScoutSettings,
} from "@/lib/scout/settings";
import {
  SOURCE_CATEGORIES,
  type SourceCategory,
  type WatchSource,
} from "@/lib/scout/watch-list";
import { TYPOLOGIES, type Typology } from "@/lib/types";

export function ScoutProcessForm() {
  const [settings, setSettings] = useState<ScoutSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newFlag, setNewFlag] = useState("");
  const [newCategory, setNewCategory] = useState<SourceCategory>("other");

  useEffect(() => {
    void loadScoutSettings().then(setSettings);
  }, []);

  async function persist(next: ScoutSettings, quiet = false) {
    setSaving(true);
    try {
      setSettings(await saveScoutSettings(next));
      if (!quiet) {
        toast.success("Scout process saved on this phone");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <p className="text-sm text-muted-foreground">Loading process…</p>;
  }

  const current = settings;

  function patch(partial: Partial<ScoutSettings>) {
    void persist({ ...current, ...partial }, true);
  }

  function toggleSource(id: string, enabled: boolean) {
    void persist(
      {
        ...current,
        sources: current.sources.map((source) =>
          source.id === id ? { ...source, enabled } : source,
        ),
      },
      true,
    );
  }

  function updateSource(id: string, patchSource: Partial<WatchSource>) {
    void persist(
      {
        ...current,
        sources: current.sources.map((source) =>
          source.id === id ? { ...source, ...patchSource } : source,
        ),
      },
      true,
    );
  }

  function addSite() {
    const url = newUrl.trim();
    if (!newTitle.trim() || !url.startsWith("https://")) {
      toast.error("Need a title and an https URL");
      return;
    }
    const source: WatchSource = {
      id: `custom-${crypto.randomUUID()}`,
      title: newTitle.trim(),
      url,
      scope: "statewide",
      category: newCategory,
      enabled: true,
      builtin: false,
      itemIds: ["pd-planning-context"],
      flag: newFlag.trim() || "Read this page and flag checklist items if it affects Victorian residential work.",
      proposedDetail: `${newTitle.trim()} has changed. Recheck this project against the published page.`,
      appliesTo: [...TYPOLOGIES],
    };
    void persist({ ...current, sources: [...current.sources, source] });
    setNewTitle("");
    setNewUrl("");
    setNewFlag("");
  }

  function removeSite(id: string) {
    void persist({
      ...current,
      sources: current.sources.filter((source) => source.id !== id),
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-heading text-2xl">What scout is used</h2>
        <p className="text-sm text-muted-foreground">
          {runnerSummary(settings.runner, settings.otherLabel)}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SCOUT_RUNNERS.map((runner) => (
            <Button
              key={runner}
              variant={settings.runner === runner ? "default" : "outline"}
              className="min-h-11"
              onClick={() => patch({ runner })}
            >
              {runnerLabel(runner)}
            </Button>
          ))}
        </div>
        {settings.runner === "other" ? (
          <div className="space-y-2">
            <Label htmlFor="other-label">Name of that scout</Label>
            <Input
              id="other-label"
              className="min-h-11"
              placeholder="e.g. Practice research lead"
              value={settings.otherLabel}
              onChange={(event) =>
                setSettings({ ...settings, otherLabel: event.target.value })
              }
              onBlur={(event) =>
                void persist({ ...settings, otherLabel: event.target.value })
              }
            />
            <Label htmlFor="other-notes">How they run it</Label>
            <Textarea
              id="other-notes"
              className="min-h-24 text-base"
              value={settings.otherNotes}
              onChange={(event) =>
                setSettings({ ...settings, otherNotes: event.target.value })
              }
              onBlur={(event) =>
                void persist({ ...settings, otherNotes: event.target.value })
              }
            />
          </div>
        ) : null}
        {settings.runner === "grokbot" ? (
          <p className="text-sm text-muted-foreground">
            Use Copy Grok Bot brief on the noticeboard. The bot must not change
            answers; you still accept wording on a project.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">When it runs</h2>
        <p className="text-sm text-muted-foreground">
          The noticeboard badge goes due after this many days. There is no
          Monday ping — you tap Check sites now (or copy the Grok brief).
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CADENCE_DAYS.map((days) => (
            <Button
              key={days}
              variant={settings.cadenceDays === days ? "default" : "outline"}
              className="min-h-11"
              onClick={() => patch({ cadenceDays: days })}
            >
              {days === 1 ? "Daily" : `${days} days`}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Sites and what they look for</h2>
        <p className="text-sm text-muted-foreground">
          Defaults cover NCC, ARBV, AIA, Master Builders Victoria, HIA, BPC
          news, planning codes and the Gazette. Toggle, edit the URL, or add
          your own.
        </p>
        <div className="space-y-3">
          {settings.sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              disabled={saving}
              onEnabled={(enabled) => toggleSource(source.id, enabled)}
              onChange={(patchSource) => updateSource(source.id, patchSource)}
              onRemove={
                source.builtin ? undefined : () => removeSite(source.id)
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Add a site</h2>
        <Label htmlFor="new-title">Title</Label>
        <Input
          id="new-title"
          className="min-h-11"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
        />
        <Label htmlFor="new-url">https URL</Label>
        <Input
          id="new-url"
          className="min-h-11"
          placeholder="https://"
          value={newUrl}
          onChange={(event) => setNewUrl(event.target.value)}
        />
        <Label htmlFor="new-flag">What it looks for</Label>
        <Textarea
          id="new-flag"
          className="min-h-20 text-base"
          value={newFlag}
          onChange={(event) => setNewFlag(event.target.value)}
        />
        <Label htmlFor="new-category">Type</Label>
        <select
          id="new-category"
          className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base"
          value={newCategory}
          onChange={(event) =>
            setNewCategory(event.target.value as SourceCategory)
          }
        >
          {SOURCE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
        <Button className="min-h-11 w-full" onClick={addSite}>
          Add site
        </Button>
        <Button
          variant="ghost"
          className="min-h-11 w-full"
          onClick={() => void persist(defaultScoutSettings())}
        >
          Reset to bundled NCC / ARBV / AIA / builders list
        </Button>
      </section>
    </div>
  );
}

function SourceCard({
  source,
  disabled,
  onEnabled,
  onChange,
  onRemove,
}: {
  source: WatchSource;
  disabled: boolean;
  onEnabled: (enabled: boolean) => void;
  onChange: (patch: Partial<WatchSource>) => void;
  onRemove?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{categoryLabel(source.category)}</Badge>
              {source.builtin ? <Badge variant="secondary">Bundled</Badge> : <Badge>Custom</Badge>}
              <Badge variant="outline">{typologyShort(source.appliesTo)}</Badge>
            </div>
            <CardTitle className="text-lg">{source.title}</CardTitle>
            <CardDescription>{source.flag}</CardDescription>
          </div>
          <Switch
            checked={source.enabled}
            disabled={disabled}
            onCheckedChange={onEnabled}
            aria-label={`Watch ${source.title}`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor={`${source.id}-url`}>URL</Label>
        <Input
          id={`${source.id}-url`}
          className="min-h-11"
          defaultValue={source.url}
          onBlur={(event) => {
            const url = event.target.value.trim();
            if (url !== source.url) {
              onChange({ url });
            }
          }}
        />
        <Label htmlFor={`${source.id}-flag`}>What it looks for</Label>
        <Textarea
          id={`${source.id}-flag`}
          className="min-h-20 text-base"
          defaultValue={source.flag}
          onBlur={(event) => {
            if (event.target.value !== source.flag) {
              onChange({ flag: event.target.value });
            }
          }}
        />
        {onRemove ? (
          <Button variant="destructive" className="min-h-11" onClick={onRemove}>
            Remove site
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function typologyShort(appliesTo: Typology[]): string {
  if (appliesTo.length === TYPOLOGIES.length) {
    return "All typologies";
  }
  return appliesTo.join(" · ");
}
