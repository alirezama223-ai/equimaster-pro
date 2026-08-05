"use client";

import { Link } from "@/i18n/navigation";
import { memo } from "react";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { MARKETPLACE_PATHS } from "@/app/lib/marketplace/paths";

type QuickAction = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "sell",
    label: "Sell Horse",
    description: "Create a premium listing",
    href: MARKETPLACE_PATHS.createListing,
    icon: "🐎",
  },
  {
    key: "import",
    label: "Import Horse",
    description: "Bring an existing listing in",
    href: MARKETPLACE_PATHS.createListing,
    icon: "📥",
  },
  {
    key: "stallion",
    label: "Create Stallion",
    description: "Showcase breeding stock",
    href: "/account",
    icon: "⭐",
  },
  {
    key: "breeder",
    label: "Add Breeder",
    description: "Build your stud profile",
    href: "/account",
    icon: "🏇",
  },
  {
    key: "invite",
    label: "Invite Buyer",
    description: "Share your seller profile",
    href: MARKETPLACE_PATHS.sellerDashboard,
    icon: "✉️",
  },
];

function SellerDashboardQuickActions() {
  return (
    <DashboardCard
      eyebrow="Quick Actions"
      title="Move faster"
      description="Launch the most common seller workflows in one tap."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {QUICK_ACTIONS.map((action) => (
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
