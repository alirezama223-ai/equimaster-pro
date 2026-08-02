import { ReactNode } from "react";

export type DashboardCardVariant = "default" | "emphasis" | "subtle";
export type DashboardCardHeaderSize = "default" | "compact";

type DashboardCardHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  titleAs?: "h2" | "h3";
  headerSize?: DashboardCardHeaderSize;
};

type DashboardCardProps = DashboardCardHeaderProps & {
  children?: ReactNode;
  className?: string;
  variant?: DashboardCardVariant;
  loading?: boolean;
  contentClassName?: string;
};

const VARIANT_CLASS: Record<DashboardCardVariant, string> = {
  default: "border-white/10 bg-[#111827]",
  emphasis: "border-blue-500/30 bg-[#111827]",
  subtle: "border-white/10 bg-[#111827]/90",
};

function LoadingPlaceholder() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}

export function DashboardCardHeader({
  eyebrow,
  title,
  description,
  icon,
  action,
  titleAs: TitleTag = "h2",
  headerSize = "default",
  hasContentBelow = false,
}: DashboardCardHeaderProps & { hasContentBelow?: boolean }) {
  const titleClassName =
    headerSize === "compact"
      ? `${eyebrow ? "mt-2" : ""} text-sm font-semibold text-white`
      : "mt-2 text-xl sm:text-2xl font-bold text-white";

  if (!title && !description && !eyebrow && !icon && !action) {
    return null;
  }

  const titleBlock = (
    <div className="min-w-0">
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.2em] text-blue-400">{eyebrow}</p>
      ) : null}
      <TitleTag className={titleClassName}>{title}</TitleTag>
      {description ? (
        <p className={`${headerSize === "compact" ? "mt-1" : "mt-2"} text-sm text-gray-400`}>
          {description}
        </p>
      ) : null}
    </div>
  );

  const headerClassName = hasContentBelow ? "mb-5" : "";

  if (headerSize === "compact" && action && !icon) {
    return (
      <header className={headerClassName}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {titleBlock}
          <div className="shrink-0">{action}</div>
        </div>
      </header>
    );
  }

  return (
    <header className={headerClassName}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#08111F] text-blue-400">
              {icon}
            </div>
          ) : null}
          {titleBlock}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function DashboardCardContent({
  children,
  loading = false,
  className = "",
}: {
  children: ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex-1 ${className}`} aria-busy={loading}>
      {loading ? <LoadingPlaceholder /> : children}
    </div>
  );
}

export default function DashboardCard({
  eyebrow,
  title,
  description,
  icon,
  action,
  titleAs,
  headerSize,
  children,
  className = "",
  variant = "default",
  loading = false,
  contentClassName = "",
}: DashboardCardProps) {
  const showContent = loading || children != null;

  return (
    <section
      className={`flex h-full flex-col rounded-3xl border p-5 sm:p-6 ${VARIANT_CLASS[variant]} ${className}`}
    >
      <DashboardCardHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        icon={icon}
        action={action}
        titleAs={titleAs}
        headerSize={headerSize}
        hasContentBelow={showContent}
      />
      {showContent ? (
        <DashboardCardContent loading={loading} className={contentClassName}>
          {children}
        </DashboardCardContent>
      ) : null}
    </section>
  );
}
