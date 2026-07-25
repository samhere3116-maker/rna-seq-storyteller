"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DESeq2Row } from "../../services/csvParser";
import { BarChart3, HelpCircle, ZoomIn } from "lucide-react";

// Dynamically import react-plotly.js to avoid SSR errors
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-slate-500 font-sans mt-4 font-semibold">Loading interactive Volcano Plot engine...</p>
    </div>
  ),
});

interface VolcanoPlotProps {
  data: DESeq2Row[];
  pAdjThreshold: number;
  lfcThreshold: number;
}

export default function VolcanoPlotComponent({ data, pAdjThreshold, lfcThreshold }: VolcanoPlotProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[500px] bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
        <p className="text-sm text-slate-400 font-mono">Initializing plotting context...</p>
      </div>
    );
  }

  // Separate data into three groups for legends and coloring
  const upReg: DESeq2Row[] = [];
  const downReg: DESeq2Row[] = [];
  const nonSig: DESeq2Row[] = [];

  data.forEach((row) => {
    const isSig = row.padj < pAdjThreshold;
    if (isSig && row.log2FoldChange > lfcThreshold) {
      upReg.push(row);
    } else if (isSig && row.log2FoldChange < -lfcThreshold) {
      downReg.push(row);
    } else {
      nonSig.push(row);
    }
  });

  // Safe -log10 transformation function
  const safeNegLog10 = (val: number): number => {
    const clamped = Math.max(val, 1e-300); // Prevent -log10(0) which is Infinity
    return -Math.log10(clamped);
  };

  const traces = [
    // Non-Significant Genes
    {
      x: nonSig.map((r) => r.log2FoldChange),
      y: nonSig.map((r) => safeNegLog10(r.padj)),
      text: nonSig.map((r) => `Gene: <b>${r.gene}</b><br>log2FC: ${r.log2FoldChange.toFixed(3)}<br>padj: ${r.padj.toExponential(3)}`),
      mode: "markers" as const,
      name: "Not Significant",
      type: "scatter" as const,
      hoverinfo: "text" as const,
      marker: {
        color: "#334155",
        size: 5,
        opacity: 0.6,
      },
    },
    // Downregulated Genes (Emerald)
    {
      x: downReg.map((r) => r.log2FoldChange),
      y: downReg.map((r) => safeNegLog10(r.padj)),
      text: downReg.map((r) => `Gene: <b>${r.gene}</b> (Down)<br>log2FC: ${r.log2FoldChange.toFixed(3)}<br>padj: ${r.padj.toExponential(3)}`),
      mode: "markers" as const,
      name: `Significant Downregulated (<-${lfcThreshold})`,
      type: "scatter" as const,
      hoverinfo: "text" as const,
      marker: {
        color: "#10b981", // Emerald-500
        size: 7,
        opacity: 0.9,
        line: {
          color: "#047857",
          width: 0.5,
        },
      },
    },
    // Upregulated Genes (Rose)
    {
      x: upReg.map((r) => r.log2FoldChange),
      y: upReg.map((r) => safeNegLog10(r.padj)),
      text: upReg.map((r) => `Gene: <b>${r.gene}</b> (Up)<br>log2FC: ${r.log2FoldChange.toFixed(3)}<br>padj: ${r.padj.toExponential(3)}`),
      mode: "markers" as const,
      name: `Significant Upregulated (>${lfcThreshold})`,
      type: "scatter" as const,
      hoverinfo: "text" as const,
      marker: {
        color: "#f43f5e", // Rose-500
        size: 7,
        opacity: 0.9,
        line: {
          color: "#be123c",
          width: 0.5,
        },
      },
    },
  ];

  const layout = {
    title: {
      text: "<b>Differential Expression Volcano Plot</b>",
      font: {
        family: "var(--font-sans), Inter, sans-serif",
        size: 14,
        color: "#ffffff",
      },
      y: 0.95,
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    xaxis: {
      title: "Log2 Fold Change (log2FC)",
      zeroline: true,
      zerolinecolor: "#475569",
      zerolinewidth: 1,
      gridcolor: "#1e293b",
      tickfont: { size: 10, family: "monospace", color: "#94a3b8" },
      titlefont: { size: 11, family: "sans-serif", color: "#cbd5e1" },
    },
    yaxis: {
      title: "-log10(Adjusted p-value)",
      gridcolor: "#1e293b",
      zeroline: true,
      zerolinecolor: "#475569",
      tickfont: { size: 10, family: "monospace", color: "#94a3b8" },
      titlefont: { size: 11, family: "sans-serif", color: "#cbd5e1" },
    },
    hovermode: "closest" as const,
    dragmode: "zoom" as const,
    legend: {
      orientation: "h" as const,
      x: 0.5,
      y: -0.18,
      xanchor: "center" as const,
      font: { size: 10, family: "sans-serif", color: "#94a3b8" },
    },
    margin: { l: 50, r: 30, t: 30, b: 50 },
    autosize: true,
    // Add significance cutoff lines (dashed)
    shapes: [
      // Left vertical fold-change cutoff
      {
        type: "line" as const,
        x0: -lfcThreshold,
        y0: 0,
        x1: -lfcThreshold,
        y1: 1,
        yref: "paper" as const,
        line: {
          color: "#475569",
          width: 1.5,
          dash: "dashdot",
        },
      },
      // Right vertical fold-change cutoff
      {
        type: "line" as const,
        x0: lfcThreshold,
        y0: 0,
        x1: lfcThreshold,
        y1: 1,
        yref: "paper" as const,
        line: {
          color: "#475569",
          width: 1.5,
          dash: "dashdot",
        },
      },
      // Horizontal p-adj cutoff line
      {
        type: "line" as const,
        x0: 0,
        y0: safeNegLog10(pAdjThreshold),
        x1: 1,
        y1: safeNegLog10(pAdjThreshold),
        xref: "paper" as const,
        line: {
          color: "#475569",
          width: 1.5,
          dash: "dashdot",
        },
      },
    ],
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["lasso2d", "select2d"],
  };

  return (
    <div id="volcano-plot-card" className="bg-[#0F1117] border border-slate-800 shadow-sm rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Volcano Plot Visualization
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Statistical significance vs. magnitude of expression change.
          </p>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800">
          <ZoomIn className="w-3 h-3 text-indigo-400" />
          <span>Click & drag to zoom. Double-click to reset.</span>
        </div>
      </div>

      {/* Plot Container */}
      <div className="w-full relative min-h-[400px]">
        <Plot
          data={traces}
          layout={layout as any}
          config={config}
          className="w-full min-h-[400px]"
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Plot Interpretation Guideline */}
      <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-400 leading-relaxed">
          <strong>How to read:</strong> Points in the <strong>upper left</strong> (Emerald) represent significant downregulated targets. Points in the <strong>upper right</strong> (Rose) represent significant upregulated targets. Dashed lines denote cutoffs at <code>p={pAdjThreshold}</code> and <code>|log2FC|={lfcThreshold}</code>.
        </div>
      </div>
    </div>
  );
}
