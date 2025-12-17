import { jsPDF } from "jspdf";
import { FileNode, Vulnerability } from "../types";

export const generatePDFReport = (files: FileNode[], projectName: string, projectSummary: boolean = false, userName?: string) => {
  try {
    if (!files || files.length === 0) {
      alert("No files provided for report generation.");
      return;
    }

    console.log("Generating PDF report for", files.length, "files");
    console.log("Files with vulnerabilities:", files.filter(f => f.vulnerabilities && f.vulnerabilities.length > 0).length);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // --- Title Page ---
    doc.setFillColor(15, 23, 42); // Dark Blue Header
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("WiqayaX Security Audit", 15, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text("AI-Powered Static Application Security Testing (SAST)", 15, 30);
    
    // Metadata Section in Header
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Project: ${projectName}`, pageWidth - 15, 20, { align: 'right' });
    doc.text(`Date: ${dateStr}`, pageWidth - 15, 26, { align: 'right' });
    doc.text(`Time: ${timeStr}`, pageWidth - 15, 32, { align: 'right' });

    yPos = 65;

    // --- Executive Summary Box ---
    doc.setDrawColor(200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, yPos, pageWidth - 30, 80, 3, 3, 'FD');
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", 20, yPos + 10);

    // Statistics Calculation
    const totalFiles = files.length;
    const totalVulns = files.reduce((acc, f) => acc + (f.vulnerabilities?.length || 0), 0);
    const critical = files.reduce((acc, f) => acc + (f.vulnerabilities?.filter(v => v.severity === 'CRITICAL').length || 0), 0);
    const high = files.reduce((acc, f) => acc + (f.vulnerabilities?.filter(v => v.severity === 'HIGH').length || 0), 0);
    const medium = files.reduce((acc, f) => acc + (f.vulnerabilities?.filter(v => v.severity === 'MEDIUM').length || 0), 0);
    const low = files.reduce((acc, f) => acc + (f.vulnerabilities?.filter(v => v.severity === 'LOW').length || 0), 0);
    
    // Scoring Logic
    // Risk %: Average Risk Score across files
    const avgRiskScore = totalFiles > 0 
      ? Math.round(files.reduce((acc, f) => acc + (f.riskScore || 0), 0) / totalFiles) 
      : 0;
      
    // QC Score: 100 - Risk Score (Health)
    const qcScore = Math.max(0, 100 - avgRiskScore);
    
    // Vulnerability %: Ratio of found issues to 'clean' state (conceptual)
    // Or just percentage of files affected
    const affectedFiles = files.filter(f => f.vulnerabilities && f.vulnerabilities.length > 0).length;
    const vulnPercentage = totalFiles > 0 ? Math.round((affectedFiles / totalFiles) * 100) : 0;

    yPos += 25;
    
    // Score Cards (Simulated with text/rects)
    const drawScoreCard = (label: string, value: string, color: [number, number, number], x: number) => {
        doc.setFillColor(...color);
        doc.rect(x, yPos, 40, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(value, x + 20, yPos + 12, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(label, x + 20, yPos + 20, { align: 'center' });
    };

    drawScoreCard("QC SCORE", `${qcScore}/100`, [22, 163, 74], 25); // Green
    drawScoreCard("RISK LEVEL", `${avgRiskScore}%`, [220, 38, 38], 75); // Red
    drawScoreCard("VULN FILES", `${vulnPercentage}%`, [234, 88, 12], 125); // Orange

    yPos += 40;
    
    doc.setTextColor(50);
    doc.setFontSize(10);
    doc.text(`Total Issues: ${totalVulns}`, 20, yPos);
    doc.text(`Critical: ${critical}`, 60, yPos);
    doc.text(`High: ${high}`, 90, yPos);
    doc.text(`Medium: ${medium}`, 115, yPos);
    doc.text(`Low: ${low}`, 145, yPos);
    
    yPos = 160;

    // --- Detailed File Analysis ---
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Detailed Code Analysis", 15, yPos);
    yPos += 10;
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;

    files.forEach(file => {
      // Only show file if it has issues or if it's a single file report
      if (projectSummary && (!file.vulnerabilities || file.vulnerabilities.length === 0)) return;
      
      // Page Break Check
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.rect(15, yPos - 6, pageWidth - 30, 10, 'F');
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30);
      doc.text(`File: ${file.name}`, 20, yPos);
      
      // File Score Tag
      doc.setFontSize(9);
      const fRisk = file.riskScore || 0;
      if (fRisk > 50) doc.setTextColor(220, 38, 38);
      else if (fRisk > 20) doc.setTextColor(234, 88, 12);
      else doc.setTextColor(22, 163, 74);
      doc.text(`Risk Score: ${fRisk}%`, pageWidth - 45, yPos);
      
      yPos += 15;

      if (!file.vulnerabilities || file.vulnerabilities.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("No vulnerabilities detected. Code meets QC standards.", 20, yPos);
        yPos += 10;
      } else {
        file.vulnerabilities.forEach(vuln => {
           if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          
          // Severity Color
          if(vuln.severity === 'CRITICAL') doc.setTextColor(220, 38, 38);
          else if(vuln.severity === 'HIGH') doc.setTextColor(234, 88, 12);
          else if(vuln.severity === 'MEDIUM') doc.setTextColor(202, 138, 4);
          else doc.setTextColor(59, 130, 246);

          doc.text(`[${vuln.severity}] ${vuln.name}`, 20, yPos);
          doc.setTextColor(0);
          
          yPos += 5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(80);
          doc.text(`Line ${vuln.lineNumber} | Rule: ${vuln.ruleId || 'N/A'}`, 20, yPos);
          
          yPos += 5;
          const splitDesc = doc.splitTextToSize(vuln.description, pageWidth - 40);
          doc.text(splitDesc, 20, yPos);
          yPos += (splitDesc.length * 4) + 2;

          // Remediation Box
          if (vuln.fixSuggestion) {
            doc.setFillColor(240, 253, 244);
            const fixSuggestionText = vuln.fixSuggestion || "No fix suggestion provided";
            const fixHeight = Math.max(20, (fixSuggestionText.length / 2) + 10);
            doc.rect(20, yPos, pageWidth - 40, fixHeight, 'F'); // Approx height
            
            doc.setTextColor(21, 128, 61); // Green Text
            doc.setFont("helvetica", "bold");
            doc.text("Fix Recommendation:", 22, yPos + 4);
            
            doc.setFont("helvetica", "normal");
            doc.setTextColor(30);
            const splitFix = doc.splitTextToSize(fixSuggestionText, pageWidth - 45);
            doc.text(splitFix, 22, yPos + 9);
            yPos += (splitFix.length * 4) + 15;
          } else {
            yPos += 5;
          }
        });
      }
      
      yPos += 5;
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      const footerText = userName 
        ? `Generated by ${userName} using WiqayaX, a Scalovate Initiative`
        : "Generated by WiqayaX, a Scalovate Initiative";
      doc.text(footerText, 15, pageHeight - 10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
    }

    const fileName = projectSummary ? "WiqayaX_Project_Audit.pdf" : `WiqayaX_${files[0]?.name.replace(/\./g, '_')}_Audit.pdf`;
    
    doc.save(fileName);
    console.log("PDF report generated successfully:", fileName);
  } catch (error) {
    console.error("Error generating PDF report:", error);
    alert("Failed to generate PDF report: " + (error as Error).message);
    throw error;
  }
};