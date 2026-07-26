"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveBreederProfile, deleteBreederProfile } from "@/app/actions/breeders";
import BreederMediaSection from "@/app/components/account/BreederMediaSection";
import FormField, { sellInputClassName } from "@/app/components/sell/FormField";
import FormSection from "@/app/components/sell/FormSection";
import { resolveOwnedStoragePath } from "@/app/lib/breeder-image-storage";
import {
  BreederFormData,
  BreederImageFieldState,
  BreederMediaPayload,
  BreederRow,
  SaveBreederProfilePayload,
  initialBreederFormData,
  initialBreederImageFieldState,
} from "@/app/types/breeder";

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
    disciplines: Array.isArray(row.disciplines) ? row.disciplines.join(", ") : "",
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

    setSuccess(initialBreeder ? "Stud farm profile updated." : "Stud farm profile created.");
    setShowForm(false);
    setPending(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!initialBreeder) return;
    const confirmed = window.confirm("Delete your stud farm profile and all associated stallions?");
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
          <h2 className="text-xl font-bold text-white">My Stud Farm / Breeder Profile</h2>
          <p className="mt-2 text-gray-400 text-sm">
            Manage your public stud farm profile and contact details.
          </p>
        </div>

        {initialBreeder && !showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-white font-semibold transition"
          >
            Edit Profile
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
          <a
            href={`/breeders/${initialBreeder.id}`}
            className="inline-block text-blue-400 hover:text-blue-300 text-sm"
          >
            View public profile →
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <FormSection title="Stud Farm Details" subtitle="This information appears on your public breeder profile.">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Stud Farm Name" required className="sm:col-span-2">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={sellInputClassName}
                  required
                />
              </FormField>

              <FormField label="Country" required>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  className={sellInputClassName}
                  required
                />
              </FormField>

              <FormField label="City">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label="Disciplines" className="sm:col-span-2">
                <input
                  type="text"
                  value={form.disciplines}
                  onChange={(e) => updateField("disciplines", e.target.value)}
                  placeholder="Show Jumping, Dressage, Eventing"
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label="About" className="sm:col-span-2">
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={5}
                  className={sellInputClassName}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Contact">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Public Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label="Public Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className={sellInputClassName}
                />
              </FormField>

              <FormField label="Website" className="sm:col-span-2">
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://"
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
              {pending ? "Saving..." : initialBreeder ? "Save Changes" : "Create Profile"}
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
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="rounded-xl border border-red-500/40 px-6 py-4 text-red-300 font-semibold hover:bg-red-500/10 transition"
                >
                  Delete Profile
                </button>
              </>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
