type Props = {
  title: string;
  description: string;
  clearFiltersLabel?: string;
  onClearFilters?: () => void;
  className?: string;
};

export default function MarketplaceBrowseEmptyState({
  title,
  description,
  clearFiltersLabel,
  onClearFilters,
  className = "",
}: Props) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#111827] to-[#0a1220] px-5 py-12 text-center sm:px-10 sm:py-16 ${className}`}
    >
      <div className="mx-auto mb-8 flex h-36 w-36 items-center justify-center sm:h-48 sm:w-48">
        <svg
          viewBox="0 0 200 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          aria-hidden="true"
        >
          <ellipse cx="100" cy="130" rx="72" ry="12" fill="rgba(59,130,246,0.12)" />
          <path
            d="M48 98c8-28 28-44 52-44s44 16 52 44"
            stroke="rgba(59,130,246,0.35)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M62 96c12-18 28-26 38-26s26 8 38 26"
            fill="rgba(30,58,138,0.25)"
            stroke="rgba(96,165,250,0.4)"
            strokeWidth="1.5"
          />
          <circle cx="138" cy="72" r="10" fill="rgba(59,130,246,0.2)" stroke="rgba(96,165,250,0.5)" />
          <path
            d="M72 96h56M88 78l-8 18M112 78l8 18"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M58 52c6-10 18-16 30-14 10 2 18 10 22 20"
            stroke="rgba(96,165,250,0.45)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="78" cy="58" r="3" fill="rgba(147,197,253,0.8)" />
          <path
            d="M118 34l8 8-8 8M126 42H146"
            stroke="rgba(59,130,246,0.5)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-white sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-400 sm:mt-4 sm:text-base">
        {description}
      </p>

      {onClearFilters && clearFiltersLabel ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-8 inline-flex w-full min-h-12 max-w-sm items-center justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white transition [@media(hover:hover)]:hover:bg-blue-500 sm:w-auto"
        >
          {clearFiltersLabel}
        </button>
      ) : null}
    </div>
  );
}
