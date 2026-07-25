import { GoogleGenAI } from "@google/genai";
import { GeneAnnotation } from "./annotation";

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Secrets / environment variables.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

export interface EvidencePackage {
  summary: {
    totalGenes: number;
    significantCount: number;
    upregulatedCount: number;
    downregulatedCount: number;
    pAdjThreshold: number;
    lfcThreshold: number;
  };
  topUpregulated: {
    gene: string;
    log2FoldChange: number;
    padj: number;
    annotation: GeneAnnotation;
  }[];
  topDownregulated: {
    gene: string;
    log2FoldChange: number;
    padj: number;
    annotation: GeneAnnotation;
  }[];
}

/**
 * Builds a strict, structured text representation of the evidence package.
 */
function buildEvidenceText(evidence: EvidencePackage): string {
  let text = "=== EVIDENCE PACKAGE ===\n\n";
  
  text += "--- DATASET SUMMARY ---\n";
  text += `- Total Genes Parsed: ${evidence.summary.totalGenes}\n`;
  text += `- Significant Genes: ${evidence.summary.significantCount}\n`;
  text += `- Upregulated Genes (log2FC > ${evidence.summary.lfcThreshold}, padj < ${evidence.summary.pAdjThreshold}): ${evidence.summary.upregulatedCount}\n`;
  text += `- Downregulated Genes (log2FC < -${evidence.summary.lfcThreshold}, padj < ${evidence.summary.pAdjThreshold}): ${evidence.summary.downregulatedCount}\n\n`;

  text += "--- TOP 10 UPREGULATED GENES ---\n";
  evidence.topUpregulated.forEach((g, idx) => {
    text += `${idx + 1}. GENE SYMBOL: ${g.gene}\n`;
    text += `   - Log2 Fold Change: ${g.log2FoldChange.toFixed(4)}\n`;
    text += `   - Adjusted p-value (padj): ${g.padj.toExponential(4)}\n`;
    text += `   - Gene Name: ${g.annotation.name}\n`;
    text += `   - Function Summary: ${g.annotation.summary}\n`;
    if (g.annotation.goBP.length > 0) text += `   - Biological Process GO Terms: ${g.annotation.goBP.join(", ")}\n`;
    if (g.annotation.pathways.length > 0) text += `   - Pathways: ${g.annotation.pathways.join(", ")}\n`;
    if (g.annotation.diseases.length > 0) text += `   - Disease Associations: ${g.annotation.diseases.join(", ")}\n`;
    text += "\n";
  });

  text += "--- TOP 10 DOWNREGULATED GENES ---\n";
  evidence.topDownregulated.forEach((g, idx) => {
    text += `${idx + 1}. GENE SYMBOL: ${g.gene}\n`;
    text += `   - Log2 Fold Change: ${g.log2FoldChange.toFixed(4)}\n`;
    text += `   - Adjusted p-value (padj): ${g.padj.toExponential(4)}\n`;
    text += `   - Gene Name: ${g.annotation.name}\n`;
    text += `   - Function Summary: ${g.annotation.summary}\n`;
    if (g.annotation.goBP.length > 0) text += `   - Biological Process GO Terms: ${g.annotation.goBP.join(", ")}\n`;
    if (g.annotation.pathways.length > 0) text += `   - Pathways: ${g.annotation.pathways.join(", ")}\n`;
    if (g.annotation.diseases.length > 0) text += `   - Disease Associations: ${g.annotation.diseases.join(", ")}\n`;
    text += "\n";
  });

  return text;
}

/**
 * Generates a biologically grounded interpretation using Gemini based strictly on the provided evidence package.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const msg = String(error?.message || error || "").toLowerCase();
      const isTransient = msg.includes("503") || 
                          msg.includes("unavailable") || 
                          msg.includes("high demand") || 
                          msg.includes("overloaded") || 
                          msg.includes("rate limit") ||
                          msg.includes("resource exhausted") ||
                          msg.includes("429");
      
      if (isTransient && attempt < maxRetries) {
        const sleepTime = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
        console.warn(`Gemini call failed (transient error). Retrying in ${Math.round(sleepTime)}ms (attempt ${attempt}/${maxRetries}). Error:`, error);
        await delay(sleepTime);
        continue;
      }
      throw error;
    }
  }
}

export async function generateInterpretation(evidence: EvidencePackage): Promise<string> {
  const ai = getAI();
  const evidenceText = buildEvidenceText(evidence);

  const systemInstruction = `You are an expert bioinformatician and system biologist specializing in interpreting RNA-Seq differential expression results.
Your task is to write a highly professional, scientifically grounded, and rigorous interpretation report of the uploaded DESeq2 results.

CRITICAL GROUNDING RULES:
1. You MUST rely ONLY on the provided biological evidence package. 
2. Do NOT invent pathways, biological processes, or cellular functions that are not supported by the gene annotations in the evidence.
3. State uncertainty where evidence is limited, sparse, or ambiguous. It is completely acceptable and expected to state "No pathway information is provided in the annotations for these top genes." or similar statements if that is the case.
4. Do NOT make clinical claims or diagnostic statements. This is an exploratory research report.
5. Your tone should be objective, analytical, and academic. Do not use conversational filler, sales pitch terms, or exclamation marks.

REQUIRED REPORT SECTIONS:
Your output MUST contain the following exact sections with markdown headers:

### 1. Dataset Summary & Overview
Briefly describe the overall distribution of differential expression (total, significant, upregulated, and downregulated counts) and what these ratios represent.

### 2. Key Findings & Top Genes
Discuss the top upregulated and top downregulated genes based on their log2 fold changes and padj statistics. Detail their known molecular functions.

### 3. Major Biological Processes & Pathways
Synthesize the common biological processes, GO terms, or pathways represented by the significant genes. Identify if they point towards a coordinated biological response.

### 4. Coordinated Cellular Response & Potential Interpretation
Offer a systems-biology interpretation of the likely state of the cell or tissue. For example, is there an active stress response, metabolic shift, developmental change, or immune activation? Link this directly to the evidence.

### 5. Study Limitations & Gaps in Evidence
Detail limitations of this analysis (e.g., small number of annotated top genes, general nature of databases, lack of network/protein interactions). State where uncertainty lies in the data.

### 6. Suggested Follow-Up Experiments
Propose 2-3 specific, realistic biological experiments (e.g., qPCR validation, Western blot, cell viability assays, or pathway-specific knockdowns/assays) that the researcher can perform to validate these in silico findings.

Use standard scientific terminology and format headers exactly as requested.`;

  const generateWithModel = async (modelName: string) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Please interpret the following RNA-seq differential expression results. Provide your response strictly adhering to the grounding rules and structure provided.

${evidenceText}`,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature to minimize creative leaps and maximize grounding
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error(`No content received from the Gemini model (${modelName}).`);
    }
    return text;
  };

  try {
    try {
      // Try primary model (gemini-3.5-flash) with retry
      return await callWithRetry(() => generateWithModel("gemini-3.5-flash"), 3);
    } catch (primaryError: any) {
      console.warn("Primary model (gemini-3.5-flash) failed after retries. Trying fallback model gemini-flash-latest. Error:", primaryError);
      try {
        // Try stable alias (gemini-flash-latest) with retry
        return await callWithRetry(() => generateWithModel("gemini-flash-latest"), 3);
      } catch (aliasError: any) {
        console.warn("Alias model (gemini-flash-latest) failed after retries. Trying fallback model gemini-3.1-flash-lite. Error:", aliasError);
        // Try fallback model (gemini-3.1-flash-lite) with retry
        return await callWithRetry(() => generateWithModel("gemini-3.1-flash-lite"), 3);
      }
    }
  } catch (error: any) {
    console.error("Gemini API call failed completely:", error);
    throw new Error(`AI interpretation failed: ${error?.message || error || "Unknown error"}`);
  }
}
