"use client";

import { useTranslations } from "next-intl";
import BreederCardView from "@/app/components/breeders/BreederCardView";
import { BreederCardData } from "@/app/types/breeder";

type Props = {
  breeder: BreederCardData;
};

export default function BreederCardClient({ breeder }: Props) {
  const t = useTranslations("breeders");

  return (
    <BreederCardView
      breeder={breeder}
      labels={{
        coverAlt: t("card.coverAlt", { name: breeder.name }),
        logoAlt: t("card.logoAlt", { name: breeder.name }),
        stallionsLabel: t("card.stallions"),
        viewLabel: t("card.view"),
      }}
    />
  );
}
