type Point = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  points: Point[];
  accent?: "blue" | "emerald" | "violet" | "amber";
};

const accentMap = {
  blue: "from-blue-500 to-blue-400",
  emerald: "from-emerald-500 to-emerald-400",
  violet: "from-violet-500 to-violet-400",
  amber: "from-amber-500 to-amber-400",
};

export default function AdminBarChart({ title, points, accent = "blue" }: Props) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">{title}</h3>
      <div className="mt-6 flex h-48 items-end gap-2 sm:gap-3">
        {points.map((point) => {
          const height = Math.max((point.value / max) * 100, point.value > 0 ? 8 : 0);

          return (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 sm:text-xs">{point.value}</span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-lg bg-gradient-to-t ${accentMap[accent]} opacity-90 transition-all`}
                  style={{ height: `${height}%` }}
                  title={`${point.label}: ${point.value}`}
                />
              </div>
              <span className="max-w-full truncate text-[10px] text-gray-500 sm:text-xs">{point.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
