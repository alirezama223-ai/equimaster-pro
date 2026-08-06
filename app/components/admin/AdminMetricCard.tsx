import { Link } from "@/i18n/navigation";

type Props = {
  label: string;
  value: number | string;
  href?: string;
  accent?: "blue" | "emerald" | "amber" | "violet" | "rose";
};

const accentClasses = {
  blue: "from-blue-500/15 to-blue-500/0 border-blue-500/20",
  emerald: "from-emerald-500/15 to-emerald-500/0 border-emerald-500/20",
  amber: "from-amber-500/15 to-amber-500/0 border-amber-500/20",
  violet: "from-violet-500/15 to-violet-500/0 border-violet-500/20",
  rose: "from-rose-500/15 to-rose-500/0 border-rose-500/20",
};

export default function AdminMetricCard({ label, value, href, accent = "blue" }: Props) {
  const content = (
    <div
      className={`rounded-3xl border bg-gradient-to-br p-5 transition hover:border-blue-500/40 ${accentClasses[accent]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
