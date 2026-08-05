import type { ButtonHTMLAttributes, ReactNode } from "react";

export const quickActionClassName =
  "flex h-11 w-full min-w-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-2 text-gray-200 transition duration-200 [@media(hover:hover)]:hover:border-white/25 [@media(hover:hover)]:hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45";

type Props = {
  children: ReactNode;
  className?: string;
  active?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function MarketplaceCardQuickAction({
  children,
  className = "",
  active = false,
  ...props
}: Props) {
  return (
    <button
      type="button"
      {...props}
      className={`${quickActionClassName} ${
        active
          ? "border-blue-500/50 bg-blue-600/20 text-blue-200 [@media(hover:hover)]:hover:bg-blue-600/30"
          : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}
