type Props = {
  title: string;
  description: string;
  className?: string;
};

export default function EmptyState({ title, description, className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-white/10 bg-[#08111F] px-4 py-8 text-center ${className}`}
    >
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}
