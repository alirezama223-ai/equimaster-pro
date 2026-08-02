import { Link } from "@/i18n/navigation";
import { notFound, redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { Suspense } from "react";
import { getPedigreeProfile } from "@/app/actions/pedigree";
import { getManagerTraitSubmissionContext } from "@/app/actions/traits";
import Navbar from "@/app/components/navbar/Navbar";
import HorseHealthDashboardClient from "@/app/components/health/HorseHealthDashboardClient";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PedigreeHealthPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginRedirectPath(`/pedigree/${id}/health`));
  }

  const [{ profile }, managerContext] = await Promise.all([
    getPedigreeProfile(id),
    getManagerTraitSubmissionContext(id),
  ]);

  if (!profile) {
    notFound();
  }

  if (!managerContext.canManage) {
    redirect(`/pedigree/${id}`);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#081223] text-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          <Link href={`/pedigree/${id}`} className="text-gray-400 hover:text-white transition">
            ← Back to {profile.horse.name}
          </Link>
          <Suspense fallback={<div className="py-12 text-sm text-gray-400">Loading health dashboard...</div>}>
            <HorseHealthDashboardClient
              initialHorseId={id}
              backHref={`/pedigree/${id}`}
              backLabel={`Back to ${profile.horse.name}`}
            />
          </Suspense>
        </div>
      </main>
    </>
  );
}
