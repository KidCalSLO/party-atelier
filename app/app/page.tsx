"use client";

import { useState } from "react";
import type { Category, PartyPlan } from "@/lib/types";

type Mode = "simple" | "studio";

const CATEGORY_COLOR: Record<Category, string> = {
  decor: "#e2b0b4",
  tableware: "#bccab3",
  lighting: "#e6cf9e",
  food_drink: "#e8c2a6",
  activities: "#b9cad9",
  favors: "#d4c2de",
};

const CATEGORY_INK: Record<Category, string> = {
  decor: "#9c5560",
  tableware: "#5d7153",
  lighting: "#8a6a2c",
  food_drink: "#a3673f",
  activities: "#4e6a83",
  favors: "#76588a",
};

const MONOGRAM: Record<Category, string> = {
  decor: "D",
  tableware: "T",
  lighting: "L",
  food_drink: "F",
  activities: "A",
  favors: "F",
};

type Theme = {
  id: string;
  name: string;
  blurb: string;
  starter: string;
  image: string;
};

// Homepage inspiration gallery. Swap each `image` for your own curated or
// AI-generated theme photo whenever you like — the layout stays the same.
const THEMES: Theme[] = [
  {
    id: "woodland-fairy",
    name: "Woodland Fairy",
    blurb: "Sage, gold & greenery with paper lanterns and fairy lights.",
    starter:
      "A woodland-fairy birthday with sage green and gold, paper lanterns, fairy lights, lots of greenery, and a little craft table.",
    image: "https://loremflickr.com/600/750/fairy,forest,party?lock=201",
  },
  {
    id: "boho-garden",
    name: "Boho Garden",
    blurb: "Pampas, terracotta & cream for a relaxed, pretty party.",
    starter:
      "A boho garden party with pampas grass, terracotta and cream, candlelight, a grazing table, and a relaxed, grown-up-pretty feel.",
    image: "https://loremflickr.com/600/750/boho,garden,party?lock=202",
  },
  {
    id: "under-the-sea",
    name: "Under the Sea",
    blurb: "Soft blues, pearls & shells, calm and dreamy.",
    starter:
      "An under-the-sea party with soft blues, pearls and shells, waves of streamers, and a calm, dreamy vibe.",
    image: "https://loremflickr.com/600/750/ocean,party,decoration?lock=203",
  },
  {
    id: "vintage-tea",
    name: "Vintage Tea Party",
    blurb: "Pastel florals, lace & dainty china.",
    starter:
      "A vintage tea party with pastel florals, lace, dainty china, and a sweet, old-fashioned charm.",
    image: "https://loremflickr.com/600/750/tea,party,vintage?lock=204",
  },
  {
    id: "enchanted-princess",
    name: "Enchanted Princess",
    blurb: "Blush, gold & tulle with a touch of sparkle.",
    starter:
      "An enchanted princess party with blush and gold, tulle, a touch of sparkle, and a magical castle feel.",
    image: "https://loremflickr.com/600/750/princess,party,pink?lock=205",
  },
  {
    id: "safari-adventure",
    name: "Safari Adventure",
    blurb: "Warm neutrals, greenery & playful animal touches.",
    starter:
      "A safari adventure party with warm neutrals, greenery, animal touches, and a playful explorer feel.",
    image: "https://loremflickr.com/600/750/safari,animals,party?lock=206",
  },
];

const money = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function Home() {
  const [mode, setMode] = useState<Mode>("simple");

  // shared
  const [budget, setBudget] = useState("200");
  const [image, setImage] = useState<{
    data: string;
    mediaType: string;
    preview: string;
  } | null>(null);

  // simple
  const [text, setText] = useState("");

  // studio
  const [occasion, setOccasion] = useState("");
  const [guests, setGuests] = useState("");
  const [dateSeason, setDateSeason] = useState("");
  const [setting, setSetting] = useState("");
  const [location, setLocation] = useState("");
  const [vision, setVision] = useState("");
  const [mustHaves, setMustHaves] = useState("");
  const [avoid, setAvoid] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PartyPlan | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setImage({ data: base64, mediaType: file.type, preview: result });
    };
    reader.readAsDataURL(file);
  }

  function composeStudio(): string {
    const parts: string[] = [];
    if (occasion) parts.push(`Occasion: ${occasion}.`);
    if (guests) parts.push(`Expected guests: ${guests}.`);
    if (dateSeason) parts.push(`Date or time of year: ${dateSeason}.`);
    if (setting) parts.push(`Setting: ${setting}.`);
    if (location) parts.push(`Location: ${location}.`);
    if (vision) parts.push(`Vision and vibe: ${vision}.`);
    if (mustHaves) parts.push(`Must-haves: ${mustHaves}.`);
    if (avoid) parts.push(`Please avoid: ${avoid}.`);
    return parts.join(" ");
  }

  function pickTheme(t: Theme) {
    setMode("simple");
    setText(t.starter);
    setError(null);
    document.getElementById("brief")?.scrollIntoView({ behavior: "smooth" });
  }

  async function generate() {
    const activeText = mode === "simple" ? text : composeStudio();
    if (!activeText.trim()) {
      setError(
        mode === "simple"
          ? "Tell us about your party first."
          : "Fill in at least the occasion or the vision."
      );
      return;
    }
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: activeText,
          budget: Number(budget),
          image: image ? { data: image.data, mediaType: image.mediaType } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not compose a plan.");
      setPlan(data as PartyPlan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <span className="wordmark">Party Atelier</span>
        <nav className="navlinks">
          <a href="#brief">How It Works</a>
          <a href="#themes">Ideas</a>
          <a href="#brief">Begin</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <span className="label">Luxe parties, DIY budget</span>
          <h1 className="serif">
            A party they&apos;ll never forget, <em>made by you</em>.
          </h1>
          <div className="rule" />
          <p className="lede">
            Tell us the party you&apos;re dreaming up and the budget you&apos;re
            working with. We&apos;ll style it beautifully and hand you a simple
            shopping list — high-end looks, do-it-yourself prices.
          </p>
        </div>
      </section>

      <section className="section themes-section" id="themes">
        <div className="themes-head">
          <span className="label">Start from a theme</span>
          <h2 className="serif">Need a spark? Begin here.</h2>
          <p className="themes-sub">
            Tap a look to start your plan — or describe your own below.
          </p>
        </div>
        <div className="themes-grid">
          {THEMES.map((t) => (
            <button className="theme-card" key={t.id} onClick={() => pickTheme(t)}>
              <img
                src={t.image}
                alt={t.name}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="veil" />
              <span className="theme-cap">
                <span className="theme-name serif">{t.name}</span>
                <span className="theme-blurb">{t.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <main className="section" id="brief">
        <div className="brief-form">
          <div className="mode-toggle">
            <button
              className={mode === "simple" ? "active" : ""}
              onClick={() => setMode("simple")}
            >
              Inspire Me
            </button>
            <button
              className={mode === "studio" ? "active" : ""}
              onClick={() => setMode("studio")}
            >
              Design Studio
            </button>
          </div>

          <span className="label">
            {mode === "simple" ? "Begin the brief" : "The full brief"}
          </span>
          <h2 className="serif">
            {mode === "simple"
              ? "Tell us what you're dreaming of"
              : "Let's get every detail right"}
          </h2>

          {mode === "simple" ? (
            <label className="field">
              <span className="field-label">The occasion &amp; vision</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="A garden 40th birthday for ~30 guests — eucalyptus and gold, candlelight, a grazing table, and a cocktail moment."
              />
            </label>
          ) : (
            <>
              <div className="row">
                <label className="field">
                  <span className="field-label">Occasion</span>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="Birthday, baby shower, graduation…"
                  />
                </label>
                <label className="field">
                  <span className="field-label">Expected guests</span>
                  <input
                    type="number"
                    min={1}
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    placeholder="15"
                  />
                </label>
              </div>

              <div className="row">
                <label className="field">
                  <span className="field-label">Date or time of year</span>
                  <input
                    type="text"
                    value={dateSeason}
                    onChange={(e) => setDateSeason(e.target.value)}
                    placeholder="April, or spring"
                  />
                </label>
                <label className="field">
                  <span className="field-label">Setting</span>
                  <select value={setting} onChange={(e) => setSetting(e.target.value)}>
                    <option value="">Select…</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Both indoor and outdoor">
                      Both indoor &amp; outdoor
                    </option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span className="field-label">Location — optional</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, or the venue"
                />
              </label>

              <label className="field">
                <span className="field-label">The look &amp; feel</span>
                <textarea
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  placeholder="Soft and whimsical — sage green and gold, fairy lights, lots of greenery."
                />
              </label>

              <div className="row">
                <label className="field">
                  <span className="field-label">Must-haves</span>
                  <textarea
                    value={mustHaves}
                    onChange={(e) => setMustHaves(e.target.value)}
                    placeholder="Balloon arch, craft table, cake bar"
                  />
                </label>
                <label className="field">
                  <span className="field-label">Things to avoid</span>
                  <textarea
                    value={avoid}
                    onChange={(e) => setAvoid(e.target.value)}
                    placeholder="No plastic, no character themes"
                  />
                </label>
              </div>
            </>
          )}

          <div className="row">
            <label className="field">
              <span className="field-label">Your budget (USD)</span>
              <input
                type="number"
                min={1}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Inspiration — optional</span>
              <span className="file-drop">
                <input type="file" accept="image/*" onChange={onFile} />
                {image ? (
                  <>
                    <img className="thumb" src={image.preview} alt="" />
                    <span>We&apos;ll read the palette from this.</span>
                  </>
                ) : (
                  <span>Add an inspiration image — we read its colors and style</span>
                )}
              </span>
            </label>
          </div>

          <button className="cta" onClick={generate} disabled={loading}>
            {loading ? "Composing your plan…" : "Compose my plan"}
          </button>

          {error && <div className="error">{error}</div>}
        </div>

        {plan && <Results plan={plan} />}
      </main>

      <footer className="footer">
        <span className="wordmark">Party Atelier</span>
        <p className="tag">Beautiful parties, made by you</p>
      </footer>
    </>
  );
}

function Results({ plan }: { plan: PartyPlan }) {
  const { brief, moodboard, categories, total, budget, guides } = plan;
  const palette = moodboard.palette.length
    ? moodboard.palette
    : ["#e2b0b4", "#bccab3", "#e6cf9e", "#b9cad9"];

  return (
    <section className="results">
      <div className="brief-head">
        <div className="meta">
          <span className="label">{brief.occasion}</span>
          <h2 className="serif">{brief.headline}</h2>
          {brief.vibe && <p className="vibe">{brief.vibe}</p>}
          <div className="tags">
            {brief.style_tags.map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
            {brief.guest_count ? (
              <span className="tag">{brief.guest_count} guests</span>
            ) : null}
          </div>
        </div>

        <div className="moodboard">
          <span className="label">The palette</span>
          {moodboard.imageUrl && (
            <img className="mood-img" src={moodboard.imageUrl} alt="Party preview" />
          )}
          <div className="swatches">
            {palette.map((c, i) => (
              <span key={i} style={{ background: c }} />
            ))}
          </div>
          {moodboard.words.length > 0 && (
            <p className="mood-words">{moodboard.words.join(" · ")}</p>
          )}
        </div>
      </div>

      <div className="budget-block">
        <div className="budget-head">
          <span className="label">The budget</span>
          <span className="total">
            {money(total)} <small>allocated of {money(budget)}</small>
          </span>
        </div>
        <div className="alloc-bar">
          {categories.map((c) => {
            const pct = budget > 0 ? (c.budget / budget) * 100 : 0;
            return (
              <span
                key={c.category}
                style={{
                  width: `${pct}%`,
                  background: CATEGORY_COLOR[c.category],
                }}
                title={`${c.label}: ${money(c.budget)}`}
              />
            );
          })}
        </div>
        <div className="alloc-legend">
          {categories.map((c) => (
            <span key={c.category}>
              <span
                className="dot"
                style={{ background: CATEGORY_COLOR[c.category] }}
              />
              {c.label} · {money(c.budget)}
            </span>
          ))}
        </div>
      </div>

      {categories.map((c) =>
        c.items.length === 0 ? null : (
          <div className="cat" key={c.category}>
            <div className="cat-head">
              <h3>{c.label}</h3>
              <span className="spend">
                {money(c.spent)} of {money(c.budget)}
              </span>
            </div>
            <div className="items">
              {c.items.map((item) => (
                <div className="item" key={item.id}>
                  <div
                    className="tile"
                    style={{
                      background: CATEGORY_COLOR[c.category],
                      color: CATEGORY_INK[c.category],
                    }}
                  >
                    <span className="mono">{MONOGRAM[c.category]}</span>
                    {item.image && (
                      <img
                        className="tile-img"
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="body">
                    <span className="title">{item.title}</span>
                    <span className="reason">{item.reason}</span>
                    <span className="price">
                      {money(item.price)}
                      {item.unit ? <small> · {item.unit}</small> : null}
                    </span>
                    <a
                      className="buy"
                      href={item.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Shop this
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {guides && guides.length > 0 && (
        <div className="cat">
          <div className="cat-head">
            <h3>How to make it</h3>
            <span className="spend">
              {guides.length} {guides.length === 1 ? "guide" : "guides"}
            </span>
          </div>
          <div className="guides">
            {guides.map((g, i) => (
              <details className="guide" key={i} open={i === 0}>
                <summary>
                  <span className="guide-title serif">{g.title}</span>
                  <span className="guide-meta">
                    {g.difficulty}
                    {g.time ? ` · ${g.time}` : ""}
                  </span>
                </summary>
                <div className="guide-body">
                  {g.uses && g.uses.length > 0 && (
                    <p className="guide-uses">Uses: {g.uses.join(", ")}</p>
                  )}
                  <ol>
                    {g.steps.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ol>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      <div className="disclaimer">
        {plan.live ? (
          <>
            Photos, prices, and buy links are pulled live from real shopping
            listings, sorted to surface the best price. Prices and availability can
            change at checkout.
          </>
        ) : (
          <>
            Product photos are representative styling references; the shopping links
            are search links at your chosen retailer (set{" "}
            <code>AFFILIATE_TAG</code> to earn on them). Add a shopping-API key to
            show real photos, live prices, and direct buy links.
          </>
        )}
      </div>
    </section>
  );
}
