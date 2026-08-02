import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { fetchDemoEnvironmentSnapshot } from "@/app/lib/demo/queries";
import { createClient } from "@/app/lib/supabase/server";

export default async function DemoModeBanner() {
  const t = await getTranslations("demo");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { snapshot } = await fetchDemoEnvironmentSnapshot(supabase, user.id);

  if (!snapshot.userState.demoModeEnabled) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">{t("banner.eyebrow")}</p>
          <p className="mt-1 text-sm text-emerald-50">
            {t("banner.description")}
          </p>
        </div>
        <Link
          href="/account"
          className="inline-flex justify-center rounded-xl border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
        >
          {t("banner.manageDemo")}
        </Link>
      </div>
    </div>
  );
}
