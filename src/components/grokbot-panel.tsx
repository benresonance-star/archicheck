"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GrokBotBrief, ProjectDocument, Stage } from "@/lib/types";

export function GrokbotPanel({
  bot,
  project,
  stage,
}: {
  bot: GrokBotBrief;
  project: ProjectDocument;
  stage: Stage;
}) {
  const [copied, setCopied] = useState(false);
  const brief = [
    `Spin up a Grok Bot named ${bot.name}.`,
    `Job: ${bot.title} for stage ${stage.number} ${stage.title}.`,
    bot.description,
    "",
    "First task:",
    bot.firstTask,
    "",
    `Project: ${project.site.name} (${project.site.typology}, rev ${project.revision}).`,
    `Template: ${project.template.id} ${project.template.version} checksum ${project.template.checksum}.`,
    "Attach the exported ZIP or project.json. Do not lodge permits.",
    "",
    "Approval rules:",
    ...bot.approvalRules.map((rule) => `- ${rule}`),
  ].join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      toast.success("Grok Bot brief copied");
    } catch {
      toast.error("Copy failed — select the brief text instead");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grok Bot · {bot.name}</CardTitle>
        <CardDescription>{bot.title}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed">{bot.description}</p>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">
          {brief}
        </pre>
        <Button className="min-h-11 w-full" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy first task"}
        </Button>
      </CardContent>
    </Card>
  );
}
