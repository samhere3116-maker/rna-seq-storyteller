"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { Cpu, AlertTriangle, Sparkles, CheckCircle2, RotateCw } from "lucide-react";

interface AIReportProps {
  onGenerateReport: () => void;
  report: string | null;
  loading: boolean;
  error: string | null;
  hasData: boolean;
}

const STATUS_MESSAGES = [
  "Structuring genomic evidence package...",
  "Filtering target log2 fold change distributions...",
  "Consolidating NCBI Entrez functional summaries...",
  "Validating Gene Ontology biological process nodes...",
  "Mapping candidate KEGG and Reactome pathways...",
  "Analyzing transcript ratios (Upregulated vs Downregulated)...",
  "Synthesizing cellular response hypotheses via Gemini...",
  "Formulating experimental validation methodologies...",
  "Drafting final research manuscript sections...",
];

export default function AIReportComponent({
  onGenerateReport,
  report,
  loading,
  error,
  hasData,
}: AIReportProps) {
  const [statusIdx, setStatusIdx] = useState(0);

  // Cycle through loading status messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setTimeout(() => setStatusIdx(0), 0);
      interval = setInterval(() => {
        setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  return (
    <div id="ai-report-card" className="bg-[#0F1117] border border-slate-800 shadow-sm rounded-xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-400" />
            AI-Powered Biological Interpretation
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            A grounded, evidence-constrained analysis of transcriptional changes and cellular pathways.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {!hasData ? (
        <div className="text-center py-10 bg-slate-900/30 rounded-lg border border-slate-800">
          <p className="text-xs text-slate-500">Please upload a valid DESeq2 dataset to begin biological analysis.</p>
        </div>
      ) : loading ? (
        /* Loading Screen */
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="relative mb-6">
            <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.p
              key={statusIdx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-semibold text-slate-300 text-center font-mono h-4"
            >
              {STATUS_MESSAGES[statusIdx]}
            </motion.p>
          </AnimatePresence>
          <p className="text-[10px] text-slate-500 mt-4 text-center max-w-sm">
            Storyteller restricts the AI&apos;s knowledge to real, retrieved GO terms and pathways. This prevents biological hallucinations.
          </p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="p-5 bg-rose-950/20 border border-rose-900/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-rose-200">Report Generation Failed</h3>
              <p className="text-xs text-rose-300/80 mt-1">{error}</p>
              <button
                onClick={onGenerateReport}
                className="mt-4 px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Retry Report Generation
              </button>
            </div>
          </div>
        </div>
      ) : report ? (
        /* Report Rendered State */
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-900/30 rounded-lg px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xxs font-bold text-emerald-400 uppercase tracking-wider">
                Grounded Biological Narrative Compiled Successfully
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-500 hidden sm:inline">
              Model: gemini-3.5-flash
            </span>
          </div>

          {/* Academic Report Container */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 sm:p-7 shadow-xs max-h-[600px] overflow-y-auto font-sans leading-relaxed text-slate-300">
            <div className="border-b border-slate-800 pb-5 mb-6 text-center">
              <h1 className="text-lg sm:text-xl font-bold text-white font-sans tracking-tight">
                TRANSCRIPTOMIC INTERPRETATION REPORT
              </h1>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold font-mono mt-1">
                RNA-Seq Differential Expression Analysis Draft
              </p>
              <p className="text-xxs text-slate-500 mt-3 font-mono">
                System Time: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} | Stateless Session
              </p>
            </div>

            {/* Markdown Paper Body */}
            <div className="prose prose-invert prose-xs max-w-none text-slate-300 prose-headings:text-white prose-headings:font-bold prose-headings:font-sans prose-headings:tracking-tight prose-a:text-indigo-400 prose-strong:text-white prose-code:text-rose-400 font-sans">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : (
        /* Call to Action State */
        <div className="text-center py-12 px-4 bg-slate-900/30 rounded-xl border border-slate-800">
          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-white">Compile Biological Narrative</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            Ready to interpret these findings? Storyteller will structure your top significant targets, GO processes, and pathway annotations into a coherent, scientifically constrained narrative.
          </p>
          <button
            onClick={onGenerateReport}
            className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm mx-auto cursor-pointer hover:shadow-md"
          >
            <Cpu className="w-4 h-4" />
            Generate Biological Report
          </button>
        </div>
      )}
    </div>
  );
}
