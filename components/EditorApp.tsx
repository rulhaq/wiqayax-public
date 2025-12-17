import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, FileText, Search, Play, Settings, AlertTriangle, 
  X, ChevronDown, ChevronRight, Loader2, Home, Download, Trash2,
  Shield, CheckSquare, Square, RefreshCw, Layers, File, EyeOff, BarChart3, FileCode, HelpCircle, ExternalLink
} from 'lucide-react';
import { analyzeCode } from '../services/llmService';
import { generatePDFReport } from '../services/reportService';
import { FileNode, FolderNode, Vulnerability, VulnerabilitySeverity, AppRoute } from '../types';
import { fetchOpenAIModels, fetchGeminiModels, fetchDeepSeekModels, fetchGroqModels, fetchOllamaModels, ModelInfo } from '../services/modelService';
import { getCurrentUser, signOut } from '../services/authService';
import { saveProjectHistory, logUserActivity } from '../services/userService';
// @ts-ignore
import JSZip from 'jszip';

// Global declaration for Prism
declare const Prism: any;

interface EditorAppProps {
  onNavigate: (route: AppRoute) => void;
}

// --- Helper: Language Mapper ---
const getLanguageFromExt = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'css': 'css',
    'json': 'json',
    'html': 'markup',
    'sh': 'bash',
    'bash': 'bash',
    'sql': 'sql',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'go': 'go',
    'rs': 'rust',
    'md': 'markdown'
  };
  return map[ext] || 'clike'; // 'clike' is a safe fallback for most code-like syntax
};

// --- Helper: Tree Construction from Paths ---
const buildFileTree = (files: FileNode[]): FolderNode => {
  const root: FolderNode = { id: 'root', name: 'root', path: '', children: [], isOpen: true, type: 'folder' };
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // It's the file
        currentLevel.children.push(file);
      } else {
        // It's a folder
        let existingFolder = currentLevel.children.find(c => (c as any).type === 'folder' && c.name === part) as FolderNode;
        if (!existingFolder) {
          existingFolder = {
            id: `folder-${part}-${index}-${Math.random()}`,
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            children: [],
            isOpen: true, // Default open for better UX
            type: 'folder'
          };
          currentLevel.children.push(existingFolder);
        }
        currentLevel = existingFolder;
      }
    });
  });
  return root;
};

// --- Helper: Calculate Risk Score ---
const calculateRiskScore = (vulns: Vulnerability[]) => {
  let score = 0;
  vulns.forEach(v => {
    if (v.severity === VulnerabilitySeverity.CRITICAL) score += 25;
    if (v.severity === VulnerabilitySeverity.HIGH) score += 15;
    if (v.severity === VulnerabilitySeverity.MEDIUM) score += 5;
    if (v.severity === VulnerabilitySeverity.LOW) score += 1;
  });
  return Math.min(score, 100);
};

// --- Component: Recursive File Explorer ---
const FileExplorerItem = ({ 
  item, 
  activeFileId, 
  onFileClick, 
  onToggleFolder,
  onDelete
}: { 
  item: FileNode | FolderNode; 
  activeFileId: string | null; 
  onFileClick: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  // Folder
  if ((item as any).type === 'folder') {
    const folder = item as FolderNode;
    // Calculate aggregate risk for folder
    const folderRisk = folder.children.reduce((acc: number, child) => {
       if ((child as any).type === 'folder') return acc; 
       return Math.max(acc, (child as FileNode).riskScore || 0);
    }, 0);

    return (
      <div className="pl-2">
        <div 
          className="flex items-center gap-1 py-1 cursor-pointer hover:bg-[#2a2d2e] text-gray-400 group select-none transition-colors"
          onClick={(e) => { e.stopPropagation(); onToggleFolder(folder.id); }}
        >
          {folder.isOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
          <Folder className={`w-4 h-4 shrink-0 ${folderRisk > 50 ? 'text-red-400' : 'text-blue-400'}`} />
          <span className="text-sm font-medium truncate">{folder.name}</span>
          {folderRisk > 0 && (
             <span className={`ml-auto text-[10px] px-1.5 rounded-full ${folderRisk > 70 ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
               {folderRisk}% Risk
             </span>
          )}
        </div>
        {folder.isOpen && (
          <div className="border-l border-gray-700 ml-2">
            {folder.children.map((child) => (
              <FileExplorerItem 
                key={child.id} 
                item={child} 
                activeFileId={activeFileId} 
                onFileClick={onFileClick}
                onToggleFolder={onToggleFolder}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File
  const file = item as FileNode;
  const riskColor = file.riskScore && file.riskScore > 70 ? 'text-red-500' : file.riskScore && file.riskScore > 30 ? 'text-yellow-500' : 'text-green-500';
  const isActive = activeFileId === file.id;

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onFileClick(file.id); }}
      className={`flex items-center gap-2 pl-6 py-1 cursor-pointer text-sm mb-0.5 rounded-sm transition-colors group ${isActive ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e] text-gray-400'}`}
    >
      <FileText className={`w-4 h-4 shrink-0 ${file.vulnerabilities.length > 0 ? riskColor : 'text-gray-500'}`} />
      <span className="truncate flex-1">{file.name}</span>
      {file.riskScore !== undefined && file.riskScore > 0 && (
        <span className={`text-[10px] ${riskColor}`}>{file.riskScore}%</span>
      )}
      <button 
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 p-1 hover:bg-[#3e3e42] rounded"
        onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
        title="Delete File from Project"
        type="button"
      >
        <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-500" />
      </button>
    </div>
  );
};

// --- Component: Syntax Highlighted Editor ---
const CodeEditor = ({ 
  code, 
  language, 
  onChange,
  vulns,
  fixedRanges
}: { 
  code: string, 
  language: string, 
  onChange: (val: string) => void,
  vulns: Vulnerability[],
  fixedRanges?: { start: number; end: number }[]
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  const LINE_HEIGHT = 24; // Must match CSS line-height exactly

  // Use useMemo for highlighting to avoid React/DOM conflicts associated with Prism.highlightElement
  const highlightedCode = useMemo(() => {
    if (typeof Prism === 'undefined') return code;
    
    // Fallback if the language definition isn't loaded
    const grammar = Prism.languages[language] || Prism.languages.clike || Prism.languages.plaintext;
    try {
      return Prism.highlight(code, grammar, language);
    } catch (e) {
      return code;
    }
  }, [code, language]);

  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      
      // Sync Pre Element (Text Colors)
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
      
      // Sync Background Element (Red/Green Lines)
      if (bgRef.current) {
        bgRef.current.scrollTop = scrollTop;
        bgRef.current.scrollLeft = scrollLeft;
      }

      const lineNumbers = document.getElementById('line-numbers');
      if (lineNumbers) {
        lineNumbers.scrollTop = scrollTop;
      }
    }
  };

  const lines = code.split('\n').length;
  const lineElements = Array.from({ length: lines }, (_, i) => i + 1);

  return (
    <div className="relative w-full h-full flex bg-[#1e1e1e] overflow-hidden group">
      {/* Line Numbers Gutter */}
      <div 
        id="line-numbers"
        className="w-12 bg-[#1e1e1e] text-[#858585] text-right pr-3 pt-4 select-none overflow-hidden font-mono text-sm shrink-0 border-r border-[#333]"
        style={{ lineHeight: `${LINE_HEIGHT}px` }}
      >
        {lineElements.map(num => {
            const hasVuln = vulns.some(v => v.lineNumber === num);
            return (
                <div key={num} className={`relative ${hasVuln ? 'text-red-500 font-bold' : ''}`}>
                    {num}
                </div>
            );
        })}
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 h-full font-mono text-sm" style={{ lineHeight: `${LINE_HEIGHT}px` }}>
        
        {/* Background Highlight Layer (Synced Scroll) */}
        <div 
          ref={bgRef}
          className="absolute inset-0 pointer-events-none z-0 m-0 p-4 overflow-hidden whitespace-pre bg-transparent"
        >
            <div className="relative w-full h-full">
                {vulns.map((v) => (
                    <div
                        key={v.id}
                        className="absolute left-0 right-0 bg-red-500/20 border-l-2 border-red-500"
                        style={{
                            top: `${(v.lineNumber - 1) * LINE_HEIGHT}px`,
                            height: `${LINE_HEIGHT}px`,
                            width: '100%'
                        }}
                    />
                ))}
                
                {fixedRanges?.map((range, idx) => (
                    <div
                        key={`fixed-${idx}`}
                        className="absolute left-0 right-0 bg-green-500/20 border-l-2 border-green-500 transition-all duration-500"
                        style={{
                            top: `${(range.start - 1) * LINE_HEIGHT}px`,
                            height: `${(range.end - range.start + 1) * LINE_HEIGHT}px`,
                            width: '100%'
                        }}
                    />
                ))}
                {/* Spacer to give height to the scrollable area based on line count */}
                 <div style={{ height: `${lines * LINE_HEIGHT}px`, width: '1px' }}></div>
            </div>
        </div>

        {/* Syntax Highlighted Layer (Visual) */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className={`absolute inset-0 m-0 p-4 pointer-events-none overflow-hidden whitespace-pre bg-transparent z-10 language-${language}`}
          style={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: `${LINE_HEIGHT}px` }}
        >
          <code 
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>

        {/* Text Input Layer (Interactive) */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          className="absolute inset-0 w-full h-full m-0 p-4 bg-transparent text-transparent caret-white resize-none border-none outline-none overflow-auto whitespace-pre z-20 selection:bg-blue-500/30"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'transparent', lineHeight: `${LINE_HEIGHT}px` }} 
        />
      </div>
    </div>
  );
};

// --- Main EditorApp Component ---
export const EditorApp: React.FC<EditorAppProps> = ({ onNavigate }) => {
  // State
  const [files, setFiles] = useState<FileNode[]>([
    { 
      id: '1', 
      name: 'example.py',
      path: 'example.py',
      language: 'python', 
      content: `import os\n\ndef get_user_data(user_id):\n    # TODO: sanitize input\n    query = "SELECT * FROM users WHERE id = " + user_id\n    os.system("echo " + query)\n    return query`, 
      vulnerabilities: [],
      fixedRanges: [],
      riskScore: 0,
    }
  ]);
  const [folderTree, setFolderTree] = useState<FolderNode | null>(null);
  
  // Tab Management
  const [openFileIds, setOpenFileIds] = useState<string[]>(['1']);
  const [activeFileId, setActiveFileId] = useState<string | null>('1');

  const [projectName, setProjectName] = useState('Project WiqayaX');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Settings
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [localEndpoint, setLocalEndpoint] = useState('http://localhost:11434');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStatus, setAnalyzingStatus] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ files: FileNode[], isFolder: boolean } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{ files: FileNode[], totalVulns: number, successCount: number } | null>(null);
  const [errorNotification, setErrorNotification] = useState<{ message: string; type: 'error' | 'warning' | 'info'; action?: { label: string; onClick: () => void } } | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss error notifications after 8 seconds
  useEffect(() => {
    if (errorNotification) {
      const timer = setTimeout(() => {
        setErrorNotification(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [errorNotification]);

  // --- Effects ---
  useEffect(() => {
    const loadUserSettings = async () => {
      // Get current user
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Try to load from user profile first
        try {
          const { getUserProfile } = await import('../services/userService');
          const profile = await getUserProfile(currentUser.uid);
          
          if (profile) {
            // Load from profile
            if (profile.apiKey) {
              setApiKey(profile.apiKey);
              localStorage.setItem('wiqaya_api_key', profile.apiKey);
            }
            if (profile.provider) {
              setSelectedProvider(profile.provider);
              localStorage.setItem('wiqaya_selected_provider', profile.provider);
            }
            if (profile.model) {
              setSelectedModel(profile.model);
              localStorage.setItem('wiqaya_selected_model', profile.model);
            }
            return; // Use profile settings, skip localStorage
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          // Fall through to localStorage
        }
      }
      
      // Fallback to localStorage
      const storedKey = localStorage.getItem('wiqaya_api_key');
      if (storedKey) setApiKey(storedKey);
      
      const storedModel = localStorage.getItem('wiqaya_selected_model');
      const storedProvider = localStorage.getItem('wiqaya_selected_provider') || 'gemini';
      
      // Only load stored model if it matches the stored provider
      if (storedModel && storedProvider) {
        // Basic validation: check if model name matches provider
        const geminiModels = ['gemini'];
        const groqModels = ['llama', 'mixtral', 'qwen'];
        const openaiModels = ['gpt', 'o1'];
        const deepseekModels = ['deepseek'];
        
        const modelLower = storedModel.toLowerCase();
        const isValid = 
          (storedProvider === 'gemini' && geminiModels.some(m => modelLower.includes(m))) ||
          (storedProvider === 'groq' && groqModels.some(m => modelLower.includes(m))) ||
          (storedProvider === 'openai' && openaiModels.some(m => modelLower.includes(m))) ||
          (storedProvider === 'deepseek' && deepseekModels.some(m => modelLower.includes(m))) ||
          storedProvider === 'ollama';
        
        if (isValid) {
          setSelectedModel(storedModel);
          setSelectedProvider(storedProvider);
        } else {
          // Invalid model/provider combo, clear it
          localStorage.removeItem('wiqaya_selected_model');
          setSelectedProvider(storedProvider);
        }
      } else if (storedProvider) {
        setSelectedProvider(storedProvider);
      }
    };
    
    loadUserSettings();
  }, []);

  // Fetch models when provider or API key changes
  useEffect(() => {
    const fetchModels = async () => {
      if (selectedProvider === 'ollama') {
        setLoadingModels(true);
        try {
          const models = await fetchOllamaModels(localEndpoint);
          setAvailableModels(models);
          if (models.length > 0 && !selectedModel) {
            setSelectedModel(models[0].id);
          }
        } catch (error) {
          console.error('Error fetching Ollama models:', error);
          setAvailableModels([]);
        } finally {
          setLoadingModels(false);
        }
      } else if (apiKey && apiKey.length > 10) {
        setLoadingModels(true);
        try {
          let models: ModelInfo[] = [];
          switch (selectedProvider) {
            case 'openai':
              models = await fetchOpenAIModels(apiKey);
              break;
            case 'gemini':
              models = await fetchGeminiModels(apiKey);
              break;
            case 'deepseek':
              models = await fetchDeepSeekModels(apiKey);
              break;
            case 'groq':
              models = await fetchGroqModels(apiKey);
              break;
            default:
              models = [];
          }
          setAvailableModels(models);
          if (models.length > 0 && !selectedModel) {
            setSelectedModel(models[0].id);
          }
        } catch (error) {
          console.error('Error fetching models:', error);
          setAvailableModels([]);
        } finally {
          setLoadingModels(false);
        }
      } else {
        setAvailableModels([]);
        setSelectedModel('');
      }
    };

    fetchModels();
  }, [selectedProvider, apiKey, localEndpoint]);

  // Rebuild tree when files change
  useEffect(() => {
    const filteredFiles = searchQuery 
        ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : files;
    const root = buildFileTree(filteredFiles);
    setFolderTree(root);
  }, [files, searchQuery]);

  // Derived state
  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);
  const openFiles = useMemo(() => files.filter(f => openFileIds.includes(f.id)), [files, openFileIds]);

  // --- Actions ---

  const handleFileClick = (fileId: string) => {
      // 1. Ensure file is in open files (tabs)
      if (!openFileIds.includes(fileId)) {
          setOpenFileIds(prev => [...prev, fileId]);
      }
      // 2. Set as active
      setActiveFileId(fileId);
  };

  const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
      e.stopPropagation();
      
      // Remove from open list
      setOpenFileIds(prev => prev.filter(id => id !== fileId));
      
      // If closing active file, switch to another one
      if (activeFileId === fileId) {
          const index = openFileIds.indexOf(fileId);
          // Try next, then previous, then null
          const nextId = openFileIds[index + 1] || openFileIds[index - 1];
          setActiveFileId(nextId || null);
      }
  };

  const handleFileChange = (newContent: string) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
  };


  const downloadProject = async () => {
    const zip = new JSZip();
    files.forEach(file => zip.file(file.path, file.content));
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}_Secure.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isFolder: boolean) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    // Log activity
    if (user) {
      logUserActivity({
        userId: user.uid,
        activityType: 'project_upload',
        activityDetails: {
          projectType: isFolder ? 'folder' : 'file',
          fileCount: uploadedFiles.length
        }
      }).catch(err => console.error("Error logging activity:", err));
    }

    let rootFolder = '';
    if (isFolder && uploadedFiles[0].webkitRelativePath) {
        rootFolder = uploadedFiles[0].webkitRelativePath.split('/')[0];
    }

    const newFiles: FileNode[] = [];
    const readers: Promise<void>[] = [];

    Array.from(uploadedFiles).forEach((file: File) => {
        if (file.name.startsWith('.') || file.webkitRelativePath.includes('node_modules')) return;
        if (file.size > 2 * 1024 * 1024) return; 

        const p = new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target?.result as string;
                if (!/[\x00-\x08\x0E-\x1F]/.test(content)) {
                    const path = file.webkitRelativePath || file.name;
                    const lang = getLanguageFromExt(file.name);
                    newFiles.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        path: path,
                        content,
                        language: lang,
                        vulnerabilities: [],
                        fixedRanges: [],
                        riskScore: 0
                    });
                }
                resolve();
            };
            reader.readAsText(file);
        });
        readers.push(p);
    });

    await Promise.all(readers);

    if (newFiles.length > 0) {
        const isFreshProject = files.length === 1 && files[0].id === '1' && files[0].name === 'example.py';

        // Check if there's an existing project with actual files
        if (!isFreshProject && files.some(f => f.name !== 'example.py' || f.id !== '1')) {
            // Show warning modal
            setPendingUpload({ files: newFiles, isFolder });
            setShowReplaceWarning(true);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (folderInputRef.current) folderInputRef.current.value = '';
            return;
        }

        // Replace project
        if (rootFolder) {
            setProjectName(rootFolder);
        } else if (newFiles.length === 1) {
            setProjectName(newFiles[0].name);
        }
        
        setFiles(newFiles);
        setOpenFileIds([newFiles[0].id]);
        setActiveFileId(newFiles[0].id);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const confirmReplaceProject = () => {
    if (pendingUpload) {
      if (pendingUpload.isFolder && pendingUpload.files[0]?.path) {
        const rootFolder = pendingUpload.files[0].path.split('/')[0];
        setProjectName(rootFolder);
      } else if (pendingUpload.files.length === 1) {
        setProjectName(pendingUpload.files[0].name);
      }
      
      setFiles(pendingUpload.files);
      setOpenFileIds([pendingUpload.files[0].id]);
      setActiveFileId(pendingUpload.files[0].id);
      setPendingUpload(null);
    }
    setShowReplaceWarning(false);
  };

  const cancelReplaceProject = () => {
    setPendingUpload(null);
    setShowReplaceWarning(false);
  };

  const runAnalysis = async () => {
      if (!activeFile) return;
      setIsAnalyzing(true);
      setAnalyzingStatus(`Scanning ${activeFile.name}...`);
      
      // Log activity
      if (user) {
        logUserActivity({
          userId: user.uid,
          activityType: 'analysis_start',
          activityDetails: {
            projectName: projectName,
            fileName: activeFile.name,
            provider: selectedProvider
          }
        }).catch(err => console.error("Error logging activity:", err));
      }
      
      try {
          console.log(`Starting analysis for ${activeFile.name} with provider: ${selectedProvider}`);
          const vulns = await analyzeCode(selectedProvider, apiKey, localEndpoint, activeFile.content, activeFile.name, selectedModel);
          console.log(`Analysis complete. Found ${vulns.length} vulnerabilities:`, vulns);
          
          // Validate vulnerabilities before storing - ensure accuracy
          const validVulns = vulns.filter(v => {
            // Must have all required fields
            if (!v || !v.ruleId || !v.name || !v.severity || !v.lineNumber) {
              return false;
            }
            // Validate severity is one of the allowed values
            const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
            if (!validSeverities.includes(v.severity)) {
              console.warn(`Invalid severity "${v.severity}" for vulnerability ${v.name}, skipping`);
              return false;
            }
            // Validate line number is positive
            if (typeof v.lineNumber !== 'number' || v.lineNumber < 1) {
              console.warn(`Invalid line number ${v.lineNumber} for vulnerability ${v.name}, skipping`);
              return false;
            }
            // Validate line number is within file bounds
            const fileLines = activeFile.content.split('\n').length;
            if (v.lineNumber > fileLines) {
              console.warn(`Line number ${v.lineNumber} exceeds file length ${fileLines} for ${v.name}, adjusting`);
              v.lineNumber = Math.min(v.lineNumber, fileLines);
            }
            return true;
          });
          console.log(`Valid vulnerabilities: ${validVulns.length} out of ${vulns.length}`);
          
          const score = calculateRiskScore(validVulns);
          
          setFiles(prev => {
            const updated = prev.map(f => 
               f.id === activeFile.id ? { ...f, vulnerabilities: validVulns, riskScore: score, fixedRanges: [] } : f
            );
            console.log(`Updated file ${activeFile.name} with ${validVulns.length} vulnerabilities, risk score: ${score}`);
            return updated;
          });
          
          // Show success message
          if (vulns.length === 0) {
              setAnalyzingStatus('Analysis complete - No issues found!');
              setTimeout(() => setAnalyzingStatus(''), 3000);
          } else {
              setAnalyzingStatus(`Found ${vulns.length} issue(s)!`);
              setTimeout(() => setAnalyzingStatus(''), 3000);
          }
      } catch (e: any) {
          console.error("Analysis error:", e);
          const errorMessage = e.message || String(e);
          console.error("Error details:", errorMessage);
          
          // Check if it's an API key or model error
          if (errorMessage.includes("API") || errorMessage.includes("key") || errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("permission") || errorMessage.includes("invalid") || errorMessage.includes("model") || errorMessage.includes("required")) {
              setErrorNotification({
                  message: `API Key/Model Error: ${errorMessage}`,
                  type: 'error',
                  action: {
                      label: 'Update Settings',
                      onClick: () => {
                          setErrorNotification(null);
                          setSettingsOpen(true);
                      }
                  }
              });
          } else if (errorMessage.includes("431") || errorMessage.includes("Header Fields Too Large")) {
              setErrorNotification({
                  message: 'Request failed: Headers too large. Please try again or check your API key.',
                  type: 'error'
              });
          } else {
              setErrorNotification({
                  message: `Analysis Failed: ${errorMessage}`,
                  type: 'error'
              });
          }
      } finally {
          setIsAnalyzing(false);
          setAnalyzingStatus('');
      }
  };

  const runAllAnalysis = async () => {
      if (files.length === 0) {
          setErrorNotification({
              message: 'No files to analyze. Please add files first.',
              type: 'warning'
          });
          return;
      }
      
      setIsAnalyzing(true);
      setAnalyzingStatus(`Starting analysis of ${files.length} file(s)...`);
      
      // Log activity
      if (user) {
        logUserActivity({
          userId: user.uid,
          activityType: 'analysis_start',
          activityDetails: {
            projectName: projectName,
            fileCount: files.length,
            provider: selectedProvider
          }
        }).catch(err => console.error("Error logging activity:", err));
      }
      
      let processed = 0;
      let successCount = 0;
      let errorCount = 0;
      const updatedFiles: FileNode[] = [];
      
      try {
          for (const file of files) {
              setAnalyzingStatus(`Scanning ${file.name} (${processed + 1}/${files.length})...`);
              try {
             console.log(`Analyzing ${file.name} (${processed + 1}/${files.length}) with provider: ${selectedProvider}, model: ${selectedModel || 'default'}`);
             const vulns = await analyzeCode(selectedProvider, apiKey, localEndpoint, file.content, file.name, selectedModel || undefined);
             console.log(`Found ${vulns.length} vulnerabilities in ${file.name}:`, vulns);
             
             // Validate vulnerabilities before storing - ensure accuracy
             const validVulns = vulns.filter(v => {
               // Must have all required fields
               if (!v || !v.ruleId || !v.name || !v.severity || !v.lineNumber) {
                 return false;
               }
               // Validate severity is one of the allowed values
               const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
               if (!validSeverities.includes(v.severity)) {
                 console.warn(`Invalid severity "${v.severity}" for vulnerability ${v.name}, skipping`);
                 return false;
               }
               // Validate line number is positive
               if (typeof v.lineNumber !== 'number' || v.lineNumber < 1) {
                 console.warn(`Invalid line number ${v.lineNumber} for vulnerability ${v.name}, skipping`);
                 return false;
               }
               // Validate line number is within file bounds
               const fileLines = file.content.split('\n').length;
               if (v.lineNumber > fileLines) {
                 console.warn(`Line number ${v.lineNumber} exceeds file length ${fileLines} for ${v.name}, adjusting`);
                 v.lineNumber = Math.min(v.lineNumber, fileLines);
               }
               return true;
             });
             console.log(`Valid vulnerabilities: ${validVulns.length} out of ${vulns.length}`);
             
             const score = calculateRiskScore(validVulns);
             
             // Update file in local array
             updatedFiles.push({ ...file, vulnerabilities: validVulns, riskScore: score, fixedRanges: [] });
             
             // Update state
             setFiles(prev => {
               const updated = prev.map(f => 
                  f.id === file.id ? { ...f, vulnerabilities: validVulns, riskScore: score, fixedRanges: [] } : f
               );
               console.log(`Updated file ${file.name} with ${validVulns.length} vulnerabilities, risk score: ${score}`);
               return updated;
             });
             successCount++;
              } catch (e) {
                  console.error(`Error analyzing ${file.name}`, e);
                  const errorMessage = (e as any).message || String(e);
                  
                  // Check if it's an API key or model error - stop processing
                  if (errorMessage.includes("API") || errorMessage.includes("key") || errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("permission") || errorMessage.includes("invalid") || errorMessage.includes("model") || errorMessage.includes("required") || errorMessage.includes("431") || errorMessage.includes("Header Fields Too Large")) {
                      console.error("API Key/Model error detected, stopping analysis");
                      errorCount++;
                      setIsAnalyzing(false);
                      setAnalyzingStatus('API Key/Model Error. Please update your settings.');
                      setErrorNotification({
                          message: `API Key/Model Error: ${errorMessage}`,
                          type: 'error',
                          action: {
                              label: 'Update Settings',
                              onClick: () => {
                                  setErrorNotification(null);
                                  setSettingsOpen(true);
                              }
                          }
                      });
                      return; // Stop processing
                  } else {
                      console.error(`Failed to analyze ${file.name}:`, errorMessage);
                      errorCount++;
                      // Mark file as failed but continue
                      updatedFiles.push({ ...file, vulnerabilities: [], riskScore: 0 });
                      setFiles(prev => prev.map(f => 
                         f.id === file.id ? { ...f, vulnerabilities: [], riskScore: 0 } : f
                      ));
                  }
              }
              processed++;
          }
          
          // Show completion message
          setIsAnalyzing(false);
          
          // Calculate totals from updated files
          const totalVulns = updatedFiles.reduce((acc, f) => acc + (f.vulnerabilities?.length || 0), 0);
          
          if (successCount > 0) {
            setAnalyzingStatus(`Analysis complete! ${successCount} file(s) analyzed, ${totalVulns} issue(s) found.`);
            setTimeout(() => setAnalyzingStatus(''), 5000);
            
            // Show results modal - use setTimeout to avoid state update conflicts
            setTimeout(() => {
              setAnalysisResults({
                files: updatedFiles,
                totalVulns,
                successCount
              });
              setShowResultsModal(true);
            }, 100);
            
            // Save project history to Firebase
            if (user) {
              // Calculate total lines of code
              const totalLines = updatedFiles.reduce((sum, f) => {
                const lines = f.content.split('\n').length;
                return sum + lines;
              }, 0);
              
              saveProjectHistory({
                userId: user.uid,
                projectName: projectName,
                projectType: updatedFiles.length === 1 ? 'file' : 'folder',
                fileCount: updatedFiles.length,
                lineCount: totalLines,
                vulnerabilityCount: totalVulns,
                createdAt: new Date(),
                analyzedAt: new Date()
              }).catch(error => {
                console.error("Error saving project history:", error);
              });
              
              // Log activity
              logUserActivity({
                userId: user.uid,
                activityType: 'analysis_complete',
                activityDetails: {
                  projectName: projectName,
                  fileCount: updatedFiles.length,
                  vulnerabilityCount: totalVulns,
                  provider: selectedProvider,
                  model: selectedModel
                }
              }).catch(error => {
                console.error("Error logging activity:", error);
              });
            }
          } else {
            setAnalyzingStatus('Analysis failed. Check console for details.');
            setTimeout(() => setAnalyzingStatus(''), 3000);
          }
      } catch (error: any) {
          console.error("Fatal error during analysis:", error);
          const errorMessage = error.message || "Unknown error";
          
          // Check if it's an API key error
          if (errorMessage.includes('API') || errorMessage.includes('key') || errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('permission') || errorMessage.includes('invalid') || errorMessage.includes('required') || errorMessage.includes('431')) {
            setErrorNotification({
                message: `API Key Error: ${errorMessage}`,
                type: 'error',
                action: {
                    label: 'Update Settings',
                    onClick: () => {
                        setErrorNotification(null);
                        setSettingsOpen(true);
                    }
                }
            });
          } else {
            setErrorNotification({
                message: `Analysis failed: ${errorMessage}`,
                type: 'error'
            });
          }
      } finally {
          setIsAnalyzing(false);
          // Don't clear status immediately - let user see completion message
          setTimeout(() => setAnalyzingStatus(''), 5000);
      }
  };

  const toggleFolder = (folderId: string) => {
      const updateTree = (node: FolderNode): FolderNode => {
          if (node.id === folderId) return { ...node, isOpen: !node.isOpen };
          return { ...node, children: node.children.map(c => (c as any).type === 'folder' ? updateTree(c as FolderNode) : c) };
      };
      if (folderTree) setFolderTree(updateTree(folderTree));
  };

  const deleteFile = (fileId: string) => {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setOpenFileIds(prev => prev.filter(id => id !== fileId));
      if (activeFileId === fileId) setActiveFileId(null);
  };

  const totalVulns = files.reduce((acc, f) => acc + f.vulnerabilities.length, 0);
  const criticalCount = files.reduce((acc, f) => acc + f.vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL).length, 0);
  const avgRisk = files.length > 0 ? Math.round(files.reduce((acc, f) => acc + (f.riskScore || 0), 0) / files.length) : 0;

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#d4d4d4] font-sans overflow-hidden">
      
      {/* Top Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Activity Bar */}
        <div className="w-12 bg-[#333333] flex flex-col items-center py-4 justify-between z-20 shrink-0 border-r border-[#2b2b2b]">
            <div className="flex flex-col gap-6 items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mb-2 shadow-lg cursor-pointer hover:bg-blue-500" onClick={() => onNavigate(AppRoute.LANDING)}>
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded ${sidebarOpen ? 'text-white' : 'text-gray-500'}`}><Folder className="w-6 h-6" /></button>
                <button className="p-2 text-gray-500 hover:text-white"><Search className="w-6 h-6" /></button>
                <button onClick={() => setShowHelpModal(true)} className="p-2 text-gray-500 hover:text-white" title="Documentation & Troubleshooting"><HelpCircle className="w-6 h-6" /></button>
            </div>
            <button onClick={() => setSettingsOpen(true)} className="p-2 text-gray-500 hover:text-white"><Settings className="w-6 h-6" /></button>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
            <div className="w-64 bg-[#252526] flex flex-col border-r border-[#1e1e1e] shrink-0">
                <div className="p-3 flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span>Explorer</span>
                    <div className="flex gap-1">
                        <button onClick={() => setFolderTree(buildFileTree(files))} className="hover:text-white"><RefreshCw className="w-3 h-3"/></button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-3 pb-2">
                    <div className="flex items-center bg-[#3c3c3c] rounded px-2 py-1">
                        <Search className="w-3 h-3 text-gray-400 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-gray-500"
                        />
                    </div>
                </div>
                
                {/* File Tree */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-2">
                         <div className="flex items-center justify-between gap-1 text-sm font-bold text-blue-400 mb-2 px-2 py-1 hover:bg-[#2a2d2e] cursor-pointer group">
                            <div className="flex items-center gap-1">
                                <ChevronDown className="w-4 h-4" />
                                <span className="uppercase text-xs tracking-wider font-bold text-white truncate max-w-[120px]">{projectName}</span>
                            </div>
                            {files.length > 0 && (
                                <div className="flex gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); downloadProject(); }} className="text-gray-400 hover:text-blue-500 transition-colors" title="Download Source Code">
                                        <Download className="w-3 h-3" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); runAllAnalysis(); }} disabled={isAnalyzing} className="text-gray-400 hover:text-green-500 transition-colors" title="Analyze All Files">
                                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Play className="w-3 h-3 fill-current"/>}
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {folderTree && folderTree.children.map(child => (
                            <FileExplorerItem 
                                key={child.id} 
                                item={child} 
                                activeFileId={activeFileId} 
                                onFileClick={handleFileClick} 
                                onToggleFolder={toggleFolder}
                                onDelete={deleteFile}
                            />
                        ))}
                        
                        {files.length === 0 && (
                            <div className="px-4 py-8 text-center text-xs text-gray-500">
                                No files loaded. Open a project to begin.
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Buttons */}
                <div className="p-3 border-t border-[#3e3e42] bg-[#252526] grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 bg-[#3e3e42] hover:bg-[#4e4e52] text-white py-2 rounded text-xs"
                    >
                        <FileText className="w-3 h-3" /> Add File
                    </button>
                    <button 
                        onClick={() => folderInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 bg-[#3e3e42] hover:bg-[#4e4e52] text-white py-2 rounded text-xs"
                    >
                        <Folder className="w-3 h-3" /> Add Folder
                    </button>
                    
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => handleFileUpload(e, false)} />
                    <input type="file" ref={folderInputRef} className="hidden" multiple 
                        // @ts-ignore 
                        webkitdirectory="" 
                        onChange={(e) => handleFileUpload(e, true)} 
                    />
                </div>
            </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
            {/* Tabs Bar */}
            <div className="h-9 bg-[#252526] flex items-center overflow-x-auto no-scrollbar border-b border-[#2b2b2b]">
                {openFiles.map(file => (
                    <div 
                        key={file.id}
                        onClick={() => setActiveFileId(file.id)}
                        className={`h-full flex items-center px-3 border-r border-[#2b2b2b] cursor-pointer min-w-[120px] max-w-[200px] text-sm group select-none ${activeFileId === file.id ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500' : 'bg-[#2d2d2d] text-gray-500 hover:bg-[#2a2d2e]'}`}
                    >
                        <span className={`mr-2 truncate ${file.riskScore && file.riskScore > 50 ? 'text-red-400' : ''}`}>{file.name}</span>
                        <X 
                            className="w-3 h-3 rounded hover:bg-gray-700/50" 
                            onClick={(e) => handleCloseTab(e, file.id)}
                        />
                    </div>
                ))}
            </div>

            {/* Code Editor */}
            <div className="flex-1 relative min-h-0 bg-[#1e1e1e]">
                {activeFile ? (
                    <>
                         <CodeEditor 
                            key={activeFile.id} // Forces re-render on file switch for fresh state
                            code={activeFile.content} 
                            language={activeFile.language} 
                            onChange={handleFileChange}
                            vulns={activeFile.vulnerabilities}
                            fixedRanges={activeFile.fixedRanges}
                         />
                         
                         {/* Floating Analyze Button */}
                         <div className="absolute top-4 right-8 flex flex-col items-end gap-2 z-20">
                            {analyzingStatus && (
                                <div className="bg-blue-900/90 text-white px-3 py-1.5 rounded text-xs font-medium shadow-lg">
                                    {analyzingStatus}
                                </div>
                            )}
                            <button 
                                onClick={runAnalysis}
                                disabled={isAnalyzing}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Play className="w-3 h-3 fill-current"/>}
                                ANALYZE FILE
                            </button>
                         </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Shield className="w-16 h-16 opacity-20 mb-4" />
                        <p>No file is open.</p>
                        <p className="text-xs mt-2">Select a file from the explorer to view code.</p>
                    </div>
                )}
            </div>

            {/* Bottom Panel: Analysis Findings */}
            <div className="h-64 bg-[#1e1e1e] border-t border-[#3e3e42] flex flex-col shrink-0">
                <div className="flex items-center px-4 h-10 border-b border-[#3e3e42] bg-[#252526] justify-between">
                     <span className="text-xs font-bold text-gray-300 uppercase">
                        Code Analysis & QC Findings {activeFile && `- ${activeFile.name}`}
                     </span>
                     <div className="flex gap-2">
                         {activeFile && activeFile.vulnerabilities.length > 0 && (
                            <button 
                                onClick={() => {
                                    try {
                                        const userName = user?.displayName || user?.email?.split('@')[0] || 'User';
                                        generatePDFReport([activeFile], projectName, false, userName);
                                        
                                        // Log activity
                                        if (user) {
                                          logUserActivity({
                                            userId: user.uid,
                                            activityType: 'report_generated',
                                            activityDetails: {
                                              projectName: projectName,
                                              reportType: 'single_file',
                                              fileName: activeFile.name
                                            }
                                          }).catch(err => console.error("Error logging activity:", err));
                                        }
                                    } catch (error) {
                                        console.error("Report generation error:", error);
                                        setErrorNotification({
                                            message: `Failed to generate report: ${(error as Error).message}`,
                                            type: 'error'
                                        });
                                    }
                                }} 
                                className="flex items-center gap-1 text-xs bg-[#3e3e42] hover:bg-[#4e4e52] text-white px-3 py-1 rounded transition-colors"
                            >
                                <Download className="w-3 h-3" /> File Report
                            </button>
                         )}
                         {files.some(f => f.vulnerabilities && f.vulnerabilities.length > 0) && (
                            <button 
                                onClick={() => {
                                    try {
                                        const filesWithVulns = files.filter(f => f.vulnerabilities && f.vulnerabilities.length > 0);
                                        if (filesWithVulns.length === 0) {
                                            setErrorNotification({
                                                message: 'No vulnerabilities found to generate report.',
                                                type: 'info'
                                            });
                                            return;
                                        }
                                        console.log("Generating project report for", filesWithVulns.length, "files");
                                        const userName = user?.displayName || user?.email?.split('@')[0] || 'User';
                                        generatePDFReport(filesWithVulns, projectName, true, userName);
                                        
                                        // Log activity
                                        if (user) {
                                          logUserActivity({
                                            userId: user.uid,
                                            activityType: 'report_generated',
                                            activityDetails: {
                                              projectName: projectName,
                                              reportType: 'project',
                                              fileCount: filesWithVulns.length,
                                              totalVulns: filesWithVulns.reduce((sum, f) => sum + (f.vulnerabilities?.length || 0), 0)
                                            }
                                          }).catch(err => console.error("Error logging activity:", err));
                                        }
                                    } catch (error) {
                                        console.error("Report generation error:", error);
                                        setErrorNotification({
                                            message: `Failed to generate report: ${(error as Error).message}`,
                                            type: 'error'
                                        });
                                    }
                                }} 
                                className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition-colors"
                            >
                                <File className="w-3 h-3" /> Project Report ({files.filter(f => f.vulnerabilities && f.vulnerabilities.length > 0).length} files, {files.reduce((sum, f) => sum + (f.vulnerabilities?.length || 0), 0)} issues)
                            </button>
                         )}
                     </div>
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    {isAnalyzing && (
                        <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                            <Loader2 className="w-8 h-8 mb-2 animate-spin text-blue-500" />
                            <p>{analyzingStatus || "Analyzing code..."}</p>
                        </div>
                    )}
                    {!isAnalyzing && activeFile && activeFile.vulnerabilities && activeFile.vulnerabilities.length > 0 ? (
                        <>
                            <div className="px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
                                <span className="text-xs text-gray-400">
                                    {activeFile.vulnerabilities.length} issue(s) in {activeFile.name}
                                </span>
                            </div>
                            {activeFile.vulnerabilities.map(vuln => (
                                <div key={vuln.id} className="flex gap-3 p-3 hover:bg-[#2a2d2e] border-b border-[#2d2d2d] group transition-colors">
                                     <div className="pt-1 shrink-0">
                                        <AlertTriangle className={`w-4 h-4 ${vuln.severity === 'CRITICAL' ? 'text-red-500' : vuln.severity === 'HIGH' ? 'text-orange-500' : 'text-yellow-500'}`} />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <div className="flex items-center gap-2 mb-1 flex-wrap">
                                             <span className={`text-xs font-bold px-1.5 rounded ${vuln.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-400' : vuln.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                                 {vuln.severity}
                                             </span>
                                             <span className="text-gray-300 text-sm font-medium">{vuln.name}</span>
                                             <span className="text-gray-500 text-xs">Line {vuln.lineNumber}</span>
                                             {vuln.ruleId && (
                                                 <span className="text-gray-600 text-xs font-mono">{vuln.ruleId}</span>
                                             )}
                                         </div>
                                         <p className="text-gray-400 text-xs mb-2 leading-relaxed">{vuln.description}</p>
                                         <div className="flex items-center gap-4 flex-wrap">
                                             <div className="text-xs text-gray-500 font-mono bg-black/30 px-2 py-1 rounded max-w-md">
                                                 <span className="text-gray-400">Fix: </span>{vuln.fixSuggestion}
                                             </div>
                                         </div>
                                     </div>
                                </div>
                            ))}
                        </>
                    ) : !isAnalyzing && activeFile && activeFile.vulnerabilities && activeFile.vulnerabilities.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                            <CheckSquare className="w-8 h-8 mb-2 opacity-20" />
                            <p>No issues detected in {activeFile.name}.</p>
                            <p className="text-xs mt-1 text-gray-600">Run analysis to check for vulnerabilities.</p>
                        </div>
                    ) : !isAnalyzing ? (
                        <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                            <CheckSquare className="w-8 h-8 mb-2 opacity-20" />
                            <p>No file open.</p>
                            <p className="text-xs mt-1 text-gray-600">Select a file from the explorer to view analysis results.</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="h-6 bg-[#007acc] text-white flex items-center px-3 text-xs justify-between select-none">
          <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> main*</span>
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {totalVulns} Errors</span>
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {criticalCount} Critical</span>
          </div>
          <div className="flex items-center gap-4">
              <span>Ln {activeFile?.content.split('\n').length || 0}, Col 1</span>
              <span>UTF-8</span>
              <span>{activeFile?.language.toUpperCase() || 'TXT'}</span>
              <span className="font-bold">Project Risk: {avgRisk}%</span>
              {user && (
                <span className="text-gray-300">User: {user.displayName || user.email?.split('@')[0] || 'Guest'}</span>
              )}
              <span className="hover:bg-white/20 px-1 rounded cursor-pointer">WiqayaX 1.0.0</span>
          </div>
      </div>

       {/* Settings Modal */}
      {settingsOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in">
              <div className="bg-[#252526] w-full max-w-md p-6 rounded-lg shadow-2xl border border-[#3e3e42] transform transition-all scale-100">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-white">WiqayaX Settings</h2>
                      <button onClick={() => setSettingsOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">AI Provider</label>
                          <select 
                            value={selectedProvider}
                            onChange={(e) => {
                              const newProvider = e.target.value;
                              setSelectedProvider(newProvider);
                              // Reset model when provider changes to avoid model/provider mismatch
                              setSelectedModel('');
                              setAvailableModels([]);
                              // Clear stored model from localStorage and store new provider
                              localStorage.removeItem('wiqaya_selected_model');
                              localStorage.setItem('wiqaya_selected_provider', newProvider);
                            }}
                            className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                              <option value="gemini">Google Gemini (Recommended)</option>
                              <option value="openai">OpenAI (GPT-4)</option>
                              <option value="deepseek">DeepSeek (Coder)</option>
                              <option value="groq">Groq (Llama 3/Mixtral)</option>
                              <option value="ollama">Local LLM (Ollama)</option>
                          </select>
                      </div>

                      {selectedProvider === 'ollama' ? (
                        <>
                           <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Ollama Endpoint URL</label>
                            <input 
                                type="text" 
                                value={localEndpoint}
                                onChange={(e) => setLocalEndpoint(e.target.value)}
                                placeholder="http://localhost:11434"
                                className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-gray-500">Make sure Ollama is running with CORS enabled</p>
                          </div>
                          {availableModels.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Select Model</label>
                              <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                              >
                                {availableModels.map(model => (
                                  <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">API Key</label>
                            <input 
                                type="password" 
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter API Key"
                                className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                            <button 
                                onClick={() => onNavigate(AppRoute.API_GUIDE)}
                                className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                                <Shield className="w-3 h-3" /> Need a key? Read the Guide
                            </button>
                          </div>
                          {loadingModels && (
                            <div className="text-xs text-gray-400 flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" /> Loading available models...
                            </div>
                          )}
                          {availableModels.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Select Model</label>
                              <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                              >
                                {availableModels.map(model => (
                                  <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </>
                      )}
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                      <button 
                        onClick={() => setSettingsOpen(false)}
                        className="text-gray-400 hover:text-white px-4 py-2 text-sm font-medium"
                      >
                          Cancel
                      </button>
                        <button 
                          onClick={async () => {
                              localStorage.setItem('wiqaya_api_key', apiKey);
                              localStorage.setItem('wiqaya_selected_provider', selectedProvider);
                              if (selectedModel) {
                                localStorage.setItem('wiqaya_selected_model', selectedModel);
                              } else {
                                localStorage.removeItem('wiqaya_selected_model');
                              }
                              if (selectedProvider === 'ollama') {
                                localStorage.setItem('wiqaya_ollama_endpoint', localEndpoint);
                              }
                              
                              // Log activity
                              if (user) {
                                await logUserActivity({
                                  userId: user.uid,
                                  activityType: 'settings_change',
                                  activityDetails: {
                                    provider: selectedProvider,
                                    model: selectedModel || 'default'
                                  }
                                }).catch(err => console.error("Error logging activity:", err));
                              }
                              
                              setSettingsOpen(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium shadow-lg shadow-blue-900/20"
                        >
                            Save Settings
                        </button>
                  </div>
              </div>
          </div>
      )}

      {/* Replace Project Warning Modal */}
      {showReplaceWarning && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-md animate-fade-in px-4">
          <div className="bg-[#1e1e24] border border-yellow-500/30 rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all scale-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-red-500"></div>

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3 text-white">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold">Replace Current Project?</h2>
              </div>
              <button onClick={cancelReplaceProject}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4 leading-relaxed">
                You are about to replace the current project. <strong className="text-white">All current files and analysis results will be deleted.</strong>
              </p>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-400 text-sm font-medium mb-2">⚠️ Important:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
                  <li>All current files will be removed</li>
                  <li>All analysis results will be lost</li>
                  <li>Any unsaved changes will be deleted</li>
                </ul>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm font-medium mb-2">💡 Recommendation:</p>
                <p className="text-gray-300 text-sm">
                  Please download your PDF report and secure project ZIP before replacing, as all changes will be lost.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={cancelReplaceProject}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReplaceProject}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold transition-all shadow-lg text-sm"
              >
                Replace Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && analysisResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in px-4">
          <div className="bg-[#1e1e24] border border-gray-700 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Analysis Complete</h2>
                  <p className="text-sm text-gray-400">Review findings and download your report</p>
                </div>
              </div>
              <button 
                onClick={() => setShowResultsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Statistics */}
            <div className="p-6 border-b border-gray-700 bg-[#12141a]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0a0a0c] rounded-xl p-4 border border-gray-800">
                  <div className="text-3xl font-bold text-white mb-1">{analysisResults.successCount}</div>
                  <div className="text-xs text-gray-400">Files Analyzed</div>
                </div>
                <div className="bg-[#0a0a0c] rounded-xl p-4 border border-gray-800">
                  <div className="text-3xl font-bold text-red-500 mb-1">
                    {analysisResults.files.reduce((acc, f) => acc + (f.vulnerabilities?.filter(v => v.severity === 'CRITICAL').length || 0), 0)}
                  </div>
                  <div className="text-xs text-gray-400">Critical Issues</div>
                </div>
                <div className="bg-[#0a0a0c] rounded-xl p-4 border border-gray-800">
                  <div className="text-3xl font-bold text-orange-500 mb-1">
                    {analysisResults.files.reduce((acc, f) => acc + (f.vulnerabilities?.filter(v => v.severity === 'HIGH').length || 0), 0)}
                  </div>
                  <div className="text-xs text-gray-400">High Issues</div>
                </div>
                <div className="bg-[#0a0a0c] rounded-xl p-4 border border-gray-800">
                  <div className="text-3xl font-bold text-yellow-500 mb-1">{analysisResults.totalVulns}</div>
                  <div className="text-xs text-gray-400">Total Issues</div>
                </div>
              </div>
            </div>

            {/* Results Cards */}
            <div className="flex-1 overflow-y-auto p-6">
              {analysisResults.totalVulns === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-white mb-2">No Issues Found!</h3>
                  <p className="text-gray-400">Your code appears to be secure. Great job!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analysisResults.files
                    .filter(f => f.vulnerabilities && f.vulnerabilities.length > 0)
                    .map((file) => (
                      <div key={file.id} className="bg-[#12141a] rounded-xl border border-gray-800 overflow-hidden">
                        <div className="p-4 bg-[#0a0a0c] border-b border-gray-800 flex items-center gap-3">
                          <FileCode className="w-5 h-5 text-blue-400" />
                          <div className="flex-1">
                            <div className="font-semibold text-white">{file.name}</div>
                            <div className="text-xs text-gray-400">{file.path}</div>
                          </div>
                          <div className="text-sm font-bold text-red-500">
                            {file.vulnerabilities.length} issue{file.vulnerabilities.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          {file.vulnerabilities.map((vuln, idx) => {
                            const severityColors = {
                              CRITICAL: 'bg-red-500/20 border-red-500/50 text-red-400',
                              HIGH: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
                              MEDIUM: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
                              LOW: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
                              INFO: 'bg-gray-500/20 border-gray-500/50 text-gray-400'
                            };
                            return (
                              <div key={vuln.id || `${file.id}-${idx}`} className="border rounded-lg p-4 border-gray-700 hover:border-gray-600 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-1 rounded text-xs font-bold border ${severityColors[vuln.severity] || severityColors.INFO}`}>
                                        {vuln.severity}
                                      </span>
                                      <span className="text-sm font-semibold text-white">{vuln.name}</span>
                                      {vuln.ruleId && (
                                        <span className="text-xs text-gray-500 font-mono">{vuln.ruleId}</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">{vuln.description}</p>
                                    {vuln.fixSuggestion && (
                                      <div className="bg-[#0a0a0c] rounded p-3 mt-2 border border-gray-800">
                                        <div className="text-xs font-semibold text-gray-400 mb-1">Fix Suggestion:</div>
                                        <p className="text-xs text-gray-300">{vuln.fixSuggestion}</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 whitespace-nowrap">
                                    Line {vuln.lineNumber}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-700 bg-[#12141a] flex items-center justify-between gap-4">
              <button
                onClick={() => setShowResultsModal(false)}
                className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const filesWithVulns = analysisResults.files.filter(f => f.vulnerabilities && f.vulnerabilities.length > 0);
                  if (filesWithVulns.length > 0) {
                    generatePDFReport(filesWithVulns, projectName, filesWithVulns.length > 1, userName || 'User');
                    if (user) {
                      logUserActivity({
                        userId: user.uid,
                        activityType: 'report_generated',
                        activityDetails: {
                          projectName: projectName,
                          fileCount: filesWithVulns.length,
                          vulnerabilityCount: analysisResults.totalVulns
                        }
                      }).catch(err => console.error("Error logging activity:", err));
                    }
                  }
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold transition-all shadow-lg flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <div className={`rounded-xl border shadow-2xl p-4 ${
            errorNotification.type === 'error' 
              ? 'bg-red-900/90 border-red-700 text-white' 
              : errorNotification.type === 'warning'
              ? 'bg-yellow-900/90 border-yellow-700 text-white'
              : 'bg-blue-900/90 border-blue-700 text-white'
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                errorNotification.type === 'error' ? 'text-red-400' 
                : errorNotification.type === 'warning' ? 'text-yellow-400'
                : 'text-blue-400'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{errorNotification.message}</p>
                {errorNotification.action && (
                  <button
                    onClick={errorNotification.action.onClick}
                    className="mt-2 text-xs font-bold underline hover:no-underline"
                  >
                    {errorNotification.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => setErrorNotification(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Documentation Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in px-4">
          <div className="bg-[#1e1e24] border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Documentation & Troubleshooting</h2>
                  <p className="text-sm text-gray-400">WiqayaX by Scalovate Systems Solutions</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Start */}
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Quick Start</h3>
                <ol className="space-y-2 text-gray-300 text-sm">
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-400">1.</span>
                    <span>Configure your AI provider in Settings (⚙️ icon)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-400">2.</span>
                    <span>Upload files or folders using the sidebar buttons</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-400">3.</span>
                    <span>Click "ANALYZE FILE" to scan the current file, or use the play button (▶️) to scan all files</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-400">4.</span>
                    <span>Review vulnerabilities in the bottom panel and download PDF reports</span>
                  </li>
                </ol>
              </div>

              {/* Troubleshooting */}
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Troubleshooting</h3>
                <div className="space-y-4">
                  <div className="bg-[#12141a] rounded-lg p-4 border border-gray-800">
                    <h4 className="font-semibold text-white mb-2">API Key Error (401/403)</h4>
                    <ul className="text-sm text-gray-400 space-y-1 list-disc pl-5">
                      <li>Verify your API key is correct</li>
                      <li>Check API key permissions and quotas</li>
                      <li>Ensure you have credits remaining</li>
                      <li>Try regenerating your API key</li>
                    </ul>
                  </div>
                  <div className="bg-[#12141a] rounded-lg p-4 border border-gray-800">
                    <h4 className="font-semibold text-white mb-2">Ollama Connection Failed</h4>
                    <ul className="text-sm text-gray-400 space-y-1 list-disc pl-5">
                      <li>Ensure Ollama is running: <code className="bg-black/30 px-1 rounded">ollama serve</code></li>
                      <li>Enable CORS: <code className="bg-black/30 px-1 rounded">OLLAMA_ORIGINS=* ollama serve</code></li>
                      <li>Verify endpoint URL: <code className="bg-black/30 px-1 rounded">http://localhost:11434</code></li>
                      <li>Check firewall settings</li>
                      <li>Pull the model: <code className="bg-black/30 px-1 rounded">ollama pull &lt;model-name&gt;</code></li>
                    </ul>
                  </div>
                  <div className="bg-[#12141a] rounded-lg p-4 border border-gray-800">
                    <h4 className="font-semibold text-white mb-2">Analysis Takes Too Long</h4>
                    <ul className="text-sm text-gray-400 space-y-1 list-disc pl-5">
                      <li>Use smaller files or fewer files at once</li>
                      <li>Try a faster model (smaller parameter count)</li>
                      <li>Check your internet connection (for cloud APIs)</li>
                      <li>For local LLMs, ensure sufficient system resources</li>
                    </ul>
                  </div>
                  <div className="bg-[#12141a] rounded-lg p-4 border border-gray-800">
                    <h4 className="font-semibold text-white mb-2">No Vulnerabilities Found</h4>
                    <ul className="text-sm text-gray-400 space-y-1 list-disc pl-5">
                      <li>This is good! Your code may be secure</li>
                      <li>Try analyzing different files</li>
                      <li>Ensure your code has actual security patterns to detect</li>
                      <li>Check that the AI provider is working correctly</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Understanding Results */}
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Understanding Results</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-300"><strong>CRITICAL:</strong> Immediate security risks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-300"><strong>HIGH:</strong> Significant vulnerabilities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-300"><strong>MEDIUM:</strong> Moderate concerns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300"><strong>LOW:</strong> Minor issues</span>
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-400 mb-2">About WiqayaX</h3>
                <p className="text-sm text-gray-300 mb-2">
                  WiqayaX is a <strong>100% Private SAST Tool</strong> developed by <a href="https://www.scalovate.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">Scalovate Systems Solutions <ExternalLink className="w-3 h-3" /></a>.
                </p>
                <p className="text-xs text-gray-400">
                  This software is provided free of charge as part of Scalovate's Corporate Social Responsibility (CSR) initiative. All code and logic remain the property of Scalovate Systems Solutions.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};