"use client";

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Upload, FileText, AlertCircle, Play, ArrowRight, Activity, Cpu, BarChart2, BookOpen } from "lucide-react";
import { parseDESeq2CSV, DESeq2Row } from "../../services/csvParser";

interface UploadProps {
  onUploadSuccess: (data: DESeq2Row[], filename: string) => void;
  onUseSample: () => void;
}

export default function UploadComponent({ onUploadSuccess, onUseSample }: UploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Unsupported file format. Please upload a DESeq2 results file in CSV format (.csv).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = parseDESeq2CSV(content);
      
      if (result.success && result.data.length > 0) {
        setError(null);
        onUploadSuccess(result.data, file.name);
      } else {
        setError(result.error || "Failed to parse the CSV file. Please make sure it is a valid DESeq2 results file.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const downloadSampleCSV = () => {
    const sampleCSVContent = `Gene,log2FoldChange,padj
TP53,-1.82,0.00034
BRCA1,1.54,0.0012
APOE,-2.11,0.000045
TNF,2.89,0.0000012
VEGFA,3.12,0.00000089
IL6,2.45,0.000054
GAPDH,0.05,0.92
AKT1,1.21,0.015
EGFR,-1.32,0.024
MYC,1.88,0.00087
PTEN,-1.45,0.0098
MTOR,0.95,0.12
CASP3,1.67,0.0034
IL1B,2.95,0.0000078
CCL2,2.33,0.00012
CXCL8,2.71,0.000067
CD8A,1.82,0.0041
CD4,-0.45,0.32
ACTB,-0.02,0.98
MDM2,1.35,0.012
BBA1,0.12,0.85
ESR1,-1.62,0.018
AR,-1.15,0.041
KRT5,-2.85,0.000095
GATA3,-1.95,0.00062
FOXA1,-1.78,0.0011
STAT3,1.12,0.045
NFKB1,1.48,0.0089
MAPK1,0.22,0.65
JUN,1.91,0.00045
FOS,2.15,0.00018
SIRT1,-1.25,0.038
SOD1,-0.15,0.72
CAT,-0.85,0.15
LDHA,1.42,0.011
PKM,1.55,0.0084
ALDOA,1.12,0.048
PGK1,0.98,0.11
ENO1,1.24,0.032
TPI1,0.76,0.21
`;
    const blob = new Blob([sampleCSVContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deseq2_sample_results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="upload-container" className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-3 py-1 bg-indigo-950/40 text-indigo-400 text-xs font-semibold uppercase tracking-wider rounded-full inline-block mb-3 border border-indigo-900/30">
            Bioinformatics Tool
          </span>
          <h1 className="text-4xl sm:text-5xl font-sans font-bold text-white tracking-tight mb-4">
            RNA-Seq <span className="text-indigo-400">Storyteller</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Translate raw differential expression files into grounded biological narratives. Upload a DESeq2 CSV to visualise, annotate, and interpret your transcriptome data in one seamless workflow.
          </p>
        </motion.div>
      </div>

      {/* Workflow Diagram */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="bg-[#0F1117] border border-slate-800 rounded-xl p-4 mb-6"
      >
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">
          The Storyteller Pipeline
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div className="flex flex-col items-center text-center p-2">
            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-indigo-400 mb-2 border border-slate-800">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">1. Upload Results</span>
            <span className="text-[10px] text-slate-500 mt-1">Accepts standard DESeq2 CSV files</span>
          </div>

          <div className="hidden sm:flex justify-center text-slate-700">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex flex-col items-center text-center p-2">
            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-indigo-400 mb-2 border border-slate-800">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">2. Filter & Plot</span>
            <span className="text-[10px] text-slate-500 mt-1">Adjust thresholds & volcano plot</span>
          </div>

          <div className="hidden sm:flex justify-center text-slate-700">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex flex-col items-center text-center p-2">
            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-indigo-400 mb-2 border border-slate-800">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">3. Retrieve Annotations</span>
            <span className="text-[10px] text-slate-500 mt-1">Real-time MyGene.info lookups</span>
          </div>

          <div className="hidden sm:flex justify-center text-slate-700">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex flex-col items-center text-center p-2">
            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-indigo-400 mb-2 border border-slate-800">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200">4. Grounded Analysis</span>
            <span className="text-[10px] text-slate-500 mt-1">Gemini-powered evidence interpretation</span>
          </div>
        </div>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-[#0F1117] border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-colors relative"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        style={{
          backgroundColor: dragActive ? "rgba(99, 102, 241, 0.04)" : "",
          borderColor: dragActive ? "#6366f1" : "",
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv"
          onChange={handleChange}
        />

        <div className="flex flex-col items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-slate-900 text-slate-400 flex items-center justify-center mb-3 border border-slate-800 shadow-sm">
            <Upload className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-slate-200 mb-1">
            Drag & drop your DESeq2 CSV file here
          </p>
          <p className="text-xs text-slate-400 mb-4">
            or click to browse your local directory
          </p>
          <div className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition-colors inline-block">
            Choose CSV File
          </div>
          <p className="text-[11px] text-slate-500 mt-4">
            Accepts standard columns: <strong className="text-slate-400">Gene</strong>, <strong className="text-slate-400">log2FoldChange</strong>, <strong className="text-slate-400">padj</strong>
          </p>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-rose-950/20 border border-rose-900/30 rounded-lg flex items-start gap-3 text-rose-200"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-rose-200">Upload Error</p>
            <p className="text-xs text-rose-300/80 mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Sample dataset CTAs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-800"
      >
        <div className="text-left">
          <p className="text-xs font-bold text-slate-200">No dataset ready?</p>
          <p className="text-[11px] text-slate-400">Explore the full workflow using our pre-formatted sample results.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadSampleCSV}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Download Sample CSV
          </button>
          <button
            onClick={onUseSample}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Use Sample Dataset
          </button>
        </div>
      </motion.div>

      {/* Scientific Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-12 bg-[#0F1117] border border-slate-800 rounded-lg p-4 text-center"
      >
        <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 flex items-center justify-center gap-1.5 mb-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          Academic & Scientific Disclaimer
        </p>
        <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl mx-auto">
          RNA-Seq Storyteller is designed for research support and educational purposes only. It is not approved for diagnostic use, clinical analysis, or medical decision-making. All AI-generated biological hypotheses must be validated through experimental methodologies.
        </p>
      </motion.div>
    </div>
  );
}
