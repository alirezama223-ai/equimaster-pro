"use client";

import { memo } from "react";

type SectionLink = {
  id: string;
  label: string;
};

type Props = {
  sections: SectionLink[];
};

function HorseDetailSectionNav({ sections }: Props) {
  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Listing sections"
      className="mb-8 min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max min-w-full gap-2 pb-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-gray-300 transition [@media(hover:hover)]:hover:border-blue-500/30 [@media(hover:hover)]:hover:bg-blue-600/10 [@media(hover:hover)]:hover:text-white"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default memo(HorseDetailSectionNav);
