import { ScoreLabel } from "@/lib/metrics";

type AccountHealthBadgeProps = {
  score: number;
  label?: ScoreLabel;
};

export function AccountHealthBadge({ score, label = score >= 85 ? "Healthy" : score >= 70 ? "Watch" : score >= 55 ? "At Risk" : "Critical" }: AccountHealthBadgeProps) {
  const tone =
    label === "Healthy"
      ? "border-moss/20 bg-moss/10 text-moss"
      : label === "Watch"
        ? "border-amberline/25 bg-amberline/10 text-amberline"
        : label === "At Risk"
          ? "border-signal/20 bg-signal/10 text-signal"
          : "border-ink/20 bg-ink/10 text-ink";

  return (
    <span className={`inline-flex min-w-[104px] items-center justify-center rounded-md border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {label} {score}
    </span>
  );
}
