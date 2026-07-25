"use client";

import React, { useState } from "react";
import { Download, FileDown, Printer, FileText, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

interface ReportDownloadProps {
  reportText: string | null;
  filename: string;
}

export default function ReportDownloadComponent({ reportText, filename }: ReportDownloadProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!reportText) return null;

  const downloadMarkdown = () => {
    const header = `---
title: "Transcriptomic Interpretation Report"
author: "RNA-Seq Storyteller (Grounded AI Engine)"
date: "${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}"
source_file: "${filename}"
---

`;
    const fullMarkdown = header + reportText;
    const blob = new Blob([fullMarkdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `storyteller_interpretation_${filename.replace(/\.[^/.]+$/, "")}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 54; // 0.75 in (54 pt)
      const usableWidth = pageWidth - margin * 2;
      let y = margin;

      // Helper to add a page and draw the running header
      const drawHeaderOnPage = () => {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text("RNA-Seq Storyteller | Biological Interpretation Report", margin, margin - 15);
        doc.setDrawColor(241, 245, 249); // slate-100
        doc.setLineWidth(0.5);
        doc.line(margin, margin - 10, pageWidth - margin, margin - 10);
      };

      const addNewPage = () => {
        doc.addPage();
        y = margin;
        drawHeaderOnPage();
      };

      // --- FIRST PAGE COVER/TITLE HEADER ---
      // Colored left accent bar
      doc.setFillColor(79, 70, 229); // Indigo-600
      doc.rect(margin, y, 6, 40, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("Transcriptomic Interpretation Report", margin + 15, y + 16);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`RNA-Seq Storyteller • Grounded AI Research Draft`, margin + 15, y + 32);

      y += 55;

      // Meta Info Card
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.rect(margin, y, usableWidth, 45, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("Source Dataset:", margin + 15, y + 18);
      doc.text("Generated On:", margin + 15, y + 32);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(filename, margin + 110, y + 18);
      doc.text(
        new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) +
          ` at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
        margin + 110,
        y + 32
      );

      y += 70;

      // Process and render Markdown paragraphs
      const paragraphs = reportText.split(/\n\s*\n/);

      paragraphs.forEach((p) => {
        const cleanParagraph = p.trim();
        if (!cleanParagraph) return;

        // Check for Markdown Headings
        if (cleanParagraph.startsWith("#")) {
          const match = cleanParagraph.match(/^(#{1,6})\s*(.*)/);
          if (match) {
            const level = match[1].length;
            const text = match[2].trim();

            let fontSize = 11;
            let fontStyle = "bold";
            let textColor = [15, 23, 42]; // slate-900
            let spaceBefore = 15;
            let spaceAfter = 6;

            if (level === 1) {
              fontSize = 14;
              textColor = [30, 27, 75]; // indigo-950
              spaceBefore = 20;
              spaceAfter = 10;
            } else if (level === 2) {
              fontSize = 12;
              textColor = [67, 56, 202]; // indigo-700
              spaceBefore = 16;
              spaceAfter = 8;
            } else if (level === 3) {
              fontSize = 11;
              textColor = [79, 70, 229]; // indigo-600
              spaceBefore = 12;
              spaceAfter = 6;
            }

            // Page overflow check before heading
            if (y + spaceBefore + fontSize + spaceAfter > pageHeight - margin) {
              addNewPage();
            } else {
              y += spaceBefore;
            }

            doc.setFont("Helvetica", fontStyle);
            doc.setFontSize(fontSize);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(text, margin, y);
            y += fontSize + spaceAfter;
            return;
          }
        }

        // Check if paragraph is a list of items
        const lines = cleanParagraph.split("\n");
        const isList = lines.every((line) => /^\s*[-*•\d+.]\s+/.test(line));

        if (isList) {
          lines.forEach((line) => {
            const cleanLine = line.trim();
            const itemMatch = cleanLine.match(/^([-*•]|\d+[.)])\s+(.*)/);
            if (itemMatch) {
              const prefix = itemMatch[1];
              const itemText = itemMatch[2];

              // Render custom Indigo Bullet
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(10);
              doc.setTextColor(79, 70, 229); // indigo-600

              const bulletChar = ["-", "*", "•"].includes(prefix) ? "•" : prefix;

              // Clean text and split it to wrap properly
              const sanitizedText = itemText.replace(/\*\*(.*?)\*\*/g, "$1");
              const wrappedItemLines = doc.splitTextToSize(sanitizedText, usableWidth - 20);
              const heightNeeded = wrappedItemLines.length * 14 + 4;

              if (y + heightNeeded > pageHeight - margin) {
                addNewPage();
              }

              // Draw bullet character
              doc.text(bulletChar, margin + 5, y + 10);

              // Draw text block next to bullet
              doc.setFont("Helvetica", "normal");
              doc.setTextColor(30, 41, 59); // slate-800

              wrappedItemLines.forEach((itemLine: string) => {
                doc.text(itemLine, margin + 20, y + 10);
                y += 14;
              });
              y += 4; // spacing between list items
            } else {
              // Fallback
              const wrappedLines = doc.splitTextToSize(cleanLine, usableWidth);
              const heightNeeded = wrappedLines.length * 14;
              if (y + heightNeeded > pageHeight - margin) {
                addNewPage();
              }
              doc.setFont("Helvetica", "normal");
              doc.setTextColor(30, 41, 59);
              wrappedLines.forEach((wl: string) => {
                doc.text(wl, margin, y + 10);
                y += 14;
              });
            }
          });
          y += 6; // Spacing after list block
          return;
        }

        // Standard Paragraph
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59); // slate-800

        // Strip inline markdown bold indicators for clear print rendering
        const sanitizedText = cleanParagraph.replace(/\*\*(.*?)\*\*/g, "$1");
        const wrappedLines = doc.splitTextToSize(sanitizedText, usableWidth);
        const heightNeeded = wrappedLines.length * 14 + 10;

        if (y + heightNeeded > pageHeight - margin) {
          addNewPage();
        }

        wrappedLines.forEach((line: string) => {
          doc.text(line, margin, y + 10);
          y += 14;
        });

        y += 10; // margin between paragraphs
      });

      // Second Pass: Add page numbers at the bottom of all generated pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 50, pageHeight - 30);
      }

      const pdfFilename = `storyteller_report_${filename.replace(/\.[^/.]+$/, "")}.pdf`;
      doc.save(pdfFilename);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div id="report-download-container" className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 bg-[#0F1117] border border-slate-800 rounded-xl shadow-xs">
      <div className="text-left">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
          <FileDown className="w-4 h-4 text-indigo-400" />
          Export Research Report
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Save this grounded bioinformatic draft. Download as a formatted PDF, structured Markdown, or print directly.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
        <button
          onClick={downloadMarkdown}
          className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 font-semibold text-xs rounded-lg shadow-xxs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Markdown (.md)
        </button>
        <button
          onClick={downloadPDF}
          disabled={isGeneratingPdf}
          className="flex-1 sm:flex-initial px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-800 disabled:text-indigo-300 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5" />
              Save PDF (.pdf)
            </>
          )}
        </button>
        <button
          onClick={triggerPrint}
          className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      </div>
    </div>
  );
}
