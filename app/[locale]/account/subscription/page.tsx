import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import FadeUp from "@/app/components/animations/FadeUp";
import SubscriptionDashboard from "@/app/components/subscription/SubscriptionDashboard";
import { getBillingHistory, getSubscriptionSnapshot } from "@/app/actions/subscriptions";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import { createClient } from "@/app/lib/supabase/server";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ checkout?: string; error?: string }>;
};

export async function generateMetadata() {
  return createPageMetadata("account", "/account/subscription");
}

export default async function AccountSubscriptionPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath("/account/subscription"));
  }

  const params = await searchParams;
  const [{ snapshot, plans, error }, invoicesResult] = await Promise.all([
    getSubscriptionSnapshot(),
    getBillingHistory(),
  ]);
  const t = await getTranslations("subscription");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeUp>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                {t("title")}
              </p>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{t("title")}</h1>
              <p className="mt-3 text-gray-400">{t("subtitle")}</p>
            </div>

            {snapshot ? (
              <SubscriptionDashboard
                snapshot={snapshot}
                plans={plans}
                invoices={invoicesResult.invoices}
                checkoutStatus={params.checkout ?? null}
                errorMessage={params.error ?? error ?? invoicesResult.error ?? null}
              />
            ) : (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
                {error ?? t("errors.loadFailed")}
              </div>
            )}
          </FadeUp>
        </div>
      </main>
    </>
  );
}
