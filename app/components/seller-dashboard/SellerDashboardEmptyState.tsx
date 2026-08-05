type Props = {
  title: string;
  message: string;
  icon?: string;
};

export default function SellerDashboardEmptyState({
  title,
  message,
  icon = "✦",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#08111F] text-xl text-blue-300"
      >
        {icon}
      </span>
      <p className="mt-4 text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-400">{message}</p>
    </div>
  );
}
