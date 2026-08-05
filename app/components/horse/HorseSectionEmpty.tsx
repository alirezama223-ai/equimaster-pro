type Props = {
  message: string;
  className?: string;
};

export default function HorseSectionEmpty({ message, className = "" }: Props) {
  return (
    <div
      className={`rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center ${className}`}
    >
      <div
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg text-gray-500"
        aria-hidden="true"
      >
        —
      </div>
      <p className="text-sm leading-relaxed text-gray-400 sm:text-base">{message}</p>
    </div>
  );
}
