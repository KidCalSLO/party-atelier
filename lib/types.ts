export type Category =
  | "decor"
  | "tableware"
  | "lighting"
  | "favors"
  | "activities"
  | "food_drink";

export interface PartyBrief {
  occasion: string;
  headline: string;
  vibe: string;
  theme: string;
  guest_count: number | null;
  age_group: string | null;
  palette: string[]; // hex codes
  color_names: string[]; // simple color words: gold, blush, sage...
  style_tags: string[]; // boho, elegant, neon...
  must_haves: string[];
}

export interface Product {
  id: string;
  title: string;
  category: Category;
  price: number;
  color_tags: string[];
  style_tags: string[];
  unit?: string; // "pack of 50", "each"
}

export interface PickedItem extends Product {
  buyUrl: string;
  score: number;
  reason: string;
}

export interface CategoryPlan {
  category: Category;
  label: string;
  budget: number;
  spent: number;
  items: PickedItem[];
}

export interface MoodBoard {
  palette: string[];
  words: string[];
  imageUrl: string | null; // set when an image provider is wired up
}

export interface PartyPlan {
  brief: PartyBrief;
  budget: number;
  total: number;
  categories: CategoryPlan[];
  moodboard: MoodBoard;
}
