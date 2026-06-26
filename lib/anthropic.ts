import type { PartyBrief } from "./types";

const API_URL = "https://api.anthropic.com/v1/messages";

const BRIEF_TOOL = {
  name: "party_brief",
  description:
    "Extract a structured creative brief from a person's description of the party they want to throw.",
  input_schema: {
    type: "object" as const,
    properties: {
      occasion: { type: "string", description: "e.g. birthday, baby shower, dinner party" },
      headline: {
        type: "string",
        description: "a short, punchy name for this party concept, 2-5 words",
      },
      vibe: { type: "string", description: "one short phrase capturing the feeling" },
      theme: { type: "string", description: "the visual/conceptual theme" },
      guest_count: { type: ["integer", "null"], description: "number of guests if stated" },
      age_group: { type: ["string", "null"], description: "e.g. kids, adults, all ages" },
      palette: {
        type: "array",
        items: { type: "string" },
        description: "3-5 hex color codes that capture the look, e.g. #E8B4BC",
      },
      color_names: {
        type: "array",
        items: { type: "string" },
        description:
          "the same colors as simple lowercase words: blush, gold, sage, navy, white, black, terracotta, multicolor",
      },
      style_tags: {
        type: "array",
        items: { type: "string" },
        description:
          "lowercase style descriptors from this kind of vocabulary: boho, elegant, rustic, modern, minimal, glam, vintage, whimsical, tropical, neon",
      },
      must_haves: {
        type: "array",
        items: { type: "string" },
        description: "specific things the person explicitly asked for",
      },
    },
    required: ["occasion", "headline", "vibe", "theme", "palette", "color_names", "style_tags"],
  },
};

interface ImageInput {
  mediaType: string;
  data: string; // base64, no data: prefix
}

export async function parseDesires(
  text: string,
  image?: ImageInput
): Promise<PartyBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

  const content: any[] = [];
  if (image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: image.mediaType, data: image.data },
    });
  }
  content.push({
    type: "text",
    text:
      "Here is what someone wants for their party. Read it (and the inspiration image, if any) " +
      "and call the party_brief tool with a structured brief. Infer a tasteful palette and style " +
      "tags even if they are vague. Description:\n\n" +
      text,
  });

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      tools: [BRIEF_TOOL],
      tool_choice: { type: "tool", name: "party_brief" },
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Claude API error (${res.status}): ${detail}`);
  }

  const data = await res.json();
  const toolUse = (data.content || []).find((b: any) => b.type === "tool_use");
  if (!toolUse) {
    throw new Error("Claude did not return a structured brief. Try rephrasing.");
  }

  const input = toolUse.input || {};
  return {
    occasion: input.occasion ?? "celebration",
    headline: input.headline ?? "Your party",
    vibe: input.vibe ?? "",
    theme: input.theme ?? "",
    guest_count: input.guest_count ?? null,
    age_group: input.age_group ?? null,
    palette: Array.isArray(input.palette) ? input.palette.slice(0, 5) : [],
    color_names: Array.isArray(input.color_names)
      ? input.color_names.map((c: string) => c.toLowerCase())
      : [],
    style_tags: Array.isArray(input.style_tags)
      ? input.style_tags.map((s: string) => s.toLowerCase())
      : [],
    must_haves: Array.isArray(input.must_haves) ? input.must_haves : [],
  };
}
