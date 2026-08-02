import { notFound, redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import TrainingPlanCreateForm from "@/app/components/training/plans/TrainingPlanCreateForm";
import TrainingPlanEditor from "@/app/components/training/plans/TrainingPlanEditor";
import { getTrainingPlanEditor } from "@/app/actions/training-plans";
import { createClient } from "@/app/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TrainingPlanEditorPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("training");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath(`/training/plans/${id}`));
  }

  if (id === "new") {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#081223] pt-28 pb-24 text-white">
          <div className="mx-auto max-w-7xl px-6">
            <TrainingPlanCreateForm />
          </div>
        </main>
      </>
    );
  }

  const result = await getTrainingPlanEditor(id);

  if (!result.plan) {
    if (result.error) {
      return (
        <>
          <Navbar />
          <main className="min-h-screen bg-[#081223] pt-28 pb-24 text-white">
            <div className="mx-auto max-w-7xl px-6">
              <div className="rounded-3xl border border-red-500/30 bg-red-500/5 px-6 py-8">
                <h1 className="text-2xl font-bold text-white">{t("plans.loadErrorTitle")}</h1>
                <p className="mt-3 text-sm text-red-200">{result.error}</p>
              </div>
            </div>
          </main>
        </>
      );
    }

    notFound();
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#081223] pt-28 pb-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <TrainingPlanEditor
            plan={result.plan}
            loadError={result.error}
            assignmentLoadError={result.assignmentError}
          />
        </div>
      </main>
    </>
  );
}
