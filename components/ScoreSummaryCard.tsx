import { AccountScore } from "@/lib/metrics";

type ScoreSummaryCardProps = {
  title: string;
  score: AccountScore;
};

export function ScoreSummaryCard({ title, score }: ScoreSummaryCardProps) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="metric-label">{title}</p>
          <p className="mt-2 text-3xl font-semibold">{score.score}</p>
        </div>
        <span className={labelClass(score.label)}>{score.label}</span>
      </div>
      <div className="mt-4 grid gap-2">
        {score.factors.map((factor) => (
          <div key={factor.name}>
            <div className="flex items-center justify-between text-xs font-medium text-steel">
              <span>{factor.name}</span>
              <span>
                {factor.points}/{factor.maxPoints}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper">
              <div className="h-full rounded-full bg-harbor" style={{ width: `${(factor.points / factor.maxPoints) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-sm leading-5 text-steel">
        {score.explanations.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function labelClass(label: AccountScore["label"]) {
  const tone =
    label === "Healthy"
      ? "border-moss/20 bg-moss/10 text-moss"
      : label === "Watch"
        ? "border-amberline/25 bg-amberline/10 text-amberline"
        : label === "At Risk"
          ? "border-signal/20 bg-signal/10 text-signal"
          : "border-ink/20 bg-ink/10 text-ink";

  return `rounded-md border px-2.5 py-1 text-xs font-semibold ${tone}`;
}
