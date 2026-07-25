"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { RefreshCw, FileCode, Sparkles, BookOpen, ChevronRight, Activity, ArrowLeft } from "lucide-react";

// Components
import UploadComponent from "../src/components/Upload";
import SummaryComponent from "../src/components/Summary";
import VolcanoPlotComponent from "../src/components/VolcanoPlot";
import GeneTableComponent from "../src/components/GeneTable";
import AnnotationPanelComponent from "../src/components/AnnotationPanel";
import AIReportComponent from "../src/components/AIReport";
import ReportDownloadComponent from "../src/components/ReportDownload";

// Types
import { DESeq2Row } from "../src/services/csvParser";
import { GeneAnnotation } from "../src/services/annotation";

export default function Home() {
  const [rows, setRows] = useState<DESeq2Row[]>([]);
  const [filename, setFilename] = useState<string>("");
  const [pAdjThreshold, setPAdjThreshold] = useState<number>(0.05);
  const [lfcThreshold, setLFCThreshold] = useState<number>(1.0);

  // Biological Annotation State
  const [annotations, setAnnotations] = useState<Record<string, GeneAnnotation>>({});
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);

  // AI Report State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportThresholds, setReportThresholds] = useState<{ padj: number; lfc: number } | null>(null);

  // Handle successful manual upload
  const handleUploadSuccess = (data: DESeq2Row[], name: string) => {
    setRows(data);
    setFilename(name);
    setPAdjThreshold(0.05);
    setLFCThreshold(1.0);
    // Reset report state for new file
    setAiReport(null);
    setReportError(null);
    setReportThresholds(null);
  };

  // Pre-load a real-world sample dataset
  const handleUseSample = () => {
    const sampleData: DESeq2Row[] = [
      { gene: "TP53", log2FoldChange: -1.82, padj: 0.00034 },
      { gene: "BRCA1", log2FoldChange: 1.54, padj: 0.0012 },
      { gene: "APOE", log2FoldChange: -2.11, padj: 0.000045 },
      { gene: "TNF", log2FoldChange: 2.89, padj: 0.0000012 },
      { gene: "VEGFA", log2FoldChange: 3.12, padj: 0.00000089 },
      { gene: "IL6", log2FoldChange: 2.45, padj: 0.000054 },
      { gene: "GAPDH", log2FoldChange: 0.05, padj: 0.92 },
      { gene: "AKT1", log2FoldChange: 1.21, padj: 0.015 },
      { gene: "EGFR", log2FoldChange: -1.32, padj: 0.024 },
      { gene: "MYC", log2FoldChange: 1.88, padj: 0.00087 },
      { gene: "PTEN", log2FoldChange: -1.45, padj: 0.0098 },
      { gene: "MTOR", log2FoldChange: 0.95, padj: 0.12 },
      { gene: "CASP3", log2FoldChange: 1.67, padj: 0.0034 },
      { gene: "IL1B", log2FoldChange: 2.95, padj: 0.0000078 },
      { gene: "CCL2", log2FoldChange: 2.33, padj: 0.00012 },
      { gene: "CXCL8", log2FoldChange: 2.71, padj: 0.000067 },
      { gene: "CD8A", log2FoldChange: 1.82, padj: 0.0041 },
      { gene: "CD4", log2FoldChange: -0.45, padj: 0.32 },
      { gene: "ACTB", log2FoldChange: -0.02, padj: 0.98 },
      { gene: "MDM2", log2FoldChange: 1.35, padj: 0.012 },
      { gene: "ESR1", log2FoldChange: -1.62, padj: 0.018 },
      { gene: "AR", log2FoldChange: -1.15, padj: 0.041 },
      { gene: "KRT5", log2FoldChange: -2.85, padj: 0.000095 },
      { gene: "GATA3", log2FoldChange: -1.95, padj: 0.00062 },
      { gene: "FOXA1", log2FoldChange: -1.78, padj: 0.0011 },
      { gene: "STAT3", log2FoldChange: 1.12, padj: 0.045 },
      { gene: "NFKB1", log2FoldChange: 1.48, padj: 0.0089 },
      { gene: "JUN", log2FoldChange: 1.91, padj: 0.00045 },
      { gene: "FOS", log2FoldChange: 2.15, padj: 0.00018 },
      { gene: "SIRT1", log2FoldChange: -1.25, padj: 0.038 },
    ];
    setRows(sampleData);
    setFilename("deseq2_sample_breast_cancer_results.csv");
    setPAdjThreshold(0.05);
    setLFCThreshold(1.0);
    setAiReport(null);
    setReportError(null);
    setReportThresholds(null);
  };

  const handleReset = () => {
    setRows([]);
    setFilename("");
    setAnnotations({});
    setPAdjThreshold(0.05);
    setLFCThreshold(1.0);
    setAiReport(null);
    setReportError(null);
    setReportThresholds(null);
  };

  // Derived significant counts
  const sigGenes = useMemo(() => {
    return rows.filter((row) => row.padj < pAdjThreshold && Math.abs(row.log2FoldChange) > lfcThreshold);
  }, [rows, pAdjThreshold, lfcThreshold]);

  const upregulatedCount = useMemo(() => {
    return sigGenes.filter((row) => row.log2FoldChange > lfcThreshold).length;
  }, [sigGenes, lfcThreshold]);

  const downregulatedCount = useMemo(() => {
    return sigGenes.filter((row) => row.log2FoldChange < -lfcThreshold).length;
  }, [sigGenes, lfcThreshold]);

  // Extract top genes to annotate (up to 10 upregulated, up to 10 downregulated)
  const topUpGenes = useMemo(() => {
    return sigGenes
      .filter((row) => row.log2FoldChange > lfcThreshold)
      .sort((a, b) => b.log2FoldChange - a.log2FoldChange)
      .slice(0, 10);
  }, [sigGenes, lfcThreshold]);

  const topDownGenes = useMemo(() => {
    return sigGenes
      .filter((row) => row.log2FoldChange < -lfcThreshold)
      .sort((a, b) => a.log2FoldChange - b.log2FoldChange)
      .slice(0, 10);
  }, [sigGenes, lfcThreshold]);

  const topGeneSymbols = useMemo(() => {
    return Array.from(new Set([
      ...topUpGenes.map((g) => g.gene),
      ...topDownGenes.map((g) => g.gene),
    ]));
  }, [topUpGenes, topDownGenes]);

  const topGeneSymbolsKey = topGeneSymbols.join(",");

  // Background fetch annotations when top genes change (debounced at 600ms)
  useEffect(() => {
    if (topGeneSymbols.length === 0) return;

    const handler = setTimeout(async () => {
      // Check which symbols we are missing annotations for
      const missingSymbols = topGeneSymbols.filter((sym) => !annotations[sym]);
      if (missingSymbols.length === 0) return; // Up to date!

      setLoadingAnnotations(true);
      try {
        const response = await fetch("/api/annotate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ genes: topGeneSymbols }),
        });
        if (response.ok) {
          const data = await response.json();
          setAnnotations((prev) => ({
            ...prev,
            ...data.annotations,
          }));
        }
      } catch (err) {
        console.error("Error fetching annotations:", err);
      } finally {
        setLoadingAnnotations(false);
      }
    }, 600);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topGeneSymbolsKey]);

  // Request Gemini report generation
  const handleGenerateReport = async () => {
    setLoadingReport(true);
    setReportError(null);

    const evidence = {
      summary: {
        totalGenes: rows.length,
        significantCount: sigGenes.length,
        upregulatedCount,
        downregulatedCount,
        pAdjThreshold,
        lfcThreshold,
      },
      topUpregulated: topUpGenes.map((g) => ({
        gene: g.gene,
        log2FoldChange: g.log2FoldChange,
        padj: g.padj,
        annotation: annotations[g.gene] || {
          gene: g.gene,
          name: "Unknown Gene",
          summary: "No annotation found in the database.",
          goBP: [],
          goMF: [],
          goCC: [],
          pathways: [],
          diseases: [],
        },
      })),
      topDownregulated: topDownGenes.map((g) => ({
        gene: g.gene,
        log2FoldChange: g.log2FoldChange,
        padj: g.padj,
        annotation: annotations[g.gene] || {
          gene: g.gene,
          name: "Unknown Gene",
          summary: "No annotation found in the database.",
          goBP: [],
          goMF: [],
          goCC: [],
          pathways: [],
          diseases: [],
        },
      })),
    };

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence }),
      });

      let data: any = {};
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        const cleanText = text.trim();
        if (cleanText.includes("Service Unavailable") || response.status === 503) {
          data = { error: "The Gemini API service is currently experiencing high demand or is temporarily unavailable (503 Service Unavailable). Please try again in a few moments." };
        } else {
          data = { error: cleanText || `HTTP error! Status: ${response.status}` };
        }
      }

      if (response.ok) {
        setAiReport(data.report);
        setReportThresholds({ padj: pAdjThreshold, lfc: lfcThreshold });
      } else {
        const errMsg = data.error || "";
        if (errMsg.includes("503") || errMsg.includes("Service Unavailable") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE")) {
          setReportError("The Gemini API service is currently experiencing high demand. Please wait a few seconds and try clicking 'Generate Biological Report' again.");
        } else {
          setReportError(errMsg || "Failed to compile AI narrative.");
        }
      }
    } catch (err: any) {
      console.error("AI Generation failed:", err);
      setReportError(err?.message || "A networking error occurred while connecting to the Gemini server.");
    } finally {
      setLoadingReport(false);
    }
  };

  // Determine if report is stale (thresholds changed since generation)
  const isReportStale = useMemo(() => {
    if (!aiReport || !reportThresholds) return false;
    return (
      reportThresholds.padj !== pAdjThreshold || reportThresholds.lfc !== lfcThreshold
    );
  }, [aiReport, reportThresholds, pAdjThreshold, lfcThreshold]);

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-300 pb-20 font-sans">
      {/* Top Banner / Navbar */}
      <header className="h-14 bg-[#0F1117] border-b border-slate-800 sticky top-0 z-50 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white font-sans tracking-tight block">
              RNA-Seq <span className="text-indigo-400">Storyteller</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-medium tracking-wider uppercase">
              v1.0.4-stable
            </span>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline font-sans truncate max-w-xs font-semibold bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
              Active: {filename}
            </span>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Upload New CSV
            </button>
          </div>
        )}
      </header>

      {/* Main Flow Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {rows.length === 0 ? (
          /* Upload View */
          <UploadComponent onUploadSuccess={handleUploadSuccess} onUseSample={handleUseSample} />
        ) : (
          /* Dashboard Dashboard View */
          <div className="space-y-6">
            {/* Top Stat Summary Grid */}
            <SummaryComponent
              totalGenes={rows.length}
              validGenesCount={rows.length}
              skippedCount={0}
              significantCount={sigGenes.length}
              upregulatedCount={upregulatedCount}
              downregulatedCount={downregulatedCount}
              pAdjThreshold={pAdjThreshold}
              lfcThreshold={lfcThreshold}
              onPAdjChange={setPAdjThreshold}
              onLFCChange={setLFCThreshold}
            />

            {/* Visualisations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <VolcanoPlotComponent
                  data={rows}
                  pAdjThreshold={pAdjThreshold}
                  lfcThreshold={lfcThreshold}
                />
              </div>
              <div className="lg:col-span-5">
                <GeneTableComponent
                  data={rows}
                  pAdjThreshold={pAdjThreshold}
                  lfcThreshold={lfcThreshold}
                />
              </div>
            </div>

            {/* Biological Annotations lookups */}
            <AnnotationPanelComponent
              annotations={annotations}
              loading={loadingAnnotations}
              topGenes={topGeneSymbols}
            />

            {/* AI Report Section */}
            <div className="relative">
              {isReportStale && (
                <div className="mb-4 p-3 bg-amber-950/40 border border-amber-900/50 text-amber-200 text-xs rounded-lg flex items-center justify-between shadow-xs">
                  <span className="font-semibold">
                    Cutoff parameters have changed since report compilation. Re-generate to update analysis.
                  </span>
                  <button
                    onClick={handleGenerateReport}
                    className="px-3 py-1 bg-amber-700 text-white font-bold text-xxs rounded hover:bg-amber-600 transition-colors cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
              )}
              
              <AIReportComponent
                onGenerateReport={handleGenerateReport}
                report={aiReport}
                loading={loadingReport}
                error={reportError}
                hasData={rows.length > 0}
              />
            </div>

            {/* Report Downloads and Export triggers */}
            <ReportDownloadComponent reportText={aiReport} filename={filename} />
          </div>
        )}
      </div>

      {/* Bottom Status / Footer */}
      <footer className="h-10 border-t border-slate-800 bg-[#0F1117] flex items-center px-6 justify-between fixed bottom-0 left-0 right-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            Data Validated
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <div className={`w-1.5 h-1.5 rounded-full ${Object.keys(annotations).length > 0 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
            Annotations {Object.keys(annotations).length > 0 ? "Matched" : "Pending"}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
            <div className={`w-1.5 h-1.5 rounded-full ${rows.length > 0 ? "bg-indigo-500 animate-pulse" : "bg-slate-600"}`}></div>
            {rows.length > 0 ? "Interpretation Ready" : "Awaiting Dataset"}
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono">
          Session ID: RNS_2026_0727_X99
        </div>
      </footer>
    </main>
  );
}
