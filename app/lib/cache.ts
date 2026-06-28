import type { LiveResult } from "./products";

// How long a cached search stays reusable. Longer = fewer API calls but
// staler prices. Default 7 days.
const TTL_HOURS = Number(process.env.PRODUCT_CACHE_TTL_HOURS || 168);

let clientPromise: Promise<any | null> | null = null;

function getClient(): Promise<any | null> {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Prefer the service role key for server-side cache writes; fall back to anon.
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    try {
      const { createClient } = await import("@supabase/supabase-js");
      return createClient(url, key);
    } catch {
      return null;
    }
  })();
  return clientPromise;
}

// Normalize category + keywords into a stable key, so "boho sage" and
// "sage boho" reuse the same cached results.
export function cacheKey(category: string, keywords: string): string {
  const norm = keywords
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join("-");
  return `${category}:${norm || "any"}`;
}

export async function getCached(key: string): Promise<LiveResult[] | null> {
  const supabase = await getClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("product_cache")
      .select("results, created_at")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return null;
    const ageMs = Date.now() - new Date(data.created_at).getTime();
    if (ageMs > TTL_HOURS * 3600 * 1000) return null; // expired
    return data.results as LiveResult[];
  } catch {
    return null;
  }
}

export async function setCached(key: string, results: LiveResult[]): Promise<void> {
  if (results.length === 0) return; // don't cache empty searches
  const supabase = await getClient();
  if (!supabase) return;
  try {
    await supabase
      .from("product_cache")
      .upsert(
        { key, results, created_at: new Date().toISOString() },
        { onConflict: "key" }
      );
  } catch {
    // cache write failures are non-fatal
  }
}
