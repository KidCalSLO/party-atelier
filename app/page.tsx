"use client";

import { useState } from "react";
import type { Category, PartyPlan } from "@/lib/types";

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

const money = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function Home() {
  const [text, setText] = useState("");
  const [budget, setBudget] = useState("200");
  const [image, setImage] = useState<{
    data: string;
    mediaType: string;
    preview: string;
  } | null>(null);
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

  async function generate() {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
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
          <a href="#brief">Ideas</a>
          <a href="#brief">Begin</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <span className="label">Luxe kids&apos; parties, DIY budget</span>
          <h1 className="serif">
            A party they&apos;ll never forget, <em>made by you</em>.
          </h1>
          <div className="rule" />
          <p className="lede">
            Tell us your child&apos;s dream party and the budget you&apos;re
            working with. We&apos;ll style it beautifully and hand you a simple
            shopping list — high-end looks, do-it-yourself prices.
          </p>
        </div>
      </section>

      <main className="section" id="brief">
        <div className="brief-form">
          <span className="label">Begin the brief</span>
          <h2 className="serif">Tell us what you&apos;re dreaming of</h2>

          <label className="field">
            <span className="field-label">The occasion &amp; vision</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="A woodland-fairy 5th birthday for ~15 kids. Soft sage and gold, paper lanterns, a little craft table, a balloon arch, and a simple cake bar."
            />
          </label>

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
        <p className="tag">Magical kids&apos; parties, made by you</p>
      </footer>
    </>
  );
}

function Results({ plan }: { plan: PartyPlan }) {
  const { brief, moodboard, categories, total, budget } = plan;
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

      <div className="disclaimer">
        Product photos are representative styling references; the shopping links
        are search links at your chosen retailer (set <code>AFFILIATE_TAG</code> to
        earn on them). Connect a real product feed to show exact-product photos and
        direct buy links.
      </div>
    </section>
  );
}
