import React, { useState } from 'react';
import { ArrowLeft, Book, Zap, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { AppRoute } from '../types';

interface PageProps {
  onNavigate: (route: AppRoute) => void;
}

const AccordionItem = ({ title, children, isOpen, onClick }: any) => {
    return (
        <div className="border border-gray-800 rounded-lg bg-[#12141a] overflow-hidden">
            <button 
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors"
                onClick={onClick}
            >
                <span className="font-semibold text-gray-200">{title}</span>
                {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-800 text-gray-400 text-sm leading-relaxed bg-[#0f1117]">
                    {children}
                </div>
            )}
        </div>
    );
};

export const HelpCenter: React.FC<PageProps> = ({ onNavigate }) => {
    const [openSection, setOpenSection] = useState<string | null>('quickstart');

    const toggle = (id: string) => {
        setOpenSection(openSection === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
            <div className="max-w-4xl mx-auto p-8">
                <button 
                    onClick={() => onNavigate(AppRoute.LANDING)}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-400 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </button>

                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold mb-4">WiqayaX Help Center</h1>
                    <p className="text-gray-400">Everything you need to deploy, configure, and secure your code.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 mb-12 max-w-md mx-auto">
                    <div className="bg-[#12141a] p-6 rounded-xl border border-gray-800 flex flex-col items-center text-center hover:border-blue-600/50 transition-colors cursor-pointer" onClick={() => toggle('quickstart')}>
                        <div className="w-12 h-12 bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="font-semibold mb-2">Quick Start</h3>
                        <p className="text-sm text-gray-400">Get up and running with WiqayaX in less than 5 minutes.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Book className="w-6 h-6 text-blue-500" /> Documentation
                    </h2>

                    <AccordionItem 
                        title="Quick Start Guide" 
                        isOpen={openSection === 'quickstart'}
                        onClick={() => toggle('quickstart')}
                    >
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-white font-semibold mb-3 text-base">Step 1: Sign Up / Sign In</h3>
                                <p className="mb-2">Create your free WiqayaX account:</p>
                                <ol className="list-decimal pl-5 space-y-2">
                                    <li>Click <strong>"Sign In"</strong> on the landing page</li>
                                    <li>Choose to sign in with <strong>Google</strong> or <strong>Email/Password</strong></li>
                                    <li>If using email, verify your email address (check your inbox)</li>
                                    <li>Once signed in, you'll see your username in the top navigation</li>
                                </ol>
                            </div>

                            <div>
                                <h3 className="text-white font-semibold mb-3 text-base">Step 2: Get Your AI API Key</h3>
                                <p className="mb-2">WiqayaX uses your own AI API keys (BYOK - Bring Your Own Key). Choose one:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Google Gemini:</strong> Free tier available at <a href="https://aistudio.google.com/" target="_blank" className="text-blue-400 underline">Google AI Studio</a></li>
                                    <li><strong>OpenAI:</strong> Get API key from <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-400 underline">OpenAI Platform</a></li>
                                    <li><strong>Groq:</strong> Free tier at <a href="https://console.groq.com/" target="_blank" className="text-blue-400 underline">Groq Console</a></li>
                                    <li><strong>DeepSeek:</strong> Get key from <a href="https://platform.deepseek.com/" target="_blank" className="text-blue-400 underline">DeepSeek Platform</a></li>
                                    <li><strong>Ollama (Local):</strong> Run AI locally for complete privacy - see "Connecting Local LLMs" section</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-white font-semibold mb-3 text-base">Step 3: Launch the App</h3>
                                <ol className="list-decimal pl-5 space-y-2">
                                    <li>Click <strong>"Launch Web App"</strong> from the home page</li>
                                    <li>Enter your API key when prompted (or use saved key from profile)</li>
                                    <li>Select your AI provider (Gemini, OpenAI, Groq, DeepSeek, or Ollama)</li>
                                    <li>Choose your preferred model from the dropdown</li>
                                    <li>Click <strong>"Start Analyzing"</strong> to enter the editor</li>
                                </ol>
                            </div>

                            <div>
                                <h3 className="text-white font-semibold mb-3 text-base">Step 4: Upload Your Code</h3>
                                <ol className="list-decimal pl-5 space-y-2">
                                    <li>In the editor, click <strong>"Open File / Folder"</strong> button</li>
                                    <li>Select a single file or entire folder from your computer</li>
                                    <li>Your code will appear in the file explorer on the left</li>
                                    <li><strong>Note:</strong> Only one project can be analyzed at a time. Uploading a new project will replace the current one.</li>
                                </ol>
                            </div>

                            <div>
                                <h3 className="text-white font-semibold mb-3 text-base">Step 5: Run Security Analysis</h3>
                                <ol className="list-decimal pl-5 space-y-2">
                                    <li>Click <strong>"Analyze All"</strong> button next to your project name in the explorer</li>
                                    <li>Or click <strong>"Analyze"</strong> on individual files</li>
                                    <li>Wait for analysis to complete (progress shown in status bar)</li>
                                    <li>View results in the right sidebar - vulnerabilities are highlighted by severity</li>
                                    <li>Click on any file to see detailed vulnerability information</li>
                                </ol>
                            </div>

                            <div>
                                <h3 className="text-white font-semibold mb-3 text-base">Step 6: Download Reports</h3>
                                <ol className="list-decimal pl-5 space-y-2">
                                    <li>After analysis completes, a results modal will appear</li>
                                    <li>Click <strong>"Download Report"</strong> to get a PDF report</li>
                                    <li>Or use <strong>"Project Report"</strong> button in the editor for comprehensive PDF</li>
                                    <li>Download your code files as a ZIP if needed</li>
                                </ol>
                            </div>

                            <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4 mt-4">
                                <p className="text-blue-300 text-sm"><strong>💡 Pro Tip:</strong> Save your API key in your profile settings for faster access. Go to your username dropdown → Profile → Save API Key.</p>
                            </div>
                        </div>
                    </AccordionItem>

                    <AccordionItem 
                        title="Connecting Local LLMs (Ollama)" 
                        isOpen={openSection === 'ollama'}
                        onClick={() => toggle('ollama')}
                    >
                        <p className="mb-2">To use WiqayaX with Ollama for privacy-first, offline scanning:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Install Ollama from <a href="https://ollama.com" target="_blank" className="text-blue-400 underline">ollama.com</a>.</li>
                            <li>Run <code className="bg-black px-2 py-1 rounded text-green-400">ollama pull llama3</code> in your terminal.</li>
                            <li><strong>Crucial Step:</strong> Start Ollama with CORS enabled so the web app can talk to it:
                                <code className="block bg-black p-2 mt-1 rounded text-green-400">OLLAMA_ORIGINS="*" ollama serve</code>
                            </li>
                            <li>In WiqayaX Settings, select "Ollama" and ensure the endpoint is <code className="bg-gray-900 px-1 rounded">http://localhost:11434</code>.</li>
                        </ul>
                    </AccordionItem>

                    <AccordionItem 
                        title="Understanding Severity Levels" 
                        isOpen={openSection === 'severity'}
                        onClick={() => toggle('severity')}
                    >
                        <ul className="space-y-2">
                            <li><span className="text-red-500 font-bold">CRITICAL:</span> Immediate threat. Remote Code Execution, SQL Injection, hardcoded secrets. Fix immediately.</li>
                            <li><span className="text-orange-500 font-bold">HIGH:</span> Significant risk. XSS, broken access control.</li>
                            <li><span className="text-yellow-500 font-bold">MEDIUM:</span> Configuration issues, lack of HTTPS, weak crypto.</li>
                            <li><span className="text-blue-500 font-bold">LOW:</span> Best practices, code style, minor logic bugs.</li>
                        </ul>
                    </AccordionItem>

                    <AccordionItem 
                        title="Troubleshooting API Errors" 
                        isOpen={openSection === 'errors'}
                        onClick={() => toggle('errors')}
                    >
                        <p>If you receive an API error:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Check your internet connection.</li>
                            <li>Verify your API Key in Settings is correct and has quota remaining.</li>
                            <li>If using Gemini, ensure you are in a supported region.</li>
                            <li>If using Ollama, ensure the local server is running and <code className="bg-gray-900 px-1 rounded">OLLAMA_ORIGINS</code> is set.</li>
                        </ul>
                    </AccordionItem>
                </div>

                <div className="mt-12 p-6 bg-blue-900/20 rounded-xl border border-blue-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-lg mb-1">Still need help?</h3>
                        <p className="text-sm text-gray-400">WiqayaX is completely free to use. Our support team is here to help you get the most out of the platform.</p>
                    </div>
                    <a 
                        href="mailto:support@scalovate.com?Subject=WiqayaX-query"
                        className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
};
