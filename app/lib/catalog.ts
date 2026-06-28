import type {
  Category,
  CategoryPlan,
  PartyBrief,
  PickedItem,
  Product,
} from "./types";
import { CATEGORY_LABELS } from "./budget";
import { searchLiveProducts } from "./products";
import seed from "@/data/seed-catalog.json";

const SEED = seed as Product[];

// Load the product catalog. Uses Supabase if configured, else the bundled seed.
export async function getCatalog(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return SEED;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from("products").select("*");
    if (error || !data || data.length === 0) return SEED;
    return data as Product[];
  } catch {
    return SEED;
  }
}

function buildBuyUrl(title: string): string {
  const tag = process.env.AFFILIATE_TAG || "YOUR_AFFILIATE_TAG";
  const template =
    process.env.AFFILIATE_URL_TEMPLATE ||
    "https://www.amazon.com/s?k={q}&tag={tag}";
  return template
    .replace("{q}", encodeURIComponent(title))
    .replace("{tag}", encodeURIComponent(tag));
}

// Category keyword to steer representative photos toward the right kind of item.
const IMAGE_KEYWORD: Record<Category, string> = {
  decor: "decoration",
  tableware: "tableware",
  lighting: "lights",
  food_drink: "food",
  activities: "games",
  favors: "gift",
};

// Returns a product photo. If the catalog row carries a real image (from a
// real product feed later), use it. Otherwise build a stable, relevant
// representative photo from the product's own words — so cards look like
// product cards today, and swap to exact photos the moment you connect a feed.
function imageFor(p: Product): string {
  if (p.image) return p.image;
  const firstWord =
    p.title
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .find((w) => w.length > 3) || "party";
  const lock = Math.abs(
    Array.from(p.id).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)
  );
  const keywords = `${firstWord},party,${IMAGE_KEYWORD[p.category]}`;
  return `https://loremflickr.com/600/450/${encodeURIComponent(
    keywords
  )}?lock=${lock}`;
}

function overlap(a: string[], b: string[]): number {
  const set = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => set.has(x.toLowerCase())).length;
}

function scoreItem(item: Product, brief: PartyBrief): { score: number; reason: string } {
  const styleHits = overlap(item.style_tags, brief.style_tags);
  const colorHits = overlap(item.color_tags, brief.color_names);
  const score = styleHits * 2 + colorHits * 1.5 + 0.5;

  const reasons: string[] = [];
  if (styleHits) {
    const matched = item.style_tags.filter((t) =>
      brief.style_tags.map((s) => s.toLowerCase()).includes(t.toLowerCase())
    );
    reasons.push(`${matched.join(" + ")} feel`);
  }
  if (colorHits) {
    const matched = item.color_tags.filter((t) =>
      brief.color_names.map((s) => s.toLowerCase()).includes(t.toLowerCase())
    );
    reasons.push(`${matched.join(" / ")} palette`);
  }
  return {
    score,
    reason: reasons.length ? `Matches your ${reasons.join(" and ")}` : "Solid staple for this category",
  };
}

// Greedily pick items for one category to fill its budget by best fit.
function pickForCategory(
  category: Category,
  budget: number,
  brief: PartyBrief,
  catalog: Product[]
): CategoryPlan {
  const ranked = catalog
    .filter((p) => p.category === category)
    .map((p) => ({ ...p, ...scoreItem(p, brief) }))
    .sort((a, b) => b.score - a.score || a.price - b.price);

  const items: PickedItem[] = [];
  let spent = 0;

  for (const p of ranked) {
    if (items.length >= 4) break;
    if (spent + p.price <= budget * 1.05 || items.length === 0) {
      items.push({
        ...p,
        buyUrl: buildBuyUrl(p.title),
        image: imageFor(p),
      });
      spent += p.price;
    }
    if (spent >= budget * 0.85 && items.length >= 2) break;
  }

  return {
    category,
    label: CATEGORY_LABELS[category],
    budget: Math.round(budget * 100) / 100,
    spent: Math.round(spent * 100) / 100,
    items,
  };
}

// Build one category from real, live shopping results (cheapest-first within
// budget). Returns null if live search is unavailable, so the caller can fall
// back to the seed catalog for that category.
async function pickLiveCategory(
  category: Category,
  budget: number,
  brief: PartyBrief
): Promise<CategoryPlan | null> {
  const keywords = [
    ...brief.style_tags.slice(0, 2),
    ...brief.color_names.slice(0, 1),
  ].join(" ");

  const live = await searchLiveProducts(category, keywords, budget);
  if (!live || live.length === 0) return null;

  const ranked = live.sort((a, b) => a.price - b.price); // best deal first

  const items: PickedItem[] = [];
  let spent = 0;
  for (const p of ranked) {
    if (items.length >= 4) break;
    if (spent + p.price <= budget * 1.1 || items.length === 0) {
      items.push({
        id: p.id,
        title: p.title,
        category,
        price: p.price,
        color_tags: [],
        style_tags: [],
        unit: p.source ? `at ${p.source}` : undefined,
        image: p.image,
        buyUrl: p.buyUrl,
        score: 0,
        reason: p.source ? `Best price found at ${p.source}` : "Best price found",
      });
      spent += p.price;
    }
    if (spent >= budget * 0.85 && items.length >= 2) break;
  }

  return {
    category,
    label: CATEGORY_LABELS[category],
    budget: Math.round(budget * 100) / 100,
    spent: Math.round(spent * 100) / 100,
    items,
  };
}

export async function buildCategoryPlans(
  allocations: Record<Category, number>,
  brief: PartyBrief,
  catalog: Product[]
): Promise<CategoryPlan[]> {
  const order: Category[] = [
    "decor",
    "tableware",
    "lighting",
    "food_drink",
    "activities",
    "favors",
  ];

  // Live mode: pull real products with real photos/prices/links in parallel,
  // and fall back to the seed catalog for any category the API can't fill.
  if (process.env.PRODUCT_API_KEY) {
    const live = await Promise.all(
      order.map((c) => pickLiveCategory(c, allocations[c] ?? 0, brief))
    );
    return order.map(
      (c, i) => live[i] ?? pickForCategory(c, allocations[c] ?? 0, brief, catalog)
    );
  }

  return order.map((c) => pickForCategory(c, allocations[c] ?? 0, brief, catalog));
}
