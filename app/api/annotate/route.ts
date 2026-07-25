import { NextRequest, NextResponse } from "next/server";
import { getBatchAnnotations } from "../../../src/services/annotation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { genes } = body as { genes: string[] };

    if (!genes || !Array.isArray(genes)) {
      return NextResponse.json(
        { error: "Invalid request payload. Please provide an array of gene symbols." },
        { status: 400 }
      );
    }

    if (genes.length === 0) {
      return NextResponse.json({ annotations: {} });
    }

    // Limit batch size to 30 genes to prevent heavy loads or long requests
    const limitedGenes = genes.slice(0, 30);
    const annotations = await getBatchAnnotations(limitedGenes);

    return NextResponse.json({ annotations });

  } catch (error: any) {
    console.error("API error in /api/annotate:", error);
    return NextResponse.json(
      { error: error?.message || "An error occurred while retrieving biological annotations." },
      { status: 500 }
    );
  }
}
