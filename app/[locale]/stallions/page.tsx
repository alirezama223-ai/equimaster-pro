import { getActiveStallions } from "@/app/actions/stallions";
import StallionDirectoryClient from "@/app/components/stallions/StallionDirectoryClient";
import { StallionCardData } from "@/app/types/stallion";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("stallions", "/stallions");
}

export default async function StallionsPage() {
  const { stallions, error } = await getActiveStallions();

  return (
    <StallionDirectoryClient
      stallions={(stallions ?? []) as StallionCardData[]}
      loadError={error}
    />
  );
}
