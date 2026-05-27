import { Mail, MapPin, Phone, UserRound } from "lucide-react";

export default function LeadPanel({ lead }: { lead?: any }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--arc)]">Lead Data</p>
      <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">Captured fields</h2>
      <div className="mt-4 space-y-3">
        <LeadField icon={<UserRound className="h-4 w-4" />} label="Name" value={lead?.name} />
        <LeadField icon={<Phone className="h-4 w-4" />} label="Phone" value={lead?.phone} />
        <LeadField icon={<Mail className="h-4 w-4" />} label="Email" value={lead?.email} />
        <LeadField icon={<MapPin className="h-4 w-4" />} label="City" value={lead?.city} />
      </div>
      <div className="mt-4 rounded-lg bg-[var(--canvas)] p-4 text-sm text-[var(--slate)]">
        {lead?.requirement || "Lead capture fills automatically when customers share configured fields in chat."}
      </div>
    </section>
  );
}

function LeadField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-[var(--canvas)] px-3 py-2">
      <span className="text-[var(--slate)]">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--slate)]">{label}</div>
        <div className="truncate text-sm font-semibold text-[var(--ink)]">{value || "Not captured"}</div>
      </div>
    </div>
  );
}
