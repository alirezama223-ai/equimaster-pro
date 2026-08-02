"use client";

import { useTranslations } from "next-intl";
import PedigreeHorseCardView from "@/app/components/pedigree/PedigreeHorseCardView";
import { PedigreeSearchResult } from "@/app/types/pedigree";

type Props = {
  result: PedigreeSearchResult;
};

export default function PedigreeHorseCardClient({ result }: Props) {
  const t = useTranslations("pedigree");

  return (
    <PedigreeHorseCardView
      result={result}
      labels={{
        registrationLine: result.registrationNumber
          ? t("registrationPrefix", { number: result.registrationNumber })
          : undefined,
      }}
    />
  );
}
