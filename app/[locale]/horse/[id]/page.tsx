import { redirect, notFound } from "next/navigation";
import { getHorseListingForPublicView } from "@/app/actions/horse-listings";
import { getPublicListingPath } from "@/app/lib/marketplace/paths";
import { isListingUuid } from "@/app/lib/horse-listings";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LegacyHorseListingRedirectPage({ params }: Props) {
  const { id } = await params;

  if (!isListingUuid(id)) {
    notFound();
  }

  const result = await getHorseListingForPublicView(id);

  if (!result.data) {
    notFound();
  }

  redirect(getPublicListingPath(result.data.slug));
}
