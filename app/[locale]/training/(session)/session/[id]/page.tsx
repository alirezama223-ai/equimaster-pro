import { Link } from "@/i18n/navigation";
import { notFound, redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import TrainingErrorState from "@/app/components/training/TrainingErrorState";
import TrainingSessionClient from "@/app/components/training/TrainingSessionClient";
import { getTrainingSession } from "@/app/actions/training";
import { trainingSessionPath } from "@/app/lib/training/routes";
import { createClient } from "@/app/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function TrainingSessionPage({ params }: Props) {
  const { id: sessionId } = await params;
  const t = await getTranslations("training");

  if (!UUID_PATTERN.test(sessionId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath(trainingSessionPath(sessionId)));
  }

  const result = await getTrainingSession(sessionId);

  if (!result.session) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
          <div className="max-w-3xl mx-auto px-6 space-y-6">
            <TrainingErrorState
              message={result.error ?? t("session.notFound")}
            />
            <Link
              href="/training"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:border-blue-500/40"
            >
              {t("session.backToDailyTraining")}
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <TrainingSessionClient
            key={result.session.id}
            session={result.session}
            exercises={result.exercises}
            error={result.error}
          />
        </div>
      </main>
    </>
  );
}
