import { notFound } from "next/navigation";
import { getHorseListingById } from "@/app/actions/horse-listings";
import { getUserFavoriteListingIds } from "@/app/actions/favorites";
import { getPedigreeSectionForListing } from "@/app/actions/pedigree";
import { horses } from "@/app/data/horses";
import { isListingUuid, listingRowToHorse } from "@/app/lib/horse-listings";
import { createClient } from "@/app/lib/supabase/server";

import HorseGallery from "@/app/components/horse/HorseGallery";
import HorseInfo from "@/app/components/horse/HorseInfo";
import PedigreeSection from "@/app/components/pedigree/PedigreeSection";
import HorseDescription from "@/app/components/horse/HorseDescription";
import HorseVideo from "@/app/components/horse/HorseVideo";
import ContactSeller from "@/app/components/horse/ContactSeller";
import RelatedHorses from "@/app/components/horse/RelatedHorses";
import { HorseListingRow } from "@/app/types/horse-listing";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HorsePage({ params }: Props) {
  const { id } = await params;

  let horse = null;
  let listingRow: HorseListingRow | null = null;

  if (isListingUuid(id)) {
    const { data } = await getHorseListingById(id);
    if (data) {
      listingRow = data;
      horse = listingRowToHorse(data);
    }
  } else {
    horse = horses.find((item) => item.id === Number(id)) ?? null;
  }

  if (!horse) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const favoriteListingIds = await getUserFavoriteListingIds();
  const isFavorited = Boolean(
    horse.listingUuid && favoriteListingIds.includes(horse.listingUuid)
  );

  const returnPath = horse.listingUuid ? `/horse/${horse.listingUuid}` : `/horse/${id}`;
  const buyerPrefill = user
    ? {
        buyerName: (user.user_metadata?.full_name as string | undefined)?.trim() || "",
        buyerEmail: user.email ?? "",
      }
    : undefined;

  const pedigreeSection = listingRow
    ? await getPedigreeSectionForListing(listingRow)
    : {
        subjectName: horse.name,
        tree: null,
        legacy: {
          sire: horse.sire,
          dam: horse.dam,
          damSire: horse.damSire ?? "",
        },
      };

  return (
    <main className="bg-[#081223] min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16">
          <HorseGallery horse={horse} />
          <HorseInfo
            horse={horse}
            isFavorited={isFavorited}
            returnPath={returnPath}
            buyerPrefill={buyerPrefill}
            isAuthenticated={Boolean(user)}
          />
        </div>

        <div className="mt-20">
          <PedigreeSection
            subjectName={pedigreeSection.subjectName}
            tree={pedigreeSection.tree}
            legacy={pedigreeSection.legacy}
          />
        </div>

        <div className="mt-20">
          <HorseDescription horse={horse} />
        </div>

        <HorseVideo horse={horse} />

        <ContactSeller
          horse={horse}
          returnPath={returnPath}
          buyerPrefill={buyerPrefill}
          isAuthenticated={Boolean(user)}
        />

        <RelatedHorses currentHorse={horse} />
      </div>
    </main>
  );
}
