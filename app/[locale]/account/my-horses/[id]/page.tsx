import { redirect, notFound } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import MyHorseProfile from "@/app/components/account/MyHorseProfile";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata() {
  return createPageMetadata("account", "/account/my-horses");
}

export default async function MyHorsePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/account");
  if (id !== "emerald-van-het-ruytershof") notFound();

  return <MyHorseProfile />;
}
