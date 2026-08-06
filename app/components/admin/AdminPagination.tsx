"use client";

type Props = {
  page: number;
  hasMore: boolean;
  disabled?: boolean;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
  onPrevious: () => void;
  onNext: () => void;
};

export default function AdminPagination({
  page,
  hasMore,
  disabled,
  previousLabel,
  nextLabel,
  pageLabel,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-blue-500/40 disabled:opacity-50"
        disabled={disabled || page <= 1}
        onClick={onPrevious}
      >
        {previousLabel}
      </button>
      <p className="text-sm text-gray-500">{pageLabel}</p>
      <button
        type="button"
        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-blue-500/40 disabled:opacity-50"
        disabled={disabled || !hasMore}
        onClick={onNext}
      >
        {nextLabel}
      </button>
    </div>
  );
}
