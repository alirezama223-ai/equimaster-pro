type TrustMetric = {
  key: string;
  label: string;
  value: string;
  accent?: "blue" | "emerald" | "violet" | "amber";
};

type Props = {
  metrics: TrustMetric[];
};

const accentStyles = {
  blue: "border-blue-500/25 bg-blue-600/10 text-blue-100",
  emerald: "border-emerald-500/25 bg-emerald-600/10 text-emerald-100",
  violet: "border-violet-500/25 bg-violet-600/10 text-violet-100",
  amber: "border-amber-500/25 bg-amber-600/10 text-amber-100",
} as const;

export default function SellerTrustCards({ metrics }: Props) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.key}
          className={`rounded-2xl border p-4 transition duration-300 sm:p-5 ${accentStyles[metric.accent ?? "blue"]} [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-lg`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{metric.label}</p>
          <p className="mt-2 text-2xl font-black leading-none sm:text-3xl">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}
