import type { Category, PartyBrief } from "./types";

export const CATEGORY_LABELS: Record<Category, string> = {
  decor: "Decor",
  tableware: "Tableware",
  lighting: "Lighting & ambiance",
  favors: "Favors",
  activities: "Activities & games",
  food_drink: "Food & drink kit",
};

// Base weights for splitting a budget. Tweaked slightly by the brief.
const BASE_WEIGHTS: Record<Category, number> = {
  decor: 0.34,
  tableware: 0.2,
  food_drink: 0.18,
  lighting: 0.12,
  activities: 0.1,
  favors: 0.06,
};

export function allocateBudget(
  budget: number,
  brief: PartyBrief
): Record<Category, number> {
  const weights: Record<Category, number> = { ...BASE_WEIGHTS };

  // Light, explainable nudges based on the brief.
  const style = brief.style_tags.join(" ");
  if (/glam|elegant|neon/.test(style)) weights.lighting += 0.04;
  if (brief.age_group && /kid/i.test(brief.age_group)) {
    weights.activities += 0.06;
    weights.favors += 0.04;
  }
  if (/dinner|wedding|elegant/.test(brief.occasion + " " + style)) {
    weights.tableware += 0.04;
  }

  // Re-normalize so weights sum to 1.
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  const out = {} as Record<Category, number>;
  (Object.keys(weights) as Category[]).forEach((c) => {
    out[c] = Math.round(((weights[c] / sum) * budget + Number.EPSILON) * 100) / 100;
  });
  return out;
}
