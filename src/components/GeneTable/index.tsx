"use client";

import React, { useState } from "react";
import { DESeq2Row } from "../../services/csvParser";
import { ArrowUp, ArrowDown, Table, Clipboard, Check } from "lucide-react";

interface GeneTableProps {
  data: DESeq2Row[];
  pAdjThreshold: number;
  lfcThreshold: number;
}

export default function GeneTableComponent({ data, pAdjThreshold, lfcThreshold }: GeneTableProps) {
  const [activeTab, setActiveTab] = useState<"up" | "down">("up");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Filter for significant genes
  const sigGenes = data.filter((row) => row.padj < pAdjThreshold);

  // Top Upregulated: Sort by log2FoldChange descending, filter log2FC > threshold
  const topUpregulated = sigGenes
    .filter((row) => row.log2FoldChange > lfcThreshold)
    .sort((a, b) => b.log2FoldChange - a.log2FoldChange)
    .slice(0, 10);

  // Top Downregulated: Sort by log2FoldChange ascending, filter log2FC < -threshold
  const topDownregulated = sigGenes
    .filter((row) => row.log2FoldChange < -lfcThreshold)
    .sort((a, b) => a.log2FoldChange - b.log2FoldChange)
    .slice(0, 10);

  const copyToClipboard = (type: "up" | "down", list: DESeq2Row[]) => {
    const textToCopy = "Gene\tlog2FoldChange\tpadj\n" + 
      list.map((r) => `${r.gene}\t${r.log2FoldChange.toFixed(4)}\t${r.padj.toExponential(4)}`).join("\n");
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedText(type);
      setTimeout(() => setCopiedText(null), 2000);
    });
  };

  return (
    <div id="gene-tables-card" className="bg-[#0F1117] border border-slate-800 shadow-sm rounded-xl p-4 sm:p-5">
      {/* Header and Tab Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Table className="w-4 h-4 text-indigo-400" />
            Top Differential Transcripts
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Ranked list of top upregulated and downregulated transcription targets.
          </p>
        </div>
 
        {/* Tab Buttons */}
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("up")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "up"
                ? "bg-rose-950/30 text-rose-400 border border-rose-900/30 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Upregulated ({topUpregulated.length})
          </button>
          <button
            onClick={() => setActiveTab("down")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "down"
                ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/30 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Downregulated ({topDownregulated.length})
          </button>
        </div>
      </div>
 
      {/* Tables Container */}
      <div>
        {activeTab === "up" ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-sans">
              <span>Showing top 10 upregulated targets (highest fold change)</span>
              {topUpregulated.length > 0 && (
                <button
                  onClick={() => copyToClipboard("up", topUpregulated)}
                  className="text-xxs hover:text-indigo-400 text-slate-400 flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === "up" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3 h-3" />
                      Copy TSV Table
                    </>
                  )}
                </button>
              )}
            </div>
 
            {topUpregulated.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/30 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-500">No upregulated genes pass current threshold criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold font-sans">
                      <th className="p-2 sm:p-2.5">Rank</th>
                      <th className="p-2 sm:p-2.5">Gene Symbol</th>
                      <th className="p-2 sm:p-2.5 text-right">log2FC</th>
                      <th className="p-2 sm:p-2.5 text-right">padj</th>
                      <th className="p-2 sm:p-2.5 text-right">Expression Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {topUpregulated.map((row, idx) => (
                      <tr key={row.gene} className="hover:bg-slate-900/30">
                        <td className="p-2 sm:p-2.5 font-mono text-slate-500 font-semibold">{idx + 1}</td>
                        <td className="p-2 sm:p-2.5 font-bold text-white">{row.gene}</td>
                        <td className="p-2 sm:p-2.5 text-right font-mono font-semibold text-rose-400">+{row.log2FoldChange.toFixed(4)}</td>
                        <td className="p-2 sm:p-2.5 text-right font-mono text-slate-400">{row.padj.toExponential(4)}</td>
                        <td className="p-2 sm:p-2.5 text-right">
                          <span className="px-2 py-0.5 bg-rose-950/20 text-rose-400 font-semibold text-[10px] rounded border border-rose-900/30">
                            +{Math.pow(2, row.log2FoldChange).toFixed(1)}x Fold
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-sans">
              <span>Showing top 10 downregulated targets (lowest fold change)</span>
              {topDownregulated.length > 0 && (
                <button
                  onClick={() => copyToClipboard("down", topDownregulated)}
                  className="text-xxs hover:text-indigo-400 text-slate-400 flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === "down" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3 h-3" />
                      Copy TSV Table
                    </>
                  )}
                </button>
              )}
            </div>
 
            {topDownregulated.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/30 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-500">No downregulated genes pass current threshold criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold font-sans">
                      <th className="p-2 sm:p-2.5">Rank</th>
                      <th className="p-2 sm:p-2.5">Gene Symbol</th>
                      <th className="p-2 sm:p-2.5 text-right">log2FC</th>
                      <th className="p-2 sm:p-2.5 text-right">padj</th>
                      <th className="p-2 sm:p-2.5 text-right">Expression Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {topDownregulated.map((row, idx) => (
                      <tr key={row.gene} className="hover:bg-slate-900/30">
                        <td className="p-2 sm:p-2.5 font-mono text-slate-500 font-semibold">{idx + 1}</td>
                        <td className="p-2 sm:p-2.5 font-bold text-white">{row.gene}</td>
                        <td className="p-2 sm:p-2.5 text-right font-mono font-semibold text-emerald-400">{row.log2FoldChange.toFixed(4)}</td>
                        <td className="p-2 sm:p-2.5 text-right font-mono text-slate-400">{row.padj.toExponential(4)}</td>
                        <td className="p-2 sm:p-2.5 text-right">
                          <span className="px-2 py-0.5 bg-emerald-950/20 text-emerald-400 font-semibold text-[10px] rounded border border-emerald-900/30">
                            1/{Math.pow(2, Math.abs(row.log2FoldChange)).toFixed(1)}x Fold
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
