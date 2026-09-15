import type { User } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LogoutButton from "@/app/components/auth/LogoutButton";
import SellerListingsDashboard from "@/app/components/account/SellerListingsDashboard";
import MyBreederSection from "@/app/components/account/MyBreederSection";
import MyStallionsSection from "@/app/components/account/MyStallionsSection";
import InquiriesSection from "@/app/components/account/InquiriesSection";
import BuyerInquiriesSection from "@/app/components/account/BuyerInquiriesSection";
import DemoEnvironmentPanel from "@/app/components/account/DemoEnvironmentPanel";
import SavedSearchAlerts from "@/app/components/account/SavedSearchAlerts";
import NotificationSettings from "@/app/components/account/NotificationSettings";
import { getUserSavedSearches } from "@/app/actions/saved-searches";
import { getSavedSearchAlerts } from "@/app/actions/saved-search-alerts";
import { getMyReminders } from "@/app/actions/reminders";
import { buildMarketplaceSearchQuery } from "@/app/lib/marketplace/search";
import { HorseListingRow } from "@/app/types/horse-listing";
import { BuyerInquiry, SellerInquiry } from "@/app/types/inquiry";
import { BreederRow } from "@/app/types/breeder";
import { StallionRow } from "@/app/types/stallion";
import type { DemoEnvironmentSnapshot } from "@/app/types/demo";
import type { SellerListingStats } from "@/app/types/marketplace";

type Props = {
  user: User;
  listings: HorseListingRow[];
  listingStats: SellerListingStats;
  inquiries: SellerInquiry[];
  buyerInquiries: BuyerInquiry[];
  newInquiryCount: number;
  sellerInquiriesError?: string;
  buyerInquiriesError?: string;
  breederProfile: BreederRow | null;
  myStallions: StallionRow[];
  demoSnapshot: DemoEnvironmentSnapshot | null;
  isAdmin: boolean;
};

export default async function AccountDashboard({
  user,
  listings,
  listingStats,
  inquiries,
  buyerInquiries,
  newInquiryCount,
  sellerInquiriesError,
  buyerInquiriesError,
  breederProfile,
  myStallions,
  demoSnapshot,
  isAdmin,
}: Props) {
  const t = await getTranslations("account.dashboard");
  const savedSearchT = await getTranslations("savedSearch");
  const fullName =
    (user.user_metadata?.full_name as string | undefined) || t("defaultName");

  const [savedSearchResult, savedSearchAlertsResult, remindersResult] = await Promise.all([
    getUserSavedSearches(),
    getSavedSearchAlerts(),
    getMyReminders(),
  ]);
  const savedSearches = savedSearchResult.searches;
  const alertById = new Map(
    savedSearchAlertsResult.alerts.map((alert) => [alert.id, alert.count])
  );
  const upcomingReminders = remindersResult.reminders
    .filter((reminder) => reminder.status === "pending" && reminder.enabled)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[#111C2E] border border-gray-800 p-6 sm:p-8">
        <p className="uppercase tracking-[6px] text-blue-500 text-xs font-semibold">
          {t("eyebrow")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-4">
          {t("welcome", { name: fullName })}
        </h1>
        <p className="mt-3 text-gray-400">{user.email}</p>

        {newInquiryCount > 0 ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600/20 border border-blue-500/30 px-4 py-2 text-sm text-blue-200">
            {newInquiryCount === 1
              ? t("newInquiry", { count: newInquiryCount })
              : t("newInquiries", { count: newInquiryCount })}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link href="/sell" className="inline-flex justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-4 text-white font-semibold transition">{t("createListing")}</Link>
          <LogoutButton />
        </div>
      </section>

      <NotificationSettings userId={user.id} />

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[4px] text-blue-400">EquiMaster</p>
            <h2 className="mt-2 text-xl font-bold text-white">Reminders</h2>
            <p className="mt-2 text-sm text-gray-400">Training, health and care dates in one place.</p>
          </div>
          <Link href="/account/reminders" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">Manage reminders</Link>
        </div>
        <div className="mt-5 grid gap-3">
          {upcomingReminders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-5 py-6 text-sm text-gray-500">No upcoming reminders.</p>
          ) : upcomingReminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0B1422] px-4 py-3">
              <div className="min-w-0"><p className="truncate font-semibold text-white">{reminder.title}</p><p className="mt-1 text-xs text-gray-500">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(reminder.due_at))}</p></div>
              <span className="shrink-0 rounded-full border border-blue-500/20 px-2 py-1 text-[11px] text-blue-300">{reminder.reminder_type}</span>
            </div>
          ))}
        </div>
      </section>

      {isAdmin && demoSnapshot ? <DemoEnvironmentPanel snapshot={demoSnapshot} /> : null}

      <SellerListingsDashboard listings={listings} stats={listingStats} />

      {savedSearches.length > 0 ? (
        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-white">{savedSearchT("savedSearches")}</h2></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {savedSearches.map((search) => <SavedSearchAlerts key={search.id} searchId={search.id} href={`/horses${buildMarketplaceSearchQuery(search.filters)}`} name={search.name} count={alertById.get(search.id) ?? 0} newMatchesLabel={savedSearchT("newMatches")} />)}
          </div>
        </section>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6"><Link href="/account/mfa" className="text-blue-300 hover:text-blue-200 font-semibold">{t("openSecurity")}</Link></div>
      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6"><Link href="/account/subscription" className="text-blue-300 hover:text-blue-200 font-semibold">{t("openSubscription")}</Link></div>
      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6"><Link href="/account/verification" className="text-blue-300 hover:text-blue-200 font-semibold">{t("openVerification")}</Link></div>
      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6"><Link href="/dashboard/seller" className="text-blue-300 hover:text-blue-200 font-semibold">{t("openSellerDashboard")}</Link></div>

      <section className="grid gap-6 md:grid-cols-2"><MyBreederSection breeder={breederProfile} ownerId={user.id} /></section>
      <MyStallionsSection stallions={myStallions} breederId={breederProfile?.id ?? null} ownerId={user.id} />
      <InquiriesSection initialInquiries={inquiries} currentUserId={user.id} sellerName={fullName} loadError={sellerInquiriesError} />
      <BuyerInquiriesSection initialInquiries={buyerInquiries} currentUserId={user.id} loadError={buyerInquiriesError} />
    </div>
  );
}
