import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export default function HorseDetailSection({
  id,
  title,
  subtitle,
  children,
  className = "",
}: Props) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`scroll-mt-28 rounded-2xl border border-white/[0.08] bg-[#0f1729]/60 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.22)] sm:p-6 lg:p-8 ${className}`}
    >
      <div className="mb-5 sm:mb-6">
        <h2 id={`${id}-heading`} className="text-xl font-bold text-white sm:text-2xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
