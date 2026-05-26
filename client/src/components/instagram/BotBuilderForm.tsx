import { useMemo, useState } from "react";
import { Bot, Check, Power, Save, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { createInstagramBot, updateInstagramBot } from "@/services/instagramApi";

const tones = ["friendly", "professional", "casual", "luxury", "sales-focused"];
const languages = ["auto-detect", "English", "Hindi", "Hinglish"];
const goals = ["support", "sales", "course info", "booking", "product FAQ"];

const defaultForm = {
  bot_name: "InstaPilot Assistant",
  business_name: "",
  tone: "friendly",
  language: "auto-detect",
  bot_goal: "support",
  fallback_message: "I am not fully sure about that. Our team will help you shortly.",
  welcome_message: "Hi! Welcome to {{business_name}}. How can I help you today?",
  quick_replies: ["Pricing", "Services", "Book a Call", "Talk to Human"],
  handoff_keywords: ["human", "agent", "call me", "support"],
  lead_fields: ["name", "phone", "email", "requirement"],
  confidence_threshold: 0.68,
  daily_reply_limit: 250,
  is_active: false,
  human_handoff_enabled: true,
};

export default function BotBuilderForm({
  accounts,
  selectedBot,
  onSaved,
}: {
  accounts: any[];
  selectedBot?: any;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<any>(() => selectedBot || { ...defaultForm, instagram_account_id: accounts[0]?.id || "" });
  const [saving, setSaving] = useState(false);

  const activeAccountOptions = useMemo(() => accounts.filter((account) => account.is_connected), [accounts]);

  const setField = (key: string, value: unknown) => setForm((current: any) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      if (form.id) await updateInstagramBot(form.id, form);
      else await createInstagramBot(form);
      toast.success("Bot saved");
      onSaved();
      if (!form.id) setForm({ ...defaultForm, instagram_account_id: activeAccountOptions[0]?.id || "" });
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to save bot");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--arc)]">Bot Builder</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-[var(--ink)]">
            <Bot className="h-5 w-5" />
            {form.id ? "Edit AI bot" : "Create AI bot"}
          </h2>
        </div>
        <Button type="button" onClick={save} disabled={saving || !activeAccountOptions.length} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Bot"}
        </Button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Field label="Instagram account">
          <select value={form.instagram_account_id || ""} onChange={(e) => setField("instagram_account_id", e.target.value)} className="instapilot-input">
            <option value="">Select account</option>
            {activeAccountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                @{account.instagram_username || account.instagram_business_account_id}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bot name">
          <input value={form.bot_name || ""} onChange={(e) => setField("bot_name", e.target.value)} className="instapilot-input" />
        </Field>
        <Field label="Business name">
          <input value={form.business_name || ""} onChange={(e) => setField("business_name", e.target.value)} className="instapilot-input" placeholder="Your brand or store" />
        </Field>
        <Field label="Bot purpose">
          <Segmented options={goals} value={form.bot_goal} onChange={(value) => setField("bot_goal", value)} />
        </Field>
        <Field label="Tone">
          <Segmented options={tones} value={form.tone} onChange={(value) => setField("tone", value)} />
        </Field>
        <Field label="Language">
          <Segmented options={languages} value={form.language} onChange={(value) => setField("language", value)} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Field label="Welcome message">
          <textarea value={form.welcome_message || ""} onChange={(e) => setField("welcome_message", e.target.value)} rows={3} className="instapilot-input" />
        </Field>
        <Field label="Fallback message">
          <textarea value={form.fallback_message || ""} onChange={(e) => setField("fallback_message", e.target.value)} rows={3} className="instapilot-input" />
        </Field>
        <Field label="Quick replies">
          <TagInput value={form.quick_replies || []} onChange={(value) => setField("quick_replies", value)} />
        </Field>
        <Field label="Human handoff keywords">
          <TagInput value={form.handoff_keywords || []} onChange={(value) => setField("handoff_keywords", value)} />
        </Field>
        <Field label="Lead fields">
          <TagInput value={form.lead_fields || []} onChange={(value) => setField("lead_fields", value)} />
        </Field>
        <div className="grid gap-3 rounded-lg border border-black/10 bg-[var(--canvas)] p-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setField("is_active", e.target.checked)} />
            <Power className="h-4 w-4" />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <input type="checkbox" checked={form.human_handoff_enabled !== false} onChange={(e) => setField("human_handoff_enabled", e.target.checked)} />
            <Check className="h-4 w-4" />
            Handoff
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <SlidersHorizontal className="h-4 w-4" />
            <input type="number" min="0.3" max="0.95" step="0.01" value={form.confidence_threshold || 0.68} onChange={(e) => setField("confidence_threshold", Number(e.target.value))} className="w-20 rounded border border-black/10 px-2 py-1" />
          </label>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[var(--slate)]">{label}</span>
      {children}
    </label>
  );
}

function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          type="button"
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
            value === option ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-black/10 bg-[var(--canvas)] text-[var(--slate)] hover:text-[var(--ink)]"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function TagInput({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  return (
    <input
      value={value.join(", ")}
      onChange={(event) => onChange(event.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
      className="instapilot-input"
      placeholder="Comma separated"
    />
  );
}
