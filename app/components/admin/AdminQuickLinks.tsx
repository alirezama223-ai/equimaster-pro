import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

type Props = {
  pendingListings: number;
  pendingSellers: number;
  openFeedback: number;
};

export default async function AdminQuickLinks({
  pendingListings,
  pendingSellers,
  openFeedback,
}: Props) {
  const t = await getTranslations("admin.dashboard.quickLinks");

  const links = [
    { href: "/admin/listings?filter=pending", title: t("listingsTitle"), subtitle: t("listingsSubtitle"), badge: pendingListings },
    { href: "/admin/sellers", title: t("sellersTitle"), subtitle: t("sellersSubtitle"), badge: pendingSellers },
    { href: "/admin/feedback?filter=open", title: t("feedbackTitle"), subtitle: t("feedbackSubtitle"), badge: openFeedback },
    { href: "/admin/users", title: t("usersTitle"), subtitle: t("usersSubtitle") },
    { href: "/admin/reports", title: t("reportsTitle"), subtitle: t("reportsSubtitle") },
    { href: "/admin/settings", title: t("settingsTitle"), subtitle: t("settingsSubtitle") },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-3xl border border-white/10 bg-[#111827] p-5 transition hover:border-blue-500/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{link.title}</h2>
              <p className="mt-2 text-sm text-gray-400">{link.subtitle}</p>
            </div>
            {typeof link.badge === "number" && link.badge > 0 ? (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-200">
                {link.badge}
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
