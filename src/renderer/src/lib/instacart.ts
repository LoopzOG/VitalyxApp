export type NearbyRetailer = {
  id: string;
  name: string;
  logoUrl?: string;
};

export type NearbyRetailersResponse = {
  retailers: NearbyRetailer[];
  source: "instacart" | "disabled";
  postalCode?: string;
  countryCode?: string;
  message?: string;
  error?: string;
};

export async function fetchNearbyRetailers() {
  const response = await fetch("/api/grocery/retailers");
  if (!response.ok) {
    throw new Error(`Retailer lookup failed with status ${response.status}`);
  }

  return (await response.json()) as NearbyRetailersResponse;
}
