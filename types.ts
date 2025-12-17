export enum VulnerabilitySeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export interface Vulnerability {
  id: string;
  ruleId: string; // e.g., CVE-2023-XXXX
  name: string;
  description: string;
  severity: VulnerabilitySeverity;
  lineNumber: number;
  fileName: string;
  mitreTechnique?: string; // e.g., T1059
  fixSuggestion: string;
  fixedCode?: string;
}

export interface FileNode {
  id: string;
  name: string;
  path: string; // Full relative path: "src/components/App.tsx"
  content: string;
  language: string;
  vulnerabilities: Vulnerability[];
  fixedRanges?: { start: number; end: number }[]; // Lines to highlight green
  riskScore?: number; // 0-100
  selected?: boolean;
}

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  children: (FileNode | FolderNode)[];
  isOpen: boolean;
  type: 'folder';
  riskScore?: number; // Aggregated risk
}

export interface UserSettings {
  aiProvider: 'gemini' | 'openai' | 'claude' | 'ollama' | 'groq' | 'deepseek';
  apiKey?: string;
  localEndpoint?: string;
  selectedModel?: string;
  theme: 'dark' | 'light';
}

export enum AppRoute {
  LANDING = 'LANDING',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
  MEMBERS = 'MEMBERS',
  PRIVACY = 'PRIVACY',
  TERMS = 'TERMS',
  PRICING = 'PRICING',
  SUPPORT = 'SUPPORT',
  CHECKOUT = 'CHECKOUT',
  CHECKOUT_SUCCESS = 'CHECKOUT_SUCCESS',
  API_GUIDE = 'API_GUIDE',
  LICENSE = 'LICENSE'
}

export interface DownloadStat {
  date: string;
  downloads: number;
  activeUsers: number;
}

export interface ProjectHistory {
  id?: string;
  userId: string;
  projectName: string;
  projectType: 'file' | 'folder';
  fileCount: number;
  vulnerabilityCount: number;
  createdAt: Date;
  analyzedAt?: Date;
}