"use client";

import Link from "next/link";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import {
  MAX_PEDIGREE_GENERATIONS,
  UNKNOWN_PEDIGREE_LABEL,
  formatPedigreeSexLabel,
  getPedigreeNodeAtPath,
  pedigreeGenerationPaths,
} from "@/app/lib/pedigree";
import { PedigreeTreeNode } from "@/app/types/pedigree";

type Props = {
  subjectName: string;
  tree: PedigreeTreeNode;
  maxGenerations?: number;
  subjectLabel?: string;
};

const DEFAULT_LABELS = ["Subject", "Parents", "Grandparents", "Great-Grandparents", "4th Generation", "5th Generation"];

function generationLabels(maxGenerations: number): string[] {
  return DEFAULT_LABELS.slice(0, maxGenerations + 1);
}

function PedigreeCell({ node, branch }: { node: PedigreeTreeNode; branch: "sire" | "dam" | "subject" }) {
  const branchClass =
    branch === "sire"
      ? "border-blue-500/30 bg-blue-950/20"
      : branch === "dam"
        ? "border-purple-500/30 bg-purple-950/20"
        : "border-white/15 bg-[#111827]";

  const content = (
    <div className={`relative rounded-xl border px-3 py-3 min-h-[72px] ${branchClass}`}>
      {node.verified ? (
        <div className="absolute top-2 right-2 z-10">
          <VerifiedBadge className="shadow-md" />
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-2 pr-1">
        <p className="text-sm font-semibold text-white leading-snug break-words">{node.name}</p>
      </div>
      {node.birthYear ? (
        <p className="mt-1 text-xs text-gray-400">{node.birthYear}</p>
      ) : node.name !== UNKNOWN_PEDIGREE_LABEL ? (
        <p className="mt-1 text-xs text-gray-500">{formatPedigreeSexLabel(node.sex)}</p>
      ) : null}
    </div>
  );

  if (node.id) {
    return (
      <Link href={`/pedigree/${node.id}`} className="block transition hover:scale-[1.01]">
        {content}
      </Link>
    );
  }

  return content;
}

export default function PedigreeTree({
  subjectName,
  tree,
  maxGenerations = MAX_PEDIGREE_GENERATIONS,
  subjectLabel = "Subject",
}: Props) {
  const paths = pedigreeGenerationPaths(maxGenerations);
  const generationLabelsList = generationLabels(maxGenerations);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{subjectLabel}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-2xl font-bold text-white">{subjectName}</p>
          {tree.verified ? <VerifiedBadge /> : null}
        </div>
      </div>

      <div className="hidden xl:grid xl:gap-4" style={{ gridTemplateColumns: `repeat(${maxGenerations + 1}, minmax(0, 1fr))` }}>
        {Array.from({ length: maxGenerations + 1 }).map((_, generation) => {
          const generationPaths = paths.filter((path) => path.length === generation);

          return (
            <div key={generation} className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500 min-h-[32px]">
                {generationLabelsList[generation] ?? `Gen ${generation}`}
              </p>
              <div className="space-y-3">
                {generationPaths.map((path) => {
                  const node =
                    generation === 0
                      ? tree
                      : getPedigreeNodeAtPath(tree, path) ?? {
                          id: null,
                          name: UNKNOWN_PEDIGREE_LABEL,
                          sex: "unknown" as const,
                          birthYear: null,
                          verified: false,
                          sire: null,
                          dam: null,
                        };

                  const branch =
                    generation === 0
                      ? "subject"
                      : path[path.length - 1] === "sire"
                        ? "sire"
                        : "dam";

                  return <PedigreeCell key={path.join("-") || "subject"} node={node} branch={branch} />;
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="xl:hidden space-y-4">
        {Array.from({ length: maxGenerations + 1 }).map((_, generation) => {
          const generationPaths = paths.filter((path) => path.length === generation);

          return (
            <div key={generation} className="rounded-2xl border border-white/10 bg-[#0B1424] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-3">
                {generationLabelsList[generation] ?? `Gen ${generation}`}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {generationPaths.map((path) => {
                  const node =
                    generation === 0
                      ? tree
                      : getPedigreeNodeAtPath(tree, path) ?? {
                          id: null,
                          name: UNKNOWN_PEDIGREE_LABEL,
                          sex: "unknown" as const,
                          birthYear: null,
                          verified: false,
                          sire: null,
                          dam: null,
                        };

                  const branch =
                    generation === 0
                      ? "subject"
                      : path[path.length - 1] === "sire"
                        ? "sire"
                        : "dam";

                  return <PedigreeCell key={path.join("-") || "subject"} node={node} branch={branch} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
