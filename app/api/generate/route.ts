import { NextResponse } from "next/server";
import { parseDesires, generateGuides } from "@/lib/anthropic";
import { allocateBudget } from "@/lib/budget";
import { getCatalog, buildCategoryPlans } from "@/lib/catalog";
import { buildMoodBoard } from "@/lib/render";
import type { PartyPlan } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text: string = (body.text || "").toString().trim();
    const budget = Number(body.budget) || 0;

    if (!text) {
      return NextResponse.json({ error: "Tell us about your party first." }, { status: 400 });
    }
    if (budget <= 0) {
      return NextResponse.json({ error: "Add a budget greater than zero." }, { status: 400 });
    }

    let image: { mediaType: string; data: string } | undefined;
    if (body.image && body.image.data && body.image.mediaType) {
      image = { mediaType: body.image.mediaType, data: body.image.data };
    }

    // Job 1: desires -> structured brief
    const brief = await parseDesires(text, image);

    // Job 2: budget split + product matching
    const allocations = allocateBudget(budget, brief);
    const catalog = await getCatalog();
    const categories = await buildCategoryPlans(allocations, brief, catalog);
    const total =
      Math.round(categories.reduce((sum, c) => sum + c.spent, 0) * 100) / 100;

    // Job 3: visual preview
    const moodboard = await buildMoodBoard(brief);

    // Job 4: DIY how-to guides for the things they're buying (resilient)
    const itemTitles = categories.flatMap((c) => c.items.map((i) => i.title));
    const guides = await generateGuides(brief, itemTitles).catch(() => []);

    const plan: PartyPlan = {
      brief,
      budget,
      total,
      categories,
      moodboard,
      guides,
      live: !!process.env.PRODUCT_API_KEY,
    };
    return NextResponse.json(plan);
  } catch (err: any) {
    const message = err?.message || "Something went wrong generating your plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
