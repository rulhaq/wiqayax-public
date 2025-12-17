import { GoogleGenAI, Type } from "@google/genai";
import { Vulnerability } from "../types";

// Schema definition for the structured output
const vulnerabilitySchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      ruleId: { type: Type.STRING, description: "CVE ID, CWE ID, or QA Rule (e.g., CVE-2021-44228, CWE-79, QA-PERF)" },
      name: { type: Type.STRING, description: "Short title of the vulnerability or issue" },
      description: { type: Type.STRING, description: "Detailed explanation of the security flaw, bug, or quality issue" },
      severity: { 
        type: Type.STRING, 
        enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"],
        description: "Severity level based on impact"
      },
      lineNumber: { type: Type.INTEGER, description: "Line number where the issue occurs" },
      mitreTechnique: { type: Type.STRING, description: "MITRE ATT&CK Technique ID if applicable" },
      fixSuggestion: { type: Type.STRING, description: "Explanation of how to fix the issue or refactor the code" },
      fixedCode: { type: Type.STRING, description: "The corrected or optimized code snippet" }
    },
    required: ["ruleId", "name", "description", "severity", "lineNumber", "fixSuggestion"]
  }
};

export const analyzeCodeWithGemini = async (
  code: string, 
  fileName: string,
  userApiKey?: string,
  model?: string
): Promise<Vulnerability[]> => {
  // 1. Determine API Key (User provided > Environment Variable)
  const apiKey = userApiKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("Missing API Key. Please configure it in Settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // 2. Safety Truncation: Prevent token limit errors for massive files
  // Approx 30k chars is roughly 7-8k tokens, safe for Gemini Flash window
  const MAX_CHARS = 30000;
  const processedCode = code.length > MAX_CHARS 
    ? code.substring(0, MAX_CHARS) + "\n\n... [Code Truncated for Analysis] ..."
    : code;

  const prompt = `
    You are Wiqaya, an advanced AI Code Auditor and Security Engine with access to CVE databases, CWE classifications, and threat intelligence.
    
    Analyze the following source code file named "${fileName}" with COMPREHENSIVE security auditing.
    
    CRITICAL: You MUST check against:
    1. CVE Database (Common Vulnerabilities and Exposures) - Reference specific CVE IDs when vulnerabilities match known CVEs
    2. CWE Database (Common Weakness Enumeration) - Classify weaknesses using CWE IDs
    3. OWASP Top 10 (2021 & 2023) - Check against all OWASP categories
    4. MITRE ATT&CK Framework - Map attack techniques (T-codes)
    5. NIST Cybersecurity Framework - Reference NIST SP 800-53 controls
    6. SANS Top 25 Most Dangerous Software Weaknesses
    
    Perform a DEEP analysis identifying:
    
    SECURITY VULNERABILITIES:
    - SQL Injection (CWE-89, OWASP-A03)
    - Cross-Site Scripting/XSS (CWE-79, OWASP-A03)
    - Command Injection (CWE-78)
    - Path Traversal (CWE-22)
    - Insecure Deserialization (CWE-502, OWASP-A08)
    - Broken Authentication (CWE-287, OWASP-A07)
    - Sensitive Data Exposure (CWE-312, OWASP-A02)
    - XML External Entities/XXE (CWE-611, OWASP-A05)
    - Broken Access Control (CWE-284, OWASP-A01)
    - Security Misconfiguration (CWE-16, OWASP-A05)
    - Using Components with Known Vulnerabilities (CWE-1104, OWASP-A06)
    - Insufficient Logging & Monitoring (CWE-778, OWASP-A09)
    - Server-Side Request Forgery/SSRF (CWE-918, OWASP-A10)
    - Hardcoded Secrets/Passwords (CWE-798)
    - Weak Cryptography (CWE-327)
    - Race Conditions (CWE-362)
    - Buffer Overflows (CWE-120)
    - Integer Overflows (CWE-190)
    - Use After Free (CWE-416)
    - Double Free (CWE-415)
    
    QUALITY ASSURANCE (QA):
    - Logic Bugs & Runtime Errors (null pointers, infinite loops, division by zero)
    - Edge Cases & Boundary Conditions
    - Input Validation Issues
    - Error Handling Problems
    
    QUALITY CONTROL (QC):
    - Performance Bottlenecks (O(n²) loops, memory leaks, inefficient algorithms)
    - Code Smells & Bad Practices
    - Maintainability Issues
    - Code Duplication
    
    For EACH vulnerability found, you MUST provide:
    - ruleId: Specific CVE-ID (e.g., CVE-2021-44228) or CWE-ID (e.g., CWE-79) or OWASP reference
    - name: Clear vulnerability name
    - description: Detailed explanation referencing the threat vector, attack scenario, and potential impact
    - severity: CRITICAL, HIGH, MEDIUM, LOW, or INFO (based on CVSS if applicable)
    - lineNumber: Exact line where vulnerability exists
    - mitreTechnique: MITRE ATT&CK technique ID (e.g., T1059, T1190) if applicable
    - fixSuggestion: Detailed remediation steps
    - fixedCode: Corrected code snippet showing the fix
    
    Be THOROUGH and find ALL security issues. Reference actual CVE numbers when vulnerabilities match known CVEs.
    If the code uses libraries/frameworks, check for known vulnerabilities in those dependencies.
    
    Code to analyze:
    \`\`\`
    ${processedCode}
    \`\`\`
  `;

  try {
    // Try the newer API first
    let textResponse: string;
    
    try {
      const genModel = ai.getGenerativeModel({ 
        model: model || "gemini-2.0-flash-exp",
        systemInstruction: "You are Wiqaya, an expert security auditor with access to CVE databases, CWE classifications, OWASP Top 10, and MITRE ATT&CK framework. You MUST check code against known CVEs, CWEs, and threat vectors. Be extremely thorough - find ALL security vulnerabilities, bugs, and quality issues. Reference specific CVE/CWE IDs when applicable. If no issues are found after comprehensive analysis, return an empty array."
      });

      const result = await genModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: vulnerabilitySchema
        }
      });

      textResponse = result.response.text();
    } catch (apiError: any) {
      // Fallback to older API if new one fails
      console.warn("Trying fallback API method:", apiError.message);
      const response = await ai.models.generateContent({
        model: model || "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: vulnerabilitySchema,
          systemInstruction: "You are Wiqaya, an expert security auditor with access to CVE databases, CWE classifications, OWASP Top 10, and MITRE ATT&CK framework. You MUST check code against known CVEs, CWEs, and threat vectors. Be extremely thorough - find ALL security vulnerabilities, bugs, and quality issues. Reference specific CVE/CWE IDs when applicable. If no issues are found after comprehensive analysis, return an empty array."
        }
      });
      textResponse = response.text || "";
    }
    
    if (!textResponse) {
      console.warn("Gemini returned empty response");
      return [];
    }

    // 3. Robust JSON Parsing: Strip Markdown code fences if the model includes them
    textResponse = textResponse.trim();
    if (textResponse.startsWith("```")) {
      textResponse = textResponse.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
    }

    const rawData = JSON.parse(textResponse);
    
    // 4. Data Validation: Ensure we return a valid array
    if (!Array.isArray(rawData)) {
      console.warn("Gemini returned non-array structure:", rawData);
      return [];
    }
    
    // Map to ensure IDs and types are correct
    return rawData.map((v: any, index: number) => ({
      ...v,
      id: `${fileName}-${index}-${Date.now()}`, // Unique ID for React keys
      fileName: fileName
    }));

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    // Re-throw configuration errors
    if (error instanceof Error && (error.message.includes("API Key") || error.message.includes("API_KEY") || error.message.includes("API key"))) {
      throw error;
    }
    // Re-throw other errors with more context
    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("Unknown error occurred during Gemini analysis");
  }
};