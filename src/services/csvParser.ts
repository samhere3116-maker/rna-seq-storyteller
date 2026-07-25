export interface DESeq2Row {
  gene: string;
  log2FoldChange: number;
  padj: number;
}

export interface ParserResult {
  success: boolean;
  data: DESeq2Row[];
  error?: string;
  summary?: {
    totalGenes: number;
    validGenesCount: number;
    skippedCount: number;
  };
}

/**
 * Parses a DESeq2 results CSV file.
 * The CSV must contain columns: Gene, log2FoldChange, padj (case-insensitive or exact).
 */
export function parseDESeq2CSV(csvContent: string): ParserResult {
  if (!csvContent || csvContent.trim() === "") {
    return {
      success: false,
      data: [],
      error: "The uploaded file is empty. Please select a valid DESeq2 results CSV file.",
    };
  }

  const lines = csvContent.split(/\r?\n/);
  if (lines.length < 2) {
    return {
      success: false,
      data: [],
      error: "The uploaded file does not contain enough data. It must include a header row and at least one gene row.",
    };
  }

  // Helper function to split CSV line, handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ""));
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  
  // Find column indices
  // We allow exact case or standard case-insensitive matches for flexibility, 
  // but we enforce the required columns exist.
  const getColIndex = (names: string[]): number => {
    return headers.findIndex(h => {
      const cleanHeader = h.toLowerCase().replace(/["']/g, "").trim();
      return names.map(n => n.toLowerCase()).includes(cleanHeader);
    });
  };

  const geneIdx = getColIndex(["Gene", "gene", "symbol", "id", "row.names", ""]);
  const lfcIdx = getColIndex(["log2FoldChange", "log2fc", "log2_fold_change", "logfc"]);
  const padjIdx = getColIndex(["padj", "p.adj", "p_adj", "padjusted", "p-adj"]);

  if (geneIdx === -1 || lfcIdx === -1 || padjIdx === -1) {
    const missing: string[] = [];
    if (geneIdx === -1) missing.push("Gene (e.g. 'Gene', 'symbol')");
    if (lfcIdx === -1) missing.push("log2FoldChange (e.g. 'log2FoldChange', 'log2FC')");
    if (padjIdx === -1) missing.push("padj (e.g. 'padj', 'p.adj')");
    
    return {
      success: false,
      data: [],
      error: `Missing required column(s): ${missing.join(", ")}. Please ensure your CSV has these headers.`,
    };
  }

  const data: DESeq2Row[] = [];
  const seenGenes = new Set<string>();
  let skippedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // skip blank lines

    const row = parseCSVLine(line);
    // If the row doesn't have enough columns, skip or flag
    if (row.length <= Math.max(geneIdx, lfcIdx, padjIdx)) {
      skippedCount++;
      continue;
    }

    const rawGene = row[geneIdx];
    const rawLFC = row[lfcIdx];
    const rawPadj = row[padjIdx];

    // If gene symbol is missing, skip
    if (!rawGene || rawGene.trim() === "") {
      skippedCount++;
      continue;
    }

    const gene = rawGene.trim();

    // Check for duplicates
    if (seenGenes.has(gene)) {
      return {
        success: false,
        data: [],
        error: `Data validation failed: Duplicate entry found for gene '${gene}'. Each gene must have a unique row.`,
      };
    }

    // DESeq2 often outputs 'NA' or empty values for padj (or log2FoldChange) when the gene's average expression count is too low
    // We should skip these rows gracefully as they cannot be evaluated for significance
    if (
      rawLFC === "" || 
      rawPadj === "" || 
      rawLFC.toUpperCase() === "NA" || 
      rawPadj.toUpperCase() === "NA" ||
      rawLFC.toUpperCase() === "NULL" || 
      rawPadj.toUpperCase() === "NULL"
    ) {
      skippedCount++;
      continue;
    }

    const log2FoldChange = parseFloat(rawLFC);
    const padj = parseFloat(rawPadj);

    if (isNaN(log2FoldChange) || isNaN(padj)) {
      skippedCount++;
      continue; // Skip lines with invalid numbers
    }

    seenGenes.add(gene);
    data.push({
      gene,
      log2FoldChange,
      padj,
    });
  }

  if (data.length === 0) {
    return {
      success: false,
      data: [],
      error: "No valid gene rows could be parsed. Make sure your values are numbers and not empty.",
    };
  }

  return {
    success: true,
    data,
    summary: {
      totalGenes: data.length + skippedCount,
      validGenesCount: data.length,
      skippedCount,
    }
  };
}
