"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/lib/client-store";
import { MUNICIPALITIES } from "@/lib/scout/municipalities";
import type { Site, Typology } from "@/lib/types";

export function NewProjectForm({ typology }: { typology: Typology }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [site, setSite] = useState<Site>({
    name: "",
    typology,
    address: "",
    municipality: "",
    planningScheme: "",
    zone: "",
    overlays: [],
    storeys: typology === "apartment" ? 5 : 2,
    dwellingCount: typology === "house" ? 1 : 2,
    lotAreaSqm: null,
    notes: "",
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const created = await createProject(site);
      router.push(`/p/${created.project.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create");
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <Field label="Project name" htmlFor="name">
        <Input
          id="name"
          required
          className="min-h-11"
          value={site.name}
          onChange={(event) => setSite({ ...site, name: event.target.value })}
        />
      </Field>
      <Field label="Address" htmlFor="address">
        <Input
          id="address"
          className="min-h-11"
          value={site.address}
          onChange={(event) => setSite({ ...site, address: event.target.value })}
        />
      </Field>
      <Field label="Municipality" htmlFor="municipality">
        <Input
          id="municipality"
          list="new-municipalities"
          className="min-h-11"
          placeholder="e.g. Yarra"
          value={site.municipality}
          onChange={(event) =>
            setSite({ ...site, municipality: event.target.value })
          }
        />
        <datalist id="new-municipalities">
          {MUNICIPALITIES.map((row) => (
            <option key={row.schemeCode} value={row.name} />
          ))}
        </datalist>
      </Field>
      <Field label="Zone" htmlFor="zone">
        <Input
          id="zone"
          className="min-h-11"
          placeholder="e.g. GRZ1"
          value={site.zone}
          onChange={(event) => setSite({ ...site, zone: event.target.value })}
        />
      </Field>
      <Field label="Overlays (comma separated)" htmlFor="overlays">
        <Input
          id="overlays"
          className="min-h-11"
          placeholder="HO, DDO, SBO"
          value={site.overlays.join(", ")}
          onChange={(event) =>
            setSite({
              ...site,
              overlays: event.target.value
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Storeys" htmlFor="storeys">
          <Input
            id="storeys"
            type="number"
            min={1}
            className="min-h-11"
            value={site.storeys}
            onChange={(event) =>
              setSite({ ...site, storeys: Number(event.target.value) || 1 })
            }
          />
        </Field>
        <Field label="Dwellings" htmlFor="dwellings">
          <Input
            id="dwellings"
            type="number"
            min={1}
            className="min-h-11"
            value={site.dwellingCount}
            onChange={(event) =>
              setSite({
                ...site,
                dwellingCount: Number(event.target.value) || 1,
              })
            }
          />
        </Field>
      </div>
      <Field label="Lot area m²" htmlFor="lot">
        <Input
          id="lot"
          type="number"
          min={0}
          className="min-h-11"
          value={site.lotAreaSqm ?? ""}
          onChange={(event) =>
            setSite({
              ...site,
              lotAreaSqm: event.target.value ? Number(event.target.value) : null,
            })
          }
        />
      </Field>
      <Field label="Brief notes" htmlFor="notes">
        <Textarea
          id="notes"
          className="min-h-24 text-base"
          value={site.notes}
          onChange={(event) => setSite({ ...site, notes: event.target.value })}
        />
      </Field>
      <Button type="submit" className="min-h-11 w-full" disabled={pending}>
        {pending ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
