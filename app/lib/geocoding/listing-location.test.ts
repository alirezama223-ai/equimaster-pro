import { describe, expect, it } from "vitest";
import {
  buildListingGeocodeQuery,
  haversineKm,
  listingLocationChanged,
  listingLocationKey,
} from "@/app/lib/geocoding/listing-location";

describe("listingLocationKey", () => {
  it("normalizes whitespace and casing", () => {
    expect(
      listingLocationKey({
        city: " Amsterdam ",
        postal_code: "1012",
        country: "Netherlands",
      })
    ).toBe(
      listingLocationKey({
        city: "amsterdam",
        postal_code: "1012",
        country: "netherlands",
      })
    );
  });
});

describe("listingLocationChanged", () => {
  it("detects postal code changes", () => {
    const previous = { city: "Amsterdam", postal_code: "1012", country: "Netherlands" };
    const next = { city: "Amsterdam", postal_code: "1013", country: "Netherlands" };
    expect(listingLocationChanged(previous, next)).toBe(true);
  });

  it("returns false for equivalent locations", () => {
    const previous = { city: "Berlin", postal_code: null, country: "Germany" };
    const next = { city: " Berlin ", postal_code: "", country: "Germany" };
    expect(listingLocationChanged(previous, next)).toBe(false);
  });
});

describe("buildListingGeocodeQuery", () => {
  it("builds postal, city, country query", () => {
    expect(
      buildListingGeocodeQuery({
        postal_code: "1012",
        city: "Amsterdam",
        country: "Netherlands",
      })
    ).toBe("1012, Amsterdam, Netherlands");
  });

  it("returns null without country", () => {
    expect(buildListingGeocodeQuery({ city: "Amsterdam", country: "" })).toBeNull();
  });
});

describe("haversineKm", () => {
  it("returns zero for identical points", () => {
    expect(haversineKm(52.37, 4.89, 52.37, 4.89)).toBe(0);
  });

  it("returns a positive distance for nearby cities", () => {
    const km = haversineKm(52.3676, 4.9041, 51.9244, 4.4777);
    expect(km).toBeGreaterThan(50);
    expect(km).toBeLessThan(90);
  });
});
