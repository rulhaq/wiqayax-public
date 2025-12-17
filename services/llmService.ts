import { analyzeCodeWithGemini } from './geminiService';
import { Vulnerability } from '../types';

const SYSTEM_PROMPT = `
You are WiqayaX, an advanced AI Code Auditor with access to CVE databases, CWE classifications, and threat intelligence.

CRITICAL: You MUST check code against:
- CVE Database (Common Vulnerabilities and Exposures) - Reference specific CVE IDs
- CWE Database (Common Weakness Enumeration) - Use CWE IDs for classification
- OWASP Top 10 (2021 & 2023) - Check all OWASP categories
- MITRE ATT&CK Framework - Map attack techniques (T-codes)
- NIST Cybersecurity Framework (SP 800-53)
- SANS Top 25 Most Dangerous Software Weaknesses

Perform COMPREHENSIVE security analysis identifying:

SECURITY VULNERABILITIES (check against CVE/CWE databases):
- SQL Injection (CWE-89, OWASP-A03), XSS (CWE-79), Command Injection (CWE-78)
- Path Traversal (CWE-22), XXE (CWE-611, OWASP-A05), SSRF (CWE-918, OWASP-A10)
- Insecure Deserialization (CWE-502, OWASP-A08), Broken Auth (CWE-287, OWASP-A07)
- Sensitive Data Exposure (CWE-312, OWASP-A02), Broken Access Control (CWE-284, OWASP-A01)
- Security Misconfiguration (CWE-16, OWASP-A05), Known Vulnerable Components (CWE-1104, OWASP-A06)
- Hardcoded Secrets (CWE-798), Weak Cryptography (CWE-327)
- Buffer Overflows (CWE-120), Race Conditions (CWE-362), Use After Free (CWE-416)

QUALITY ASSURANCE (QA):
- Logic Bugs, Runtime Errors, Edge Cases, Input Validation, Error Handling

QUALITY CONTROL (QC):
- Performance Issues, Code Smells, Maintainability Problems

For EACH issue, provide:
- ruleId: Specific CVE-ID (e.g., CVE-2021-44228) or CWE-ID (e.g., CWE-79) or OWASP reference
- name: Clear vulnerability/issue name
- description: Detailed explanation with threat vector and impact
- severity: CRITICAL|HIGH|MEDIUM|LOW|INFO
- lineNumber: Exact line number
- mitreTechnique: MITRE ATT&CK ID (e.g., T1059) if applicable
- fixSuggestion: Detailed remediation steps
- fixedCode: Corrected code snippet

Be THOROUGH - find ALL security issues. Reference actual CVE numbers when vulnerabilities match known CVEs.
Check dependencies for known vulnerabilities.

Return the result strictly as a valid JSON array of objects.
Do not wrap the result in markdown code blocks (like \`\`\`json). Just return the raw JSON string.

Format:
[
  {
    "ruleId": "CVE-XXXX or CWE-XXX or OWASP-AXX",
    "name": "Short Name",
    "description": "Detailed description referencing threat vector and CVE/CWE",
    "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
    "lineNumber": 10,
    "mitreTechnique": "TXXXX",
    "fixSuggestion": "How to fix",
    "fixedCode": "Code snippet"
  }
]
`;

export const analyzeCode = async (
  provider: string,
  apiKey: string | undefined,
  localEndpoint: string | undefined,
  code: string,
  fileName: string,
  selectedModel?: string
): Promise<Vulnerability[]> => {
  
  // 1. Validation
  if (provider !== 'ollama' && !apiKey) {
    throw new Error(`API Key is required for ${provider}`);
  }

  // 2. Validate and sanitize model selection
  let modelToUse = selectedModel;
  
  // Ensure model matches provider (basic validation)
  if (modelToUse) {
    const geminiModels = ['gemini', 'gemini-pro', 'gemini-2.0'];
    const groqModels = ['llama', 'mixtral', 'qwen'];
    const openaiModels = ['gpt', 'o1'];
    const deepseekModels = ['deepseek'];
    
    const isGeminiModel = geminiModels.some(m => modelToUse.toLowerCase().includes(m));
    const isGroqModel = groqModels.some(m => modelToUse.toLowerCase().includes(m));
    const isOpenAIModel = openaiModels.some(m => modelToUse.toLowerCase().includes(m));
    const isDeepSeekModel = deepseekModels.some(m => modelToUse.toLowerCase().includes(m));
    
    // If model doesn't match provider, reset to undefined (will use default)
    if ((provider === 'gemini' && !isGeminiModel) ||
        (provider === 'groq' && !isGroqModel) ||
        (provider === 'openai' && !isOpenAIModel) ||
        (provider === 'deepseek' && !isDeepSeekModel)) {
      console.warn(`Model ${modelToUse} doesn't match provider ${provider}, using default model`);
      modelToUse = undefined;
    }
  }

  // 3. Dispatch
  try {
    switch (provider) {
      case 'gemini':
        return await analyzeCodeWithGemini(code, fileName, apiKey, modelToUse);
      
      case 'openai':
        return await analyzeWithOpenAI(code, fileName, apiKey!, modelToUse);

      case 'groq':
        return await analyzeWithGroq(code, fileName, apiKey!, modelToUse);

      case 'deepseek':
        return await analyzeWithDeepSeek(code, fileName, apiKey!, modelToUse);

      case 'ollama':
        return await analyzeWithOllama(code, fileName, localEndpoint, modelToUse);

      case 'claude':
        // Placeholder as Claude needs specific SDK or Proxy usually
        throw new Error("Claude integration requires a backend proxy due to CORS. Please use Gemini, OpenAI, DeepSeek or Groq.");

      default:
        throw new Error("Unsupported Provider");
    }
  } catch (error: any) {
    console.error(`${provider} Analysis Error:`, error);
    // Standardize error message
    throw new Error(error.message || "Analysis failed due to an unknown error.");
  }
};

// --- OpenAI Implementation ---
const analyzeWithOpenAI = async (code: string, fileName: string, apiKey: string, model?: string): Promise<Vulnerability[]> => {
  // OpenAI models have context limits. GPT-4o-mini has 128k tokens
  // Safe limit: ~100k tokens for input (~400k chars). Be conservative: ~200k chars
  const MAX_CHARS_OPENAI = 200000;
  const processedCode = code.length > MAX_CHARS_OPENAI 
    ? code.substring(0, MAX_CHARS_OPENAI) + "\n\n... [Code Truncated: File too large for full analysis. Analyzing first " + MAX_CHARS_OPENAI.toLocaleString() + " characters] ..."
    : code;
  
  if (code.length > MAX_CHARS_OPENAI) {
    console.warn(`File ${fileName} is too large (${code.length.toLocaleString()} chars). Truncated to ${MAX_CHARS_OPENAI.toLocaleString()} chars for analysis.`);
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini", // Use selected model or default
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this file: ${fileName}\n\n${processedCode}` }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`OpenAI API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) {
    console.error("OpenAI response missing content:", data);
    throw new Error("OpenAI API returned empty response");
  }
  
  // Parse the JSON object response
  try {
    const parsed = JSON.parse(content);
    // Handle both array and object responses
    const array = Array.isArray(parsed) ? parsed : (parsed.vulnerabilities || parsed.issues || parsed.results || []);
    if (!Array.isArray(array)) {
      console.error("OpenAI returned non-array:", parsed);
      return [];
    }
    return array.map((v: any, idx: number) => ({
      ...v,
      id: `${fileName}-${idx}-${Date.now()}`,
      fileName
    }));
  } catch (e) {
    console.error("OpenAI JSON Parse Error", e, content);
    throw new Error("Failed to parse OpenAI response");
  }
};

// --- Groq Implementation ---
const analyzeWithGroq = async (code: string, fileName: string, apiKey: string, model?: string): Promise<Vulnerability[]> => {
  // Groq models have context limits. For llama-3.1-8b-instant-128k, the context is 128k tokens
  // But we need to account for prompt + response. The API also has message length limits.
  // Approx 1 token = 4 characters, but Groq has stricter limits on message size.
  // For safety, limit to ~100k chars (~25k tokens) to leave room for prompt and response
  const MAX_CHARS_GROQ = 100000;
  const processedCode = code.length > MAX_CHARS_GROQ 
    ? code.substring(0, MAX_CHARS_GROQ) + "\n\n... [Code Truncated: File too large for full analysis. Analyzing first " + MAX_CHARS_GROQ.toLocaleString() + " characters] ..."
    : code;
  
  // Groq doesn't support response_format: json_object, so we need to request JSON in the prompt
  const groqPrompt = `${SYSTEM_PROMPT}\n\nIMPORTANT: You MUST return ONLY valid JSON array. Do not include any markdown, code fences, or explanatory text. Return ONLY the JSON array starting with [ and ending with ].\n\nAnalyze this file: ${fileName}\n\n${processedCode}`;
  
  // Sanitize API key to ensure it's valid for headers
  const sanitizedApiKey = apiKey.trim();
  if (!sanitizedApiKey || sanitizedApiKey.length === 0) {
    throw new Error('Groq API key is required');
  }
  
  // Warn if code was truncated
  if (code.length > MAX_CHARS_GROQ) {
    console.warn(`File ${fileName} is too large (${code.length.toLocaleString()} chars). Truncated to ${MAX_CHARS_GROQ.toLocaleString()} chars for analysis.`);
  }
  
  // Use proxy in development to avoid CORS issues
  const apiUrl = import.meta.env.DEV 
    ? '/api/groq/openai/v1/chat/completions'
    : 'https://api.groq.com/openai/v1/chat/completions';
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sanitizedApiKey}`
    },
    body: JSON.stringify({
      model: model || "llama-3.1-8b-instant", // Use selected model or default
      messages: [
        { role: "system", content: "You are a security auditor. Always return valid JSON arrays only. No markdown, no explanations, just JSON." },
        { role: "user", content: groqPrompt }
      ],
      temperature: 0.3 // Lower temperature for more consistent JSON output
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    const errorMsg = err.error?.message || response.statusText;
    console.error("Groq API Error Details:", err);
    
    // Provide helpful error message for length-related errors
    if (errorMsg.includes('length') || errorMsg.includes('reduce') || errorMsg.includes('too long') || errorMsg.includes('completion') || response.status === 400) {
      const fileSizeMB = (code.length / (1024 * 1024)).toFixed(2);
      throw new Error(`File "${fileName}" is too large (${fileSizeMB} MB, ${code.length.toLocaleString()} chars). Groq API has message length limits. The file has been truncated to ${MAX_CHARS_GROQ.toLocaleString()} chars, but you may want to analyze smaller files or split this file into parts.`);
    }
    
    throw new Error(`Groq API Error: ${errorMsg}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) {
    console.error("Groq response missing content:", data);
    throw new Error("Groq API returned empty response");
  }
  
  // Parse the JSON response - Groq may wrap it in markdown
  try {
    let jsonContent = content.trim();
    
    // Remove markdown code fences if present
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
    }
    
    // Try to extract JSON array if wrapped in other text
    const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }
    
    // Try parsing with error recovery
    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError: any) {
      // If parsing fails, try to fix common issues
      console.warn("Initial JSON parse failed, attempting to fix:", parseError.message);
      
      // Check if it's an unterminated string error
      const isUnterminatedString = parseError.message.includes("Unterminated string");
      
      if (isUnterminatedString) {
        // Try to recover by finding the last complete JSON object
        // Find the position of the error
        const errorPosMatch = parseError.message.match(/position (\d+)/);
        const errorPos = errorPosMatch ? parseInt(errorPosMatch[1]) : jsonContent.length;
        
        // Try to find the last complete object before the error
        // Look backwards from error position to find a complete object
        let lastCompletePos = errorPos;
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        
        // Find the start of the last complete object
        for (let i = errorPos - 1; i >= 0; i--) {
          const char = jsonContent[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '}') {
              braceCount++;
            } else if (char === '{') {
              braceCount--;
              if (braceCount === 0) {
                // Found a complete object, try to extract up to here
                lastCompletePos = i;
                break;
              }
            } else if (char === ']' && braceCount === 0) {
              // Found end of array, try to extract up to here
              lastCompletePos = i + 1;
              break;
            }
          }
        }
        
        // Try to extract valid JSON up to the last complete position
        if (lastCompletePos > 0 && lastCompletePos < jsonContent.length) {
          // Find the last complete array element
          let truncatedContent = jsonContent.substring(0, lastCompletePos);
          
          // Try to close the array properly
          if (truncatedContent.trim().endsWith(',')) {
            truncatedContent = truncatedContent.slice(0, -1);
          }
          
          // Ensure it ends with ]
          if (!truncatedContent.trim().endsWith(']')) {
            truncatedContent += ']';
          }
          
          try {
            parsed = JSON.parse(truncatedContent);
            console.warn("Successfully parsed truncated JSON response");
          } catch (e3: any) {
            // If that fails, try extracting individual objects
            console.warn("Failed to parse truncated JSON, trying to extract individual objects");
            const objects: any[] = [];
            let currentObj = '';
            let objBraceCount = 0;
            let objInString = false;
            let objEscapeNext = false;
            
            for (let i = 0; i < lastCompletePos; i++) {
              const char = jsonContent[i];
              
              if (objEscapeNext) {
                currentObj += char;
                objEscapeNext = false;
                continue;
              }
              
              if (char === '\\') {
                objEscapeNext = true;
                currentObj += char;
                continue;
              }
              
              if (char === '"') {
                objInString = !objInString;
                currentObj += char;
                continue;
              }
              
              if (!objInString) {
                if (char === '{') {
                  if (objBraceCount === 0) {
                    currentObj = '{';
                  } else {
                    currentObj += char;
                  }
                  objBraceCount++;
                } else if (char === '}') {
                  currentObj += char;
                  objBraceCount--;
                  if (objBraceCount === 0) {
                    // Complete object found
                    try {
                      const obj = JSON.parse(currentObj);
                      objects.push(obj);
                    } catch (e4) {
                      // Skip invalid object
                    }
                    currentObj = '';
                  }
                } else if (objBraceCount > 0) {
                  currentObj += char;
                }
              } else {
                if (objBraceCount > 0) {
                  currentObj += char;
                }
              }
            }
            
            if (objects.length > 0) {
              parsed = objects;
              console.warn(`Extracted ${objects.length} valid objects from truncated response`);
            } else {
              throw new Error("Could not extract valid JSON objects from truncated response");
            }
          }
        } else {
          throw new Error("Could not find valid JSON boundary");
        }
      } else {
        // Not an unterminated string error, try the standard fixes
        // Try to extract just the array part more carefully
        const arrayStart = jsonContent.indexOf('[');
        const arrayEnd = jsonContent.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
          jsonContent = jsonContent.substring(arrayStart, arrayEnd + 1);
        }
        
        // Try to fix common JSON issues - unescaped control characters in string values
        // Use a state machine approach to fix unescaped characters only inside strings
        let fixedContent = '';
        inString = false;
        escapeNext = false;
        
        for (let i = 0; i < jsonContent.length; i++) {
          const char = jsonContent[i];
          const prevChar = i > 0 ? jsonContent[i - 1] : '';
          
          if (escapeNext) {
            fixedContent += char;
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            fixedContent += char;
            continue;
          }
          
          if (char === '"' && prevChar !== '\\') {
            inString = !inString;
            fixedContent += char;
            continue;
          }
          
          if (inString) {
            // Inside a string - escape control characters
            if (char === '\n') {
              fixedContent += '\\n';
            } else if (char === '\r') {
              fixedContent += '\\r';
            } else if (char === '\t') {
              fixedContent += '\\t';
            } else if (/[\x00-\x1F\x7F]/.test(char)) {
              // Skip other control characters
              continue;
            } else {
              fixedContent += char;
            }
          } else {
            // Outside string - keep as is
            fixedContent += char;
          }
        }
        
        // Try parsing the fixed content
        try {
          parsed = JSON.parse(fixedContent);
        } catch (e2: any) {
          // Last resort: log error details and throw
          console.error("JSON parse failed after fixes:", e2);
          const errorPos = parseError.message.match(/position (\d+)/)?.[1];
          if (errorPos) {
            const pos = parseInt(errorPos);
            console.error("Error at position:", pos);
            console.error("Content around error:", jsonContent.substring(Math.max(0, pos - 100), Math.min(jsonContent.length, pos + 100)));
          }
          throw new Error(`Failed to parse Groq JSON response. Error: ${parseError.message}. Please try a different model or check your API key.`);
        }
      }
    }
    
    const array = Array.isArray(parsed) ? parsed : (parsed.vulnerabilities || parsed.issues || parsed.results || []);
    if (!Array.isArray(array)) {
      console.error("Groq returned non-array:", parsed);
      return [];
    }
    return array.map((v: any, idx: number) => ({
      ...v,
      id: `${fileName}-${idx}-${Date.now()}`,
      fileName
    }));
  } catch (e: any) {
    console.error("Groq JSON Parse Error", e);
    console.error("Raw content length:", content.length);
    console.error("Raw content preview:", content.substring(0, 500));
    throw new Error(`Failed to parse Groq response as JSON: ${e.message}. The model may not have returned valid JSON.`);
  }
};

// --- DeepSeek Implementation ---
const analyzeWithDeepSeek = async (code: string, fileName: string, apiKey: string, model?: string): Promise<Vulnerability[]> => {
  // DeepSeek models have context limits. DeepSeek Chat has 32k tokens
  // Safe limit: ~25k tokens for input (~100k chars). Be conservative: ~80k chars
  const MAX_CHARS_DEEPSEEK = 80000;
  const processedCode = code.length > MAX_CHARS_DEEPSEEK 
    ? code.substring(0, MAX_CHARS_DEEPSEEK) + "\n\n... [Code Truncated: File too large for full analysis. Analyzing first " + MAX_CHARS_DEEPSEEK.toLocaleString() + " characters] ..."
    : code;
  
  if (code.length > MAX_CHARS_DEEPSEEK) {
    console.warn(`File ${fileName} is too large (${code.length.toLocaleString()} chars). Truncated to ${MAX_CHARS_DEEPSEEK.toLocaleString()} chars for analysis.`);
  }
  
  // DeepSeek may not support json_object format, so request JSON in prompt
  const deepseekPrompt = `${SYSTEM_PROMPT}\n\nIMPORTANT: Return ONLY a valid JSON array. No markdown, no code fences, just the JSON array.\n\nAnalyze this file: ${fileName}\n\n${processedCode}`;
  
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || "deepseek-chat", // Use selected model or default
      messages: [
        { role: "system", content: "You are a security auditor. Always return valid JSON arrays only. No markdown, no explanations, just JSON." },
        { role: "user", content: deepseekPrompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`DeepSeek API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) {
    console.error("DeepSeek response missing content:", data);
    throw new Error("DeepSeek API returned empty response");
  }
  
  // Parse the JSON response
  try {
    let jsonContent = content.trim();
    // Remove markdown code fences if present
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
    }
    // Try to extract JSON array if wrapped in other text
    const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonContent);
    const array = Array.isArray(parsed) ? parsed : (parsed.vulnerabilities || parsed.issues || parsed.results || []);
    if (!Array.isArray(array)) {
      console.error("DeepSeek returned non-array:", parsed);
      return [];
    }
    return array.map((v: any, idx: number) => ({
      ...v,
      id: `${fileName}-${idx}-${Date.now()}`,
      fileName
    }));
  } catch (e) {
    console.error("DeepSeek JSON Parse Error", e);
    console.error("Raw content:", content);
    throw new Error("Failed to parse DeepSeek response as JSON");
  }
};

// --- Ollama Implementation ---
const analyzeWithOllama = async (code: string, fileName: string, endpoint: string = 'http://localhost:11434', model?: string): Promise<Vulnerability[]> => {
  // Ollama models vary, but typically have 4k-32k context. Be conservative: ~50k chars
  const MAX_CHARS_OLLAMA = 50000;
  const processedCode = code.length > MAX_CHARS_OLLAMA 
    ? code.substring(0, MAX_CHARS_OLLAMA) + "\n\n... [Code Truncated: File too large for full analysis. Analyzing first " + MAX_CHARS_OLLAMA.toLocaleString() + " characters] ..."
    : code;
  
  if (code.length > MAX_CHARS_OLLAMA) {
    console.warn(`File ${fileName} is too large (${code.length.toLocaleString()} chars). Truncated to ${MAX_CHARS_OLLAMA.toLocaleString()} chars for analysis.`);
  }
  
  // Normalize endpoint
  const baseUrl = endpoint.replace(/\/$/, '');
  
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || "llama3", // Use selected model or default
        prompt: `${SYSTEM_PROMPT}\n\nCode to analyze (${fileName}):\n${processedCode}`,
        stream: false,
        format: "json"
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama Error: ${response.statusText}. Ensure Ollama is running with CORS enabled.`);
    }

    const data = await response.json();
    return parseResponse(data.response, fileName);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error("Could not connect to Ollama. Check if it's running and CORS is configured.");
    }
    throw error;
  }
};

// --- Helper to parse JSON safely ---
const parseResponse = (jsonString: string, fileName: string): Vulnerability[] => {
  try {
    // Clean potential markdown fences just in case
    const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    // Handle wrapped objects (e.g., { "vulnerabilities": [...] })
    const array = Array.isArray(parsed) ? parsed : (parsed.vulnerabilities || parsed.issues || []);
    
    if (!Array.isArray(array)) return [];

    return array.map((v: any, idx: number) => ({
      ...v,
      id: `${fileName}-${idx}-${Date.now()}`,
      fileName
    }));
  } catch (e) {
    console.error("JSON Parse Error", e);
    return [];
  }
};