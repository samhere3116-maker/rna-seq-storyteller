import { NextRequest, NextResponse } from "next/server";
import { generateInterpretation, EvidencePackage } from "../../../src/services/gemini";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return NextResponse.json(
        { 
          error: "GEMINI_API_KEY is not configured in Secrets. Please add your GEMINI_API_KEY in the Settings > Secrets panel of AI Studio to enable AI-powered biological interpretation." 
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { evidence } = body as { evidence: EvidencePackage };

    if (!evidence || !evidence.summary || !evidence.topUpregulated || !evidence.topDownregulated) {
      return NextResponse.json(
        { error: "Invalid request payload. Missing core evidence data." },
        { status: 400 }
      );
    }

    const reportText = await generateInterpretation(evidence);
    return NextResponse.json({ report: reportText });

  } catch (error: any) {
    console.error("API error in /api/interpret:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred during report generation." },
      { status: 500 }
    );
  }
}
