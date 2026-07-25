"use client";

import React from "react";
import { motion } from "motion/react";
import { Sliders, ArrowUpCircle, ArrowDownCircle, Percent, Settings, Database } from "lucide-react";

interface SummaryProps {
  totalGenes: number;
  validGenesCount: number;
  skippedCount: number;
  significantCount: number;
  upregulatedCount: number;
  downregulatedCount: number;
  pAdjThreshold: number;
  lfcThreshold: number;
  onPAdjChange: (value: number) => void;
  onLFCChange: (value: number) => void;
}

export default function SummaryComponent({
  totalGenes,
  validGenesCount,
  skippedCount,
  significantCount,
  upregulatedCount,
  downregulatedCount,
  pAdjThreshold,
  lfcThreshold,
  onPAdjChange,
  onLFCChange,
}: SummaryProps) {
  const percentSignificant = validGenesCount > 0 ? (significantCount / validGenesCount) * 100 : 0;

  return (
    <div id="dataset-summary-container" className="bg-[#0F1117] border border-slate-800 shadow-sm rounded-xl p-4 sm:p-5">
      {/* Top Section: Title & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            Dataset Metrics & Filters
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Overview of parsed expression profiles and interactive threshold parameters.
          </p>
        </div>
        <div className="text-[10px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 font-mono">
          Valid Genes: <span className="font-semibold text-slate-200">{validGenesCount}</span> / Skip: <span className="text-slate-500 font-semibold">{skippedCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Metric Cards Section (7 columns) */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-3">
          {/* Total Significant Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Significant Genes
            </span>
            <div>
              <span className="text-2xl font-bold text-white tracking-tight font-mono">
                {significantCount}
              </span>
              <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                ({percentSignificant.toFixed(1)}%)
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
              Passing adjusted p-value and log2FC cutoffs.
            </p>
          </div>

          {/* Upregulated Card */}
          <div className="bg-rose-950/10 border border-rose-900/30 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                Upregulated
              </span>
              <ArrowUpCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <span className="text-2xl font-bold text-rose-400 tracking-tight font-mono">
                {upregulatedCount}
              </span>
            </div>
            <p className="text-[10px] text-rose-400/70 mt-1.5 leading-normal">
              Genes with log2FC &gt; {lfcThreshold} (positive change)
            </p>
          </div>

          {/* Downregulated Card */}
          <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Downregulated
              </span>
              <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <span className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">
                {downregulatedCount}
              </span>
            </div>
            <p className="text-[10px] text-emerald-400/70 mt-1.5 leading-normal">
              Genes with log2FC &lt; -{lfcThreshold} (negative change)
            </p>
          </div>

          {/* Ratio Card */}
          <div className="bg-indigo-950/15 border border-indigo-900/30 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                DE Ratio
              </span>
              <Percent className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <span className="text-2xl font-bold text-indigo-400 tracking-tight font-mono">
                {upregulatedCount === 0 && downregulatedCount === 0 
                  ? "1:1" 
                  : `${(upregulatedCount / (downregulatedCount || 1)).toFixed(1)}x`}
              </span>
            </div>
            <p className="text-[10px] text-indigo-400/70 mt-1.5 leading-normal">
              Upregulated vs downregulated targets.
            </p>
          </div>
        </div>

        {/* Adjust Thresholds Card (5 columns) */}
        <div className="lg:col-span-5 bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="mb-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Adjust Significance Cutoffs
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Refine the stringency requirements for genomic mapping.
            </p>
          </div>

          {/* Adjusted P-Value Slider */}
          <div className="space-y-1 mb-3">
            <div className="flex justify-between items-center text-[11px]">
              <label htmlFor="padj-range" className="font-semibold text-slate-300">Adjusted p-value (padj)</label>
              <span className="font-mono bg-[#0A0C10] border border-slate-800 px-2 py-0.5 rounded font-bold text-indigo-400">
                &lt; {pAdjThreshold.toFixed(3)}
              </span>
            </div>
            <input
              id="padj-range"
              type="range"
              min="0.001"
              max="0.100"
              step="0.001"
              value={pAdjThreshold}
              onChange={(e) => onPAdjChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0.001 (Strict)</span>
              <span>0.050 (Standard)</span>
              <span>0.100 (Relaxed)</span>
            </div>
          </div>

          {/* Log2 Fold Change Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <label htmlFor="lfc-range" className="font-semibold text-slate-300">Log2 Fold Change (|log2FC|)</label>
              <span className="font-mono bg-[#0A0C10] border border-slate-800 px-2 py-0.5 rounded font-bold text-indigo-400">
                &gt; {lfcThreshold.toFixed(2)}
              </span>
            </div>
            <input
              id="lfc-range"
              type="range"
              min="0.00"
              max="4.00"
              step="0.10"
              value={lfcThreshold}
              onChange={(e) => onLFCChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0.00 (All)</span>
              <span>1.00 (2x)</span>
              <span>2.00 (4x)</span>
              <span>4.00 (16x)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
