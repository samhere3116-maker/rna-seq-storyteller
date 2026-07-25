export interface GeneAnnotation {
  gene: string;
  name: string;
  summary: string;
  goBP: string[]; // Biological Process
  goMF: string[]; // Molecular Function
  goCC: string[]; // Cellular Component
  pathways: string[]; // KEGG, Reactome, etc.
  diseases: string[]; // General associations where available
}

/**
 * Batch retrieves biological annotations for a list of genes using MyGene.info
 * If any gene lookup fails, it returns a graceful placeholder so the workflow is never blocked.
 */
export async function getBatchAnnotations(genes: string[]): Promise<Record<string, GeneAnnotation>> {
  const result: Record<string, GeneAnnotation> = {};

  // Initialize with fallback/empty annotations
  genes.forEach(g => {
    result[g] = {
      gene: g,
      name: "Unknown Gene",
      summary: "No annotation found in the database.",
      goBP: [],
      goMF: [],
      goCC: [],
      pathways: [],
      diseases: [],
    };
  });

  if (genes.length === 0) return result;

  try {
    const response = await fetch("https://mygene.info/v3/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        q: genes.join(","),
        scopes: "symbol",
        fields: "name,summary,go.BP,go.MF,go.CC,pathway.kegg,pathway.reactome,generif",
        species: "human,mouse,rat",
      }).toString(),
    });

    if (!response.ok) {
      console.error(`MyGene.info API error: ${response.status} ${response.statusText}`);
      return result; // Fall back to empty templates
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return result;
    }

    // Helper to extract terms from GO objects/arrays
    const extractGOTerms = (goNode: any): string[] => {
      if (!goNode) return [];
      const nodes = Array.isArray(goNode) ? goNode : [goNode];
      return nodes
        .map((n: any) => n.term)
        .filter((t: any) => typeof t === "string" && t.trim() !== "")
        .slice(0, 5); // Take top 5 for brief representation
    };

    // Helper to extract pathways
    const extractPathways = (pathwayNode: any): string[] => {
      if (!pathwayNode) return [];
      const pathwaysList: string[] = [];
      
      const processPathwaySource = (source: any) => {
        if (!source) return;
        const items = Array.isArray(source) ? source : [source];
        items.forEach((item: any) => {
          if (item && typeof item.name === "string") {
            pathwaysList.push(item.name);
          }
        });
      };

      processPathwaySource(pathwayNode.kegg);
      processPathwaySource(pathwayNode.reactome);

      return Array.from(new Set(pathwaysList)).slice(0, 5); // Take top 5 unique pathways
    };

    // Process disease or functional hints from GenRIFs
    const extractDiseaseAndFunctionalHints = (generifNode: any): { summary: string; diseases: string[] } => {
      if (!generifNode) return { summary: "", diseases: [] };
      const rifs = Array.isArray(generifNode) ? generifNode : [generifNode];
      
      // Look for disease terms in GeneRIF text
      const diseasesSet = new Set<string>();
      const commonDiseases = ["cancer", "diabetes", "alzheimer", "cardiomyopathy", "autism", "schizophrenia", "parkinson", "rheumatoid", "lupus", "obesity", "leukemia", "tumor", "syndrome"];
      
      rifs.forEach((rif: any) => {
        if (rif && typeof rif.text === "string") {
          const textLower = rif.text.toLowerCase();
          commonDiseases.forEach(d => {
            if (textLower.includes(d)) {
              // Capitalize disease term
              diseasesSet.add(d.charAt(0).toUpperCase() + d.slice(1));
            }
          });
        }
      });

      // Combine first couple of GeneRIF sentences if summary is missing
      const summaryText = rifs
        .slice(0, 2)
        .map((rif: any) => rif.text)
        .filter((t: any) => typeof t === "string")
        .join(" ");

      return {
        summary: summaryText,
        diseases: Array.from(diseasesSet).slice(0, 5),
      };
    };

    // Map the returned annotations to the respective genes
    data.forEach((item: any) => {
      const geneSymbol = item.query;
      if (!geneSymbol || !result[geneSymbol]) return;

      // Extract GeneRIF hints
      const rifHints = extractDiseaseAndFunctionalHints(item.generif);

      const name = item.name || "Unknown Gene";
      const summary = item.summary || rifHints.summary || "No functional summary available for this gene.";
      
      const goBP = extractGOTerms(item.go?.BP);
      const goMF = extractGOTerms(item.go?.MF);
      const goCC = extractGOTerms(item.go?.CC);

      const pathways = extractPathways(item.pathway);
      const diseases = rifHints.diseases;

      result[geneSymbol] = {
        gene: geneSymbol,
        name,
        summary,
        goBP,
        goMF,
        goCC,
        pathways,
        diseases,
      };
    });

  } catch (error) {
    console.error("Failed to fetch annotations from MyGene.info:", error);
  }

  return result;
}
