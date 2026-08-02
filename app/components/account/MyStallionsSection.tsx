"use client";

import { Link, useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { deleteStallion, saveStallion } from "@/app/actions/stallions";
import StallionMediaSection from "@/app/components/account/StallionMediaSection";
import SearchableSelect from "@/app/components/shared/SearchableSelect";
import FormField, { sellInputClassName, sellLabelClassName } from "@/app/components/sell/FormField";
import FormSection from "@/app/components/sell/FormSection";
import { getBreedSelectOptions } from "@/app/lib/breeds";
import { getCountrySelectOptions } from "@/app/lib/constants/countries";
import { getDisciplineSelectOptions } from "@/app/lib/constants/disciplines";
import { revokeListingImages } from "@/app/lib/listing-media";
import { formatStudFee, getStallionCoverUrl, stallionImagesFromRow } from "@/app/lib/stallions";
import { ListingImage } from "@/app/types/listing";
import {
  BREEDING_METHODS,
  initialStallionFormData,
  StallionAvailability,
  StallionFormData,
  StallionRow,
  STALLION_AVAILABILITY_LABELS,
} from "@/app/types/stallion";

const countryOptions = getCountrySelectOptions();
const disciplineOptions = getDisciplineSelectOptions();
const breedOptions = getBreedSelectOptions();

type Props = {
  stallions: StallionRow[];
  breederId: string | null;
  ownerId: string;
};

function rowToForm(row: StallionRow): StallionFormData {
  return {
    name: row.name,
    breed: row.breed,
    studbook: row.studbook ?? "",
    birthYear: row.birth_year?.toString() ?? "",
    color: row.color,
    height: row.height?.toString() ?? "",
    country: row.country,
    discipline: row.discipline,
    competitionLevel: row.competition_level,
    sire: row.sire,
    dam: row.dam,
    damSire: row.dam_sire,
    studFee: row.stud_fee?.toString() ?? "",
    studFeeCurrency: row.stud_fee_currency,
    availability: row.availability,
    breedingMethods: row.breeding_methods,
    description: row.description,
    performance: row.performance,
    breedingHighlights: row.breeding_highlights,
  };
}

export default function MyStallionsSection({
  stallions,
  breederId,
  ownerId,
}: Props) {
  const t = useTranslations("account.stallions");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StallionFormData>(initialStallionFormData);
  const [images, setImages] = useState<ListingImage[]>([]);
  const initialImagesRef = useRef<ListingImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const hasBreederProfile = Boolean(breederId);

  function updateField<K extends keyof StallionFormData>(key: K, value: StallionFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleBreedingMethod(method: string) {
    setForm((prev) => ({
      ...prev,
      breedingMethods: prev.breedingMethods.includes(method)
        ? prev.breedingMethods.filter((item) => item !== method)
        : [...prev.breedingMethods, method],
    }));
  }

  function resetFormState() {
    setForm(initialStallionFormData);
    revokeListingImages(images);
    setImages([]);
    initialImagesRef.current = [];
    setMediaError(null);
  }

  function startCreate() {
    setEditingId(null);
    resetFormState();
    setShowForm(true);
    setError(null);
  }

  function startEdit(row: StallionRow) {
    setEditingId(row.id);
    setForm(rowToForm(row));
    const existingImages = stallionImagesFromRow(row, ownerId);
    initialImagesRef.current = existingImages;
    setImages(existingImages);
    setMediaError(null);
    setShowForm(true);
    setError(null);
  }

  function getRemovedImagePaths() {
    const currentExistingUrls = new Set(
      images.map((image) => image.existingUrl).filter((url): url is string => Boolean(url))
    );

    return initialImagesRef.current
      .filter((image) => image.existingUrl && !currentExistingUrls.has(image.existingUrl))
      .map((image) => image.storagePath)
      .filter((path): path is string => Boolean(path));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMediaError(null);

    if (images.length === 0) {
      setMediaError(t("photoRequired"));
      setPending(false);
      return;
    }

    if (!images.some((image) => image.isCover)) {
      setMediaError(t("coverRequired"));
      setPending(false);
      return;
    }

    const submission = new FormData();

    if (editingId) {
      let newFileIndex = 0;
      const imagePayload = images.map((image) => {
        if (image.file) {
          const index = newFileIndex;
          newFileIndex += 1;
          return {
            isCover: image.isCover,
            isNew: true,
            newFileIndex: index,
            name: image.file.name,
            size: image.file.size,
            type: image.file.type,
          };
        }

        return {
          isCover: image.isCover,
          isNew: false,
          existingUrl: image.existingUrl,
          storagePath: image.storagePath,
          name: image.existingUrl?.split("/").pop() ?? "existing-image.jpg",
          size: 0,
          type: "image/jpeg",
        };
      });

      submission.set(
        "payload",
        JSON.stringify({
          stallionId: editingId,
          form,
          images: imagePayload,
          removedImagePaths: getRemovedImagePaths(),
        })
      );

      let uploadIndex = 0;
      images.forEach((image) => {
        if (image.file) {
          submission.set(`image_new_${uploadIndex}`, image.file);
          uploadIndex += 1;
        }
      });
    } else {
      submission.set(
        "payload",
        JSON.stringify({
          form,
          images: images.map((image) => ({
            isCover: image.isCover,
            name: image.file!.name,
            size: image.file!.size,
            type: image.file!.type,
          })),
        })
      );

      images.forEach((image, index) => {
        submission.set(`image_${index}`, image.file!);
      });
    }

    const result = await saveStallion(submission);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    revokeListingImages(images.filter((image) => image.file));
    setShowForm(false);
    setEditingId(null);
    setPending(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(t("deleteConfirm"));
    if (!confirmed) return;

    setPending(true);
    const result = await deleteStallion(id);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setPending(false);
    router.refresh();
  }

  if (!hasBreederProfile) {
    return (
      <div className="rounded-3xl bg-[#111827] border border-white/10 p-6">
        <h2 className="text-xl font-bold text-white">{t("title")}</h2>
        <p className="mt-3 text-gray-400 leading-7">
          {t("needBreederProfile")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-[#111827] border border-white/10 p-6 md:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{t("title")}</h2>
          <p className="mt-2 text-gray-400 text-sm">
            {t("subtitle")}
          </p>
        </div>

        {!showForm ? (
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-white font-semibold transition"
          >
            {t("addStallion")}
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <FormSection title={editingId ? t("editStallion") : t("newStallion")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t("name")} required className="sm:col-span-2">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={sellInputClassName}
                  required
                />
              </FormField>

              <FormField label={t("breed")} required>
                <SearchableSelect
                  value={form.breed}
                  onChange={(value) => updateField("breed", value)}
                  options={breedOptions}
                  placeholder={t("searchBreeds")}
                  required
                  inputClassName={sellInputClassName}
                />
              </FormField>

              <FormField label={t("studbook")}>
                <input
                  type="text"
                  value={form.studbook}
                  onChange={(e) => updateField("studbook", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label={t("birthYear")}>
                <input
                  type="number"
                  value={form.birthYear}
                  onChange={(e) => updateField("birthYear", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label={t("color")}>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => updateField("color", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label={t("heightCm")}>
                <input
                  type="number"
                  value={form.height}
                  onChange={(e) => updateField("height", e.target.value)}
                  className={sellInputClassName}
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

              <FormField label={t("discipline")}>
                <SearchableSelect
                  value={form.discipline}
                  onChange={(value) => updateField("discipline", value)}
                  options={disciplineOptions}
                  placeholder={t("searchDisciplines")}
                  inputClassName={sellInputClassName}
                />
              </FormField>

              <FormField label={t("competitionLevel")}>
                <input
                  type="text"
                  value={form.competitionLevel}
                  onChange={(e) => updateField("competitionLevel", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title={t("pedigree")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t("sire")}>
                <input
                  type="text"
                  value={form.sire}
                  onChange={(e) => updateField("sire", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label={t("dam")}>
                <input
                  type="text"
                  value={form.dam}
                  onChange={(e) => updateField("dam", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label={t("damSire")} className="sm:col-span-2">
                <input
                  type="text"
                  value={form.damSire}
                  onChange={(e) => updateField("damSire", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title={t("breeding")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t("studFee")}>
                <input
                  type="number"
                  min="0"
                  value={form.studFee}
                  onChange={(e) => updateField("studFee", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label={t("currency")}>
                <select
                  value={form.studFeeCurrency}
                  onChange={(e) => updateField("studFeeCurrency", e.target.value)}
                  className={sellInputClassName}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </FormField>

              <FormField label={t("availability")}>
                <select
                  value={form.availability}
                  onChange={(e) =>
                    updateField("availability", e.target.value as StallionAvailability)
                  }
                  className={sellInputClassName}
                >
                  {(Object.keys(STALLION_AVAILABILITY_LABELS) as StallionAvailability[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {STALLION_AVAILABILITY_LABELS[key]}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <div className="sm:col-span-2">
                <p className={sellLabelClassName}>{t("breedingMethods")}</p>
                <div className="flex flex-wrap gap-3">
                  {BREEDING_METHODS.map((method) => (
                    <label
                      key={method}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.breedingMethods.includes(method)}
                        onChange={() => toggleBreedingMethod(method)}
                      />
                      <span className="text-sm text-gray-200">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title={t("content")}>
            <div className="grid gap-5">
              <FormField label={t("description")}>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label={t("performance")}>
                <textarea
                  value={form.performance}
                  onChange={(e) => updateField("performance", e.target.value)}
                  rows={3}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label={t("breedingHighlights")}>
                <textarea
                  value={form.breedingHighlights}
                  onChange={(e) => updateField("breedingHighlights", e.target.value)}
                  rows={3}
                  className={sellInputClassName}
                />
              </FormField>
            </div>
          </FormSection>

          <StallionMediaSection
            images={images}
            mediaError={mediaError}
            onImagesChange={setImages}
            onMediaError={setMediaError}
          />

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-6 py-4 text-white font-semibold transition"
            >
              {pending ? t("saving") : editingId ? t("saveStallion") : t("createStallion")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                resetFormState();
              }}
              className="rounded-xl border border-white/15 px-6 py-4 text-white font-semibold hover:border-blue-500 transition"
            >
              {tCommon("cancel")}
            </button>
          </div>
        </form>
      ) : stallions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {stallions.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl bg-[#08111F] border border-white/10 p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex gap-4 min-w-0">
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={getStallionCoverUrl(row)}
                    alt={row.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{row.name}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {row.breed} · {formatStudFee(row)}
                  </p>
                  <Link
                    href={`/stallions/${row.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
                  >
                    {t("viewPublicProfile")}
                  </Link>
                </div>
              </div>

              <div className="flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(row)}
                  className="rounded-xl border border-white/15 px-4 py-2 text-white hover:border-blue-500 transition"
                >
                  {tCommon("edit")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  disabled={pending}
                  className="rounded-xl border border-red-500/40 px-4 py-2 text-red-300 hover:bg-red-500/10 transition"
                >
                  {tCommon("delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
