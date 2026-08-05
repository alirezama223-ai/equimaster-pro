"use client";

import { copyTextToClipboard } from "@/app/lib/browser-compat";
import { memo, useCallback, useEffect, useState } from "react";

const FAVORITE_SELLERS_KEY = "equimaster-favorite-sellers";

type Props = {
  breederId: string;
  breederName: string;
  profilePath: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  contactTitle: string;
  contactDescription: string;
  viewListingsLabel: string;
  shareLabel: string;
  shareCopiedLabel: string;
  websiteLabel: string;
  noContactLabel: string;
  horsesSectionId?: string;
};

function SellerContactSidebar({
  breederId,
  breederName,
  profilePath,
  email,
  phone,
  website,
  contactTitle,
  contactDescription,
  viewListingsLabel,
  shareLabel,
  shareCopiedLabel,
  websiteLabel,
  noContactLabel,
  horsesSectionId = "horses",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITE_SELLERS_KEY);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      setFavorited(Array.isArray(ids) && ids.includes(breederId));
    } catch {
      setFavorited(false);
    }
  }, [breederId]);

  const handleShare = useCallback(async () => {
    const absoluteUrl = `${window.location.origin}${profilePath}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: breederName, url: absoluteUrl });
        return;
      } catch {
        // fall through
      }
    }
    const didCopy = await copyTextToClipboard(absoluteUrl);
    if (didCopy) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [breederName, profilePath]);

  const toggleFavorite = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITE_SELLERS_KEY);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      const next = favorited
        ? ids.filter((id) => id !== breederId)
        : [...ids.filter((id) => id !== breederId), breederId];
      window.localStorage.setItem(FAVORITE_SELLERS_KEY, JSON.stringify(next));
      setFavorited(!favorited);
    } catch {
      // ignore
    }
  }, [breederId, favorited]);

  const hasContact = Boolean(email?.trim() || phone?.trim() || website?.trim());

  return (
    <aside className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111827] to-[#0a1220] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-6">
        <h2 className="text-lg font-bold text-white">{contactTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">{contactDescription}</p>

        <div className="mt-5 space-y-3">
          {email ? (
            <a
              href={`mailto:${email}`}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition [@media(hover:hover)]:hover:bg-blue-500"
            >
              {email}
            </a>
          ) : null}

          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex min-h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white transition [@media(hover:hover)]:hover:border-white/25"
            >
              {phone}
            </a>
          ) : null}

          {!hasContact ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-gray-500">
              {noContactLabel}
            </p>
          ) : null}

          <a
            href={`#${horsesSectionId}`}
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-gray-200 transition [@media(hover:hover)]:hover:bg-white/[0.06]"
          >
            {viewListingsLabel}
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-sm font-semibold text-gray-200 transition [@media(hover:hover)]:hover:bg-white/[0.06]"
            >
              {copied ? shareCopiedLabel : shareLabel}
            </button>
            <button
              type="button"
              onClick={toggleFavorite}
              aria-pressed={favorited}
              className={`flex min-h-12 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                favorited
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-white/15 bg-white/[0.03] text-gray-200 [@media(hover:hover)]:hover:bg-white/[0.06]"
              }`}
            >
              {favorited ? "♥ Saved" : "♡ Save"}
            </button>
          </div>

          {website ? (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-blue-300 transition [@media(hover:hover)]:hover:text-blue-200"
            >
              {websiteLabel}
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export default memo(SellerContactSidebar);

export function StickyMobileSellerContactBar({
  breederId,
  breederName,
  profilePath,
  email,
  contactTitle,
  viewListingsLabel,
  shareLabel,
  horsesSectionId = "horses",
}: Pick<
  Props,
  "breederId" | "breederName" | "profilePath" | "email" | "contactTitle" | "viewListingsLabel" | "shareLabel" | "horsesSectionId"
>) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITE_SELLERS_KEY);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      setFavorited(Array.isArray(ids) && ids.includes(breederId));
    } catch {
      setFavorited(false);
    }
  }, [breederId]);

  const primaryHref = email ? `mailto:${email}` : `#${horsesSectionId}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a1220]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{breederName}</p>
          <p className="truncate text-xs text-gray-400">{contactTitle}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            const url = `${window.location.origin}${profilePath}`;
            await copyTextToClipboard(url);
          }}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-gray-200"
          aria-label={shareLabel}
        >
          ↗
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              const raw = window.localStorage.getItem(FAVORITE_SELLERS_KEY);
              const ids = raw ? (JSON.parse(raw) as string[]) : [];
              const next = favorited
                ? ids.filter((id) => id !== breederId)
                : [...ids.filter((id) => id !== breederId), breederId];
              window.localStorage.setItem(FAVORITE_SELLERS_KEY, JSON.stringify(next));
              setFavorited(!favorited);
            } catch {
              // ignore
            }
          }}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-gray-200"
          aria-pressed={favorited}
        >
          {favorited ? "♥" : "♡"}
        </button>
      </div>
      <div className="border-t border-white/[0.06] px-4 pb-3 pt-2">
        <a
          href={primaryHref}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-base font-semibold text-white"
        >
          {email ? email : viewListingsLabel}
        </a>
      </div>
    </div>
  );
}
