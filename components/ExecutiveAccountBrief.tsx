import { ExecutiveAccountBrief as ExecutiveAccountBriefData } from "@/lib/metrics";

type ExecutiveAccountBriefProps = {
  brief: ExecutiveAccountBriefData;
  compact?: boolean;
};

const sections: Array<{ key: keyof ExecutiveAccountBriefData; title: string }> = [
  { key: "accountStatus", title: "Account status" },
  { key: "whatChanged", title: "What changed this period" },
  { key: "commercialImpact", title: "Why it matters commercially" },
  { key: "serviceRisks", title: "Top service risks" },
  { key: "marginLeakageSignals", title: "Top margin leakage signals" },
  { key: "expansionOpportunities", title: "Expansion opportunities" },
  { key: "recommendedInternalActions", title: "Recommended internal actions" },
  { key: "customerFacingTalkingPoints", title: "Customer-facing talking points" }
];

export function ExecutiveAccountBrief({ brief, compact = false }: ExecutiveAccountBriefProps) {
  return (
    <section className="panel p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-title">Deterministic Executive Brief</p>
          <h2 className="mt-1 text-2xl font-semibold">Strategic account readout</h2>
        </div>
        <p className="text-sm text-steel">Generated from mock revenue, margin, service, lane, and action-item data.</p>
      </div>
      <div className={`mt-6 grid gap-4 ${compact ? "lg:grid-cols-2" : "xl:grid-cols-2"}`}>
        {sections.map((section) => (
          <article key={section.key} className="rounded-lg border border-ink/10 bg-white p-4">
            <p className="metric-label">{section.title}</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-steel">
              {brief[section.key].map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
