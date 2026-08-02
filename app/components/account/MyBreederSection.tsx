"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { saveBreederProfile, deleteBreederProfile } from "@/app/actions/breeders";
import BreederMediaSection from "@/app/components/account/BreederMediaSection";
import FormField, { sellInputClassName } from "@/app/components/sell/FormField";
import FormSection from "@/app/components/sell/FormSection";
import SearchableSelect from "@/app/components/shared/SearchableSelect";
import SearchableMultiSelect from "@/app/components/shared/SearchableMultiSelect";
import { getCountrySelectOptions } from "@/app/lib/constants/countries";
import { getDisciplineSelectOptions } from "@/app/lib/constants/disciplines";
import { resolveOwnedStoragePath } from "@/app/lib/breeder-image-storage";
import { normalizeDisciplines } from "@/app/lib/breeders";
import {
  BreederFormData,
  BreederImageFieldState,
  BreederMediaPayload,
  BreederRow,
  SaveBreederProfilePayload,
  initialBreederFormData,
  initialBreederImageFieldState,
} from "@/app/types/breeder";

const countryOptions = getCountrySelectOptions();
const disciplineOptions = getDisciplineSelectOptions();

type Props = {
  breeder: BreederRow | null;
  ownerId: string;
};

function rowToForm(row: BreederRow): BreederFormData {
  return {
    name: row.name,
    description: row.description,
    country: row.country,
    city: row.city ?? "",
    website: row.website ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    disciplines: normalizeDisciplines(row.disciplines),
  };
}

function buildImageState(
  existingUrl: string | null,
  ownerId: string
): BreederImageFieldState {
  if (!existingUrl) {
    return { ...initialBreederImageFieldState };
  }

  return {
    file: null,
    previewUrl: null,
    existingUrl,
    existingStoragePath: resolveOwnedStoragePath(existingUrl, ownerId),
    removed: false,
  };
}

function buildMediaPayload(state: BreederImageFieldState): BreederMediaPayload {
  if (state.file) {
    return {
      action: "upload",
      existingUrl: state.existingUrl,
      existingStoragePath: state.existingStoragePath,
    };
  }

  if (state.removed) {
    return {
      action: "remove",
      existingUrl: state.existingUrl,
      existingStoragePath: state.existingStoragePath,
    };
  }

  return {
    action: "keep",
    existingUrl: state.existingUrl,
    existingStoragePath: state.existingStoragePath,
  };
}

export default function MyBreederSection({ breeder: initialBreeder, ownerId }: Props) {
  const t = useTranslations("account.breeder");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [form, setForm] = useState<BreederFormData>(
    initialBreeder ? rowToForm(initialBreeder) : initialBreederFormData
  );
  const [logo, setLogo] = useState<BreederImageFieldState>(() =>
    initialBreeder
      ? buildImageState(initialBreeder.logo_url, ownerId)
      : { ...initialBreederImageFieldState }
  );
  const [cover, setCover] = useState<BreederImageFieldState>(() =>
    initialBreeder
      ? buildImageState(initialBreeder.cover_image_url, ownerId)
      : { ...initialBreederImageFieldState }
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showForm, setShowForm] = useState(!initialBreeder);

  function updateField<K extends keyof BreederFormData>(key: K, value: BreederFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetFormState() {
    if (initialBreeder) {
      setForm(rowToForm(initialBreeder));
      setLogo(buildImageState(initialBreeder.logo_url, ownerId));
      setCover(buildImageState(initialBreeder.cover_image_url, ownerId));
    } else {
      setForm(initialBreederFormData);
      setLogo({ ...initialBreederImageFieldState });
      setCover({ ...initialBreederImageFieldState });
    }
    setMediaError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    setMediaError(null);

    const payload: SaveBreederProfilePayload = {
      form,
      logo: buildMediaPayload(logo),
      cover: buildMediaPayload(cover),
    };

    const submission = new FormData();
    submission.set("payload", JSON.stringify(payload));

    if (logo.file) {
      submission.set("logo_file", logo.file);
    }

    if (cover.file) {
      submission.set("cover_file", cover.file);
    }

    const result = await saveBreederProfile(submission);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setSuccess(initialBreeder ? t("updatedSuccess") : t("createdSuccess"));
    setShowForm(false);
    setPending(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!initialBreeder) return;
    const confirmed = window.confirm(t("deleteConfirm"));
    if (!confirmed) return;

    setPending(true);
    const result = await deleteBreederProfile(initialBreeder.id);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setForm(initialBreederFormData);
    setLogo({ ...initialBreederImageFieldState });
    setCover({ ...initialBreederImageFieldState });
    setShowForm(true);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="rounded-3xl bg-[#111827] border border-white/10 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{t("title")}</h2>
          <p className="mt-2 text-gray-400 text-sm">{t("subtitle")}</p>
        </div>

        {initialBreeder && !showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-white font-semibold transition"
          >
            {t("editProfile")}
          </button>
        ) : null}
      </div>

      {initialBreeder && !showForm ? (
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-[#08111F] border border-white/10 px-4 py-3">
            <p className="text-white font-semibold">{initialBreeder.name}</p>
            <p className="text-gray-400 text-sm mt-1">
              {initialBreeder.city ? `${initialBreeder.city}, ` : ""}
              {initialBreeder.country}
            </p>
          </div>
          <Link
            href={`/breeders/${initialBreeder.id}`}
            className="inline-block text-blue-400 hover:text-blue-300 text-sm"
          >
            {t("viewPublicProfile")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <FormSection title={t("studFarmDetails")} subtitle={t("studFarmDetailsSubtitle")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t("studFarmName")} required className="sm:col-span-2">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={sellInputClassName}
                  required
                />
              </FormField>

              <FormField label={t("country")} required>
                <SearchableSelect
                  value={form.country}
                  onChange={(value) => updateField("country", value)}
                  options={countryOptions}
                  placeholder={t("searchCountries")}
                  required
                  inputClassName={sellInputClassName}
                />
              </FormField>

              <FormField label={t("city")}>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label={t("disciplines")} className="sm:col-span-2">
                <SearchableMultiSelect
                  values={form.disciplines}
                  onChange={(values) => updateField("disciplines", values)}
                  options={disciplineOptions}
                  placeholder={t("searchDisciplines")}
                  inputClassName={sellInputClassName}
                />
              </FormField>

              <FormField label={t("about")} className="sm:col-span-2">
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={5}
                  className={sellInputClassName}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title={t("contact")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t("publicEmail")}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label={t("publicPhone")}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label={t("website")} className="sm:col-span-2">
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder={t("websitePlaceholder")}
                  className={sellInputClassName}
                />
              </FormField>
            </div>
          </FormSection>

          <BreederMediaSection
            logo={logo}
            cover={cover}
            mediaError={mediaError}
            onLogoChange={setLogo}
            onCoverChange={setCover}
            onMediaError={setMediaError}
          />

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {success}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-6 py-4 text-white font-semibold transition"
            >
              {pending ? t("saving") : initialBreeder ? t("saveChanges") : t("createProfile")}
            </button>

            {initialBreeder ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetFormState();
                  }}
                  className="rounded-xl border border-white/15 px-6 py-4 text-white font-semibold hover:border-blue-500 transition"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="rounded-xl border border-red-500/40 px-6 py-4 text-red-300 font-semibold hover:bg-red-500/10 transition"
                >
                  {t("deleteProfile")}
                </button>
              </>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
