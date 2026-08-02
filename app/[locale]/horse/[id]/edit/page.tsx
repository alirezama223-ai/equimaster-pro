import { redirect, notFound } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { getHorseListingForOwner } from "@/app/actions/horse-listings";
import { getListingEditPath } from "@/app/lib/marketplace/paths";
import { isListingUuid } from "@/app/lib/horse-listings";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LegacyEditListingRedirectPage({ params }: Props) {
  const { id } = await params;

  if (!isListingUuid(id)) {
    notFound();
  }

  const result = await getHorseListingForOwner(id);

  if (result.unauthenticated) {
    redirect(loginRedirectPath(getListingEditPath(id)));
  }

  if (!result.data) {
    notFound();
  }

  redirect(getListingEditPath(id));
}
