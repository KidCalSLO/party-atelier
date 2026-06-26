import type {
  Category,
  CategoryPlan,
  PartyBrief,
  PickedItem,
  Product,
} from "./types";
import { CATEGORY_LABELS } from "./budget";
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

export function buildCategoryPlans(
  allocations: Record<Category, number>,
  brief: PartyBrief,
  catalog: Product[]
): CategoryPlan[] {
  const order: Category[] = [
    "decor",
    "tableware",
    "lighting",
    "food_drink",
    "activities",
    "favors",
  ];
  return order.map((c) => pickForCategory(c, allocations[c] ?? 0, brief, catalog));
}
