import { useEffect, useState } from "react";
import { Database, FileText, Globe2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { addKnowledgeSource, fetchKnowledgeSources } from "@/services/instagramApi";

export default function KnowledgeBaseUploader({ botId }: { botId?: string }) {
  const [sources, setSources] = useState<any[]>([]);
  const [sourceType, setSourceType] = useState("manual");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSources = async () => {
    if (!botId) return;
    setSources(await fetchKnowledgeSources(botId));
  };

  useEffect(() => {
    loadSources().catch(() => null);
  }, [botId]);

  const addSource = async () => {
    if (!botId) {
      toast.error("Save a bot before adding knowledge.");
      return;
    }
    setSaving(true);
    try {
      await addKnowledgeSource({
        bot_id: botId,
        source_type: sourceType,
        title: title || (sourceType === "website" ? url : "Manual knowledge"),
        text: sourceType === "website" ? undefined : text,
        url: sourceType === "website" ? url : undefined,
      });
      toast.success("Knowledge processed");
      setTitle("");
      setText("");
      setUrl("");
      await loadSources();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to process knowledge");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--canvas)] text-[var(--ink)]">
          <Database className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--arc)]">Knowledge Base</p>
          <h2 className="text-xl font-semibold text-[var(--ink)]">Upload business truth</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          {[
            ["manual", FileText, "Text / FAQ"],
            ["pricing", FileText, "Pricing"],
            ["policy", FileText, "Policies"],
            ["product", FileText, "Products"],
            ["website", Globe2, "Website URL"],
          ].map(([type, Icon, label]: any) => (
            <button
              type="button"
              key={type}
              onClick={() => setSourceType(type)}
              className={`flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left text-sm font-semibold ${
                sourceType === type ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-black/10 bg-[var(--canvas)] text-[var(--slate)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="instapilot-input" placeholder="Source title" />
          {sourceType === "website" ? (
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="instapilot-input" placeholder="https://example.com/pricing" />
          ) : (
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className="instapilot-input" placeholder="Paste FAQs, product data, pricing, booking rules, refund policy, or service details." />
          )}
          <Button type="button" onClick={addSource} disabled={saving || !botId} className="gap-2">
            <Plus className="h-4 w-4" />
            {saving ? "Processing..." : "Add Knowledge"}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => (
          <div key={source.id} className="rounded-lg border border-black/10 bg-[var(--canvas)] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-[var(--ink)]">{source.title}</p>
              <span className="rounded bg-white px-2 py-1 text-xs font-bold text-[var(--slate)]">{source.status}</span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--slate)]">{source.source_type}</p>
            <p className="mt-2 text-sm text-[var(--slate)]">{source.knowledge_chunks?.length || 0} chunks indexed</p>
          </div>
        ))}
      </div>
    </section>
  );
}
