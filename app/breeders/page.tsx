import { getActiveBreeders } from "@/app/actions/breeders";
import BreederDirectoryClient from "@/app/components/breeders/BreederDirectoryClient";
import { BreederCardData } from "@/app/types/breeder";

export const dynamic = "force-dynamic";

export default async function BreedersPage() {
  const { breeders, error } = await getActiveBreeders();

  return (
    <BreederDirectoryClient
      breeders={(breeders ?? []) as BreederCardData[]}
      loadError={error}
    />
  );
}
