"use client";

import React, { useState } from "react";
import { GeneAnnotation } from "../../services/annotation";
import { BookOpen, HelpCircle, Activity, Globe, Info, Compass } from "lucide-react";

interface AnnotationPanelProps {
  annotations: Record<string, GeneAnnotation>;
  loading: boolean;
  topGenes: string[];
}

export default function AnnotationPanelComponent({
  annotations,
  loading,
  topGenes,
}: AnnotationPanelProps) {
  const [selectedGene, setSelectedGene] = useState<string>(topGenes[0] || "");

  // If selected gene is no longer in top genes, reset selection
  React.useEffect(() => {
    if (topGenes.length > 0 && !topGenes.includes(selectedGene)) {
      setTimeout(() => {
        setSelectedGene(topGenes[0]);
      }, 0);
    }
  }, [topGenes, selectedGene]);

  const activeAnnotation = selectedGene ? annotations[selectedGene] : null;

  return (
    <div id="annotation-panel-card" className="bg-[#0F1117] border border-slate-800 shadow-sm rounded-xl p-4 sm:p-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Biological Annotations (MyGene.info)
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Functional evidence, cellular pathways, and Gene Ontology terms for top transcription targets.
          </p>
        </div>
      </div>

      {topGenes.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/30 rounded-lg border border-slate-800">
          <p className="text-xs text-slate-500">No significant genes selected to annotate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Gene Selector Rail (4 columns) */}
          <div className="md:col-span-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:max-h-[380px] md:overflow-y-auto pb-2 md:pb-0 pr-0 md:pr-2">
            {topGenes.map((gene) => {
              const ann = annotations[gene];
              const isSelected = selectedGene === gene;
              return (
                <button
                  key={gene}
                  onClick={() => setSelectedGene(gene)}
                  className={`flex-shrink-0 text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <span className="font-bold">{gene}</span>
                  <span
                    className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-indigo-700 text-indigo-100" : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {ann && ann.name !== "Unknown Gene" ? "Annotated" : "Pending"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Annotation Details Panel (8 columns) */}
          <div className="md:col-span-8 bg-slate-900/30 border border-slate-800 rounded-lg p-4 sm:p-5 min-h-[350px] flex flex-col justify-between">
            {loading ? (
              /* Skeleton Loader */
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-slate-800 rounded w-1/3"></div>
                <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                <div className="space-y-2 pt-4">
                  <div className="h-4 bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="h-16 bg-slate-800 rounded"></div>
                  <div className="h-16 bg-slate-800 rounded"></div>
                </div>
              </div>
            ) : activeAnnotation ? (
              <div className="space-y-4">
                {/* Gene Info Header */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{activeAnnotation.gene}</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-950/40 text-indigo-400 font-semibold rounded border border-indigo-900/30">
                      Official Symbol
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{activeAnnotation.name}</p>
                </div>

                {/* Database Summary Description */}
                <div className="bg-[#0A0C10] border border-slate-800 rounded-lg p-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    NCBI Entrez / UniProt Summary
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeAnnotation.summary}</p>
                </div>

                {/* GO Terms and Pathways Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GO Terms */}
                  <div className="bg-[#0A0C10] border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        Biological Process (GO)
                      </h4>
                      {activeAnnotation.goBP.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic">No Gene Ontology biological processes documented.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {activeAnnotation.goBP.map((term, index) => (
                            <li key={index} className="text-[10px] text-slate-300 flex items-start gap-1">
                              <span className="text-indigo-400 font-bold leading-none select-none">•</span>
                              <span className="leading-tight">{term}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Pathways */}
                  <div className="bg-[#0A0C10] border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                        <Compass className="w-3.5 h-3.5 text-indigo-400" />
                        Mapped Pathways
                      </h4>
                      {activeAnnotation.pathways.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic">No KEGG/Reactome pathways mapped.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {activeAnnotation.pathways.map((pathway, index) => (
                            <li key={index} className="text-[10px] text-slate-300 flex items-start gap-1">
                              <span className="text-indigo-400 font-bold leading-none select-none">•</span>
                              <span className="leading-tight">{pathway}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Disease Associations */}
                {activeAnnotation.diseases.length > 0 && (
                  <div className="bg-[#0A0C10] border border-slate-800 rounded-lg p-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      Disease Co-occurrences (GeneRIF scan)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeAnnotation.diseases.map((dis, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 font-semibold text-[10px] rounded border border-slate-700"
                        >
                          {dis}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center">
                <HelpCircle className="w-8 h-8 mb-2 text-slate-600" />
                <p className="text-xs font-semibold">Select a gene from the rail to view official database annotations.</p>
              </div>
            )}

            {/* API citation */}
            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-1">
              <span>Annotation source: Bio-REST API (https://mygene.info) for human/mouse targets.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
