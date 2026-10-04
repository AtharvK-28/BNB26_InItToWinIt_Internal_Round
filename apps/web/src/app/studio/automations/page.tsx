"use client";

import { useState } from "react";
import { BellRing, CalendarOff, Mail, MessageCircle, MessagesSquare, Plus, Scale, Wand2, type LucideIcon } from "lucide-react";
import { PageTitle, StudioPage } from "@/components/studio/Shell";
import { AiSpark, AiThinking, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Overlay";
import { PlatformBadge } from "@/components/ui/PlatformIcon";
import { creatorBrief, runAi } from "@/lib/ai/client";
import { useApp, useUi } from "@/lib/store";
import type { AiSource, Automation, AutomationTrigger } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

const TRIGGER_ICON: Record<AutomationTrigger, LucideIcon> = {
  comment_keyword: MessageCircle,
  dm_keyword: MessagesSquare,
  new_inquiry: Mail,
  invoice_overdue: BellRing,
  post_scheduled: Scale,
  collab_request: MessagesSquare,
  weekly: CalendarOff,
};

const TEMPLATES: { trigger: AutomationTrigger; name: string; detail: string; action: string }[] = [
  { trigger: "comment_keyword", name: "Comment-to-DM", detail: "Someone comments a keyword on a post", action: "Send them a DM with a link" },
  { trigger: "dm_keyword", name: "DM keyword reply", detail: "A DM contains a keyword", action: "Reply automatically" },
  { trigger: "new_inquiry", name: "Brand inquiry auto-reply", detail: "A new brand email arrives", action: "Reply with my media kit and packages" },
  { trigger: "invoice_overdue", name: "Payment follow-ups", detail: "An invoice is overdue", action: "Send escalating reminders" },
];

export default function AutomationsPage() {
  return (
    <StudioPage>
      <Automations />
    </StudioPage>
  );
}

function Automations() {
  const automations = useApp((s) => s.automations);
  const toggle = useApp((s) => s.toggleAutomation);
  const quickReplies = useApp((s) => s.quickReplies);
  const [creating, setCreating] = useState(false);
  const active = automations.filter((a) => a.on).length;
  const runs = automations.reduce((s, a) => s + a.runs, 0);

  return (
    <>
      <PageTitle
        title="Automations"
        sub="CreatorAI handles the repetitive replies and follow-ups — you stay in control of every rule."
        right={
          <Button variant="dark" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New automation
          </Button>
        }
      />

      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Active automations" value={`${active} of ${automations.length}`} />
        <Stat label="Actions taken" value={runs.toLocaleString("en-US")} />
        <Stat label="Saved replies" value={`${quickReplies.length}`} />
      </div>

      <div className="space-y-3">
        {automations.map((a) => {
          const Icon = TRIGGER_ICON[a.trigger];
          return (
            <div key={a.id} className={cn("flex gap-4 rounded-2xl border p-5 transition", a.on ? "border-line-soft" : "border-line-soft bg-surface/60")}>
              <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                <Icon className="size-5" />
                {a.platform && <PlatformBadge platform={a.platform} size={18} className="absolute -right-1.5 -bottom-1.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{a.name}</span>
                  {a.metric && a.on && <span className="rounded-full bg-babu-soft px-2 py-0.5 text-[11px] font-semibold text-babu">{a.metric}</span>}
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  <b className="font-semibold text-ink">When</b> {a.triggerDetail.charAt(0).toLowerCase() + a.triggerDetail.slice(1)} <b className="font-semibold text-ink">→</b> {a.action.charAt(0).toLowerCase() + a.action.slice(1)}
                </p>
                {a.message && <p className="mt-2 rounded-xl bg-surface px-3 py-2 text-sm">“{a.message}”</p>}
                <p className="mt-2 text-xs text-ink-2">{a.runs ? `Ran ${a.runs.toLocaleString("en-US")} times` : "Hasn't run yet"}</p>
              </div>
              <Toggle on={a.on} onChange={() => toggle(a.id)} label={`Toggle ${a.name}`} />
            </div>
          );
        })}
      </div>

      <SavedReplies />

      <p className="mt-8 text-xs text-ink-2">DM automations only message people who comment or message you first, through each platform&apos;s official messaging tools.</p>

      {creating && <CreateAutomation onClose={() => setCreating(false)} />}
    </>
  );
}

function SavedReplies() {
  const quickReplies = useApp((s) => s.quickReplies);
  return (
    <section className="mt-12">
      <h2 className="mb-1 text-[22px] font-semibold">Saved replies</h2>
      <p className="mb-5 text-sm text-ink-2">One tap to insert from the Inbox composer.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {quickReplies.map((q) => (
          <div key={q.id} className="rounded-2xl border border-line-soft p-4">
            <div className="text-sm font-semibold">{q.label}</div>
            <p className="mt-1 text-sm text-ink-2">{q.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CreateAutomation({ onClose }: { onClose: () => void }) {
  const profile = useApp((s) => s.profile);
  const content = useApp((s) => s.content);
  const save = useApp((s) => s.saveAutomation);
  const toast = useUi((s) => s.toast);
  const upcoming = content.filter((c) => c.status !== "published").slice(0, 6);
  const [tpl, setTpl] = useState(TEMPLATES[0]);
  const [post, setPost] = useState(upcoming[0]?.title ?? "");
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");
  const [source, setSource] = useState<AiSource>();
  const [loading, setLoading] = useState(false);
  const needsMessage = tpl.trigger === "comment_keyword" || tpl.trigger === "dm_keyword";

  const suggest = async () => {
    setLoading(true);
    try {
      const res = await runAi("dm", { creator: creatorBrief(profile), post, goal: "Send the link mentioned in the post" });
      setKeyword(res.data.keyword);
      setMessage(res.data.message.replace("{link}", "mayamakes.example/gear"));
      setSource(res.source);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New automation"
      footer={
        <div className="flex justify-end">
          <Button
            variant="dark"
            disabled={needsMessage && (!keyword.trim() || !message.trim())}
            onClick={() => {
              const a: Automation = {
                id: uid("au"),
                name: needsMessage ? `“${keyword.toUpperCase()}” → DM` : tpl.name,
                trigger: tpl.trigger,
                triggerDetail: needsMessage ? `Someone ${tpl.trigger === "comment_keyword" ? "comments" : "DMs"} “${keyword.toUpperCase()}”${post && tpl.trigger === "comment_keyword" ? ` on “${post}”` : ""}` : tpl.detail,
                action: tpl.action,
                message: needsMessage ? message : undefined,
                on: true,
                runs: 0,
                platform: tpl.trigger === "comment_keyword" ? "instagram" : tpl.trigger === "dm_keyword" ? "tiktok" : "email",
              };
              save(a);
              toast("Automation is live.");
              onClose();
            }}
          >
            Turn on
          </Button>
        </div>
      }
    >
      <div className="space-y-6 p-6">
        <div className="grid gap-2 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const Icon = TRIGGER_ICON[t.trigger];
            return (
              <button key={t.trigger} onClick={() => setTpl(t)} className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition", tpl === t ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink")}>
                <Icon className="mt-0.5 size-5 shrink-0" />
                <span>
                  <span className="block text-sm font-semibold">{t.name}</span>
                  <span className="block text-xs text-ink-2">{t.detail}</span>
                </span>
              </button>
            );
          })}
        </div>

        {needsMessage ? (
          <div className="space-y-3">
            {tpl.trigger === "comment_keyword" && (
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Which post?</span>
                <select value={post} onChange={(e) => setPost(e.target.value)} className="w-full rounded-lg border border-[#b0b0b0] px-3 py-2.5 text-sm outline-none">
                  {upcoming.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button onClick={suggest} disabled={loading} className="ai-border flex w-full items-center gap-3 rounded-2xl p-4 text-left text-sm font-semibold transition hover:shadow-soft">
              <AiSpark className="size-4" /> Suggest a keyword and message
            </button>
            {loading && <AiThinking label="Writing your DM" />}
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Keyword</span>
                <input value={keyword} onChange={(e) => setKeyword(e.target.value.toUpperCase())} placeholder="LIST" className="w-full rounded-lg border border-[#b0b0b0] px-3 py-2.5 text-sm font-semibold uppercase outline-none focus:border-ink" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Auto-DM</span>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-[#b0b0b0] px-3 py-2.5 text-sm outline-none focus:border-ink" />
              </label>
            </div>
            {source && <SourceBadge source={source} />}
          </div>
        ) : (
          <p className="flex gap-2 rounded-xl bg-surface p-4 text-sm">
            <Wand2 className="mt-0.5 size-4 shrink-0" /> {tpl.action}. You can pause it any time.
          </p>
        )}
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line-soft p-4">
      <div className="text-sm text-ink-2">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
