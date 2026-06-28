import type { MoodBoard, PartyBrief } from "./types";

// Job 3: a visual preview of the party.
//
// Today this returns a styled "mood board" derived from the brief (palette +
// descriptors), which the UI renders with no external dependency. When you are
// ready to add a real generated render, set IMAGE_API_KEY and implement the
// call inside generateImage() below — the rest of the app already handles a
// non-null imageUrl.
export async function buildMoodBoard(brief: PartyBrief): Promise<MoodBoard> {
  const words = Array.from(
    new Set(
      [brief.vibe, brief.theme, ...brief.style_tags]
        .filter(Boolean)
        .flatMap((w) => w.split(/[\s,]+/))
        .map((w) => w.trim())
        .filter((w) => w.length > 2)
    )
  ).slice(0, 6);

  const imageUrl = await generateImage(brief).catch(() => null);

  return {
    palette: brief.palette,
    words,
    imageUrl,
  };
}

async function generateImage(brief: PartyBrief): Promise<string | null> {
  const key = process.env.IMAGE_API_KEY;
  if (!key) return null;

  // TODO: call your image provider of choice here with a prompt like:
  const prompt =
    `A beautifully styled ${brief.theme} ${brief.occasion}, ${brief.vibe}, ` +
    `color palette ${brief.color_names.join(", ")}, ${brief.style_tags.join(", ")}, ` +
    `editorial event photography, soft natural light`;
  void prompt; // remove once implemented

  // Return the hosted image URL the provider gives you. Until then:
  return null;
}
