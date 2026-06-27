import type { Category } from "./types";

// A real product pulled live from a shopping API.
export interface LiveResult {
  id: string;
  title: string;
  category: Category;
  price: number;
  image: string;
  buyUrl: string;
  source?: string;
}

// A category noun to steer the shopping query toward the right kind of item.
const CATEGORY_QUERY: Record<Category, string> = {
  decor: "party decorations",
  tableware: "party tableware",
  lighting: "party string lights",
  food_drink: "party serveware",
  activities: "kids party games",
  favors: "party favors",
};

// Searches a live shopping API for real products in a category.
// Returns null when no key is configured (caller falls back to the seed catalog)
// or when the request fails, so the app never breaks.
//
// Wired for SerpApi's Google Shopping engine by default. To use a different
// provider, adjust the URL and the field names in the map below.
export async function searchLiveProducts(
  category: Category,
  keywords: string,
  maxPrice: number
): Promise<LiveResult[] | null> {
  const key = process.env.PRODUCT_API_KEY;
  if (!key) return null;

  const q = `${keywords} ${CATEGORY_QUERY[category]}`.trim();
  const url =
    "https://serpapi.com/search.json?engine=google_shopping" +
    `&q=${encodeURIComponent(q)}` +
    `&num=20&api_key=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const results: any[] = data.shopping_results || [];

    const products = results
      .map((r, i): LiveResult | null => {
        const price =
          typeof r.extracted_price === "number"
            ? r.extracted_price
            : parseFloat(String(r.price || "").replace(/[^0-9.]/g, ""));
        const image = r.thumbnail || r.image;
        const buyUrl = r.product_link || r.link;
        if (!r.title || !image || !buyUrl || !isFinite(price) || price <= 0) {
          return null;
        }
        return {
          id: `${category}-live-${r.product_id || i}`,
          title: r.title,
          category,
          price,
          image,
          buyUrl,
          source: r.source,
        };
      })
      .filter((p): p is LiveResult => p !== null);

    return products;
  } catch {
    return null;
  }
}
