"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import FloatingPortal from "@/app/components/shared/FloatingPortal";
import type { ListingActionDef, ListingActionKey } from "@/app/lib/marketplace/listing-actions-config";
import {
  getListingMenuActions,
  getListingViewAction,
} from "@/app/lib/marketplace/listing-actions-config";
import type { HorseListingRow } from "@/app/types/horse-listing";
import { isFloatingOverlayNode } from "@/app/lib/floating-position";

type Props = {
  listing: HorseListingRow;
  busy?: boolean;
  onAction: (key: ListingActionKey, listing: HorseListingRow) => void;
};

export default function ListingCardActions({ listing, busy = false, onAction }: Props) {
  const t = useTranslations("marketplace");
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const viewAction = getListingViewAction(listing);
  const menuActions = getListingMenuActions(listing);
  const showMenuTrigger = menuActions.length > 0;

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (isFloatingOverlayNode(target)) return;
      setMenuOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!sheetOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSheetOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [sheetOpen]);

  function getActionLabel(action: ListingActionDef) {
    return t(`actions.${action.key}`);
  }

  function handleSelect(action: ListingActionDef) {
    if (busy) return;

    if (action.requiresConfirm) {
      const confirmKey = action.confirmKey ?? "confirmDefault";
      if (!window.confirm(t(`actions.${confirmKey}`))) {
        return;
      }
    }

    setMenuOpen(false);
    setSheetOpen(false);
    onAction(action.key, listing);
  }

  function toggleMenu() {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setMenuOpen((open) => !open);
      setSheetOpen(false);
      return;
    }

    setSheetOpen(true);
    setMenuOpen(false);
  }

  if (!viewAction && !showMenuTrigger) {
    return null;
  }

  return (
    <div className="shrink-0 self-start">
      <div className="flex items-center gap-2">
        {viewAction ? (
          <Link
            href={viewAction.href!(listing)}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            {getActionLabel(viewAction)}
          </Link>
        ) : null}

        {showMenuTrigger ? (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              ref={triggerRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen || sheetOpen}
              aria-controls={menuId}
              aria-label={t("actions.listingActions")}
              disabled={busy}
              onClick={toggleMenu}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10 transition disabled:opacity-60"
            >
              <ThreeDotIcon />
            </button>

            {menuOpen ? (
              <FloatingPortal
                anchorRef={triggerRef}
                open={menuOpen}
                placement="bottom-end"
                matchWidth={false}
                floatingWidth={176}
              >
                <div
                  id={menuId}
                  role="menu"
                  className="min-w-[11rem] overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] py-1 shadow-2xl shadow-black/40"
                >
                  {menuActions.map((action) => (
                    <CompactMenuItem
                      key={action.key}
                      action={action}
                      listing={listing}
                      label={getActionLabel(action)}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </FloatingPortal>
            ) : null}
          </div>
        ) : null}
      </div>

      {sheetOpen ? (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label={t("actions.closeActions")}
            className="absolute inset-0 bg-black/70"
            onClick={() => setSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("actions.listingActions")}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-white/10 bg-[#0f172a] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/20" />
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t("actions.manageListing")}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{listing.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-300"
              >
                {t("actions.close")}
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-1">
              {menuActions.map((action) => (
                <CompactSheetItem
                  key={action.key}
                  action={action}
                  listing={listing}
                  label={getActionLabel(action)}
                  busy={busy}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CompactMenuItem({
  action,
  listing,
  label,
  onSelect,
}: {
  action: ListingActionDef;
  listing: HorseListingRow;
  label: string;
  onSelect: (action: ListingActionDef) => void;
}) {
  const className = compactItemClassName(action.variant);

  if (action.href) {
    return (
      <Link href={action.href(listing)} className={className} role="menuitem">
        {label}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" onClick={() => onSelect(action)} className={className}>
      {label}
    </button>
  );
}

function CompactSheetItem({
  action,
  listing,
  label,
  busy,
  onSelect,
}: {
  action: ListingActionDef;
  listing: HorseListingRow;
  label: string;
  busy: boolean;
  onSelect: (action: ListingActionDef) => void;
}) {
  const className = `${compactItemClassName(action.variant)} w-full rounded-xl px-4 py-3 text-left disabled:opacity-60`;

  if (action.href) {
    return (
      <Link href={action.href(listing)} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" disabled={busy} onClick={() => onSelect(action)} className={className}>
      {label}
    </button>
  );
}

function compactItemClassName(variant: ListingActionDef["variant"]) {
  const base =
    "block w-full px-3 py-2 text-sm font-medium text-left transition hover:bg-white/5";

  if (variant === "danger") {
    return `${base} text-red-300 hover:bg-red-500/10`;
  }

  return `${base} text-white`;
}

function ThreeDotIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </svg>
  );
}
