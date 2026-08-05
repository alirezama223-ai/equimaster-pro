"use client";

import { Link } from "@/i18n/navigation";
import { memo } from "react";
import { useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { MARKETPLACE_PATHS } from "@/app/lib/marketplace/paths";

function SellerDashboardQuickActions() {
  const t = useTranslations("dashboard");

  const quickActions = [
    {
      key: "sell",
      label: t("quickActions.sellHorse.label"),
      description: t("quickActions.sellHorse.description"),
      href: MARKETPLACE_PATHS.createListing,
      icon: "🐎",
    },
    {
      key: "import",
      label: t("quickActions.importHorse.label"),
      description: t("quickActions.importHorse.description"),
      href: MARKETPLACE_PATHS.createListing,
      icon: "📥",
    },
    {
      key: "stallion",
      label: t("quickActions.createStallion.label"),
      description: t("quickActions.createStallion.description"),
      href: "/account",
      icon: "⭐",
    },
    {
      key: "breeder",
      label: t("quickActions.addBreeder.label"),
      description: t("quickActions.addBreeder.description"),
      href: "/account",
      icon: "🏇",
    },
    {
      key: "invite",
      label: t("quickActions.inviteBuyer.label"),
      description: t("quickActions.inviteBuyer.description"),
      href: MARKETPLACE_PATHS.sellerDashboard,
      icon: "✉️",
    },
  ];

  return (
    <DashboardCard
      eyebrow={t("quickActions.eyebrow")}
      title={t("quickActions.title")}
      description={t("quickActions.description")}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {quickActions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className="group flex min-h-11 items-start gap-4 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-blue-600/10 to-transparent p-4 transition duration-300 hover:border-blue-400/40 hover:from-blue-600/30 [@media(hover:hover)]:hover:-translate-y-0.5"
          >
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-lg"
            >
              {action.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">{action.label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-blue-100/70">
                {action.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}

export default memo(SellerDashboardQuickActions);
