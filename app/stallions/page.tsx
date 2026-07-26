import { getActiveStallions } from "@/app/actions/stallions";
import StallionDirectoryClient from "@/app/components/stallions/StallionDirectoryClient";
import { StallionCardData } from "@/app/types/stallion";

export const dynamic = "force-dynamic";

export default async function StallionsPage() {
  const { stallions, error } = await getActiveStallions();

  return (
    <StallionDirectoryClient
      stallions={(stallions ?? []) as StallionCardData[]}
      loadError={error}
    />
  );
}
