import React from 'react';
import { ArrowLeft, Key, Terminal, ExternalLink } from 'lucide-react';
import { AppRoute } from '../types';

interface PageProps {
  onNavigate: (route: AppRoute) => void;
}

export const ApiGuide: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-300 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => onNavigate(AppRoute.LANDING)}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        
        <h1 className="text-4xl font-bold text-white mb-4">How to Get AI API Keys</h1>
        <p className="text-lg text-gray-400 mb-10">
            WiqayaX is BYOK (Bring Your Own Key). This ensures you have full control over your data and costs. 
            Connect to top cloud providers or run completely offline with Open Source models.
        </p>
        
        <div className="space-y-12">
            
            {/* Cloud Providers */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Key className="w-6 h-6 text-blue-500" /> Cloud AI Providers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Google Gemini */}
                    <div className="bg-[#12141a] p-6 rounded-xl border border-gray-800">
                        <h3 className="text-xl font-bold text-white mb-2">Google Gemini</h3>
                        <p className="text-sm text-gray-400 mb-4">Best for large context windows and speed.</p>
                        <ol className="list-decimal pl-5 space-y-2 text-sm mb-4">
                            <li>Go to <a href="https://aistudio.google.com/" target="_blank" className="text-blue-400 hover:underline">Google AI Studio</a>.</li>
                            <li>Sign in with your Google Account.</li>
                            <li>Click "Get API Key" in the top-left sidebar.</li>
                            <li>Click "Create API Key in new project".</li>
                            <li>Copy the key starting with <code className="bg-gray-800 px-1 rounded">AIza...</code>.</li>
                        </ol>
                    </div>

                    {/* OpenAI */}
                    <div className="bg-[#12141a] p-6 rounded-xl border border-gray-800">
                        <h3 className="text-xl font-bold text-white mb-2">OpenAI (GPT-4)</h3>
                        <p className="text-sm text-gray-400 mb-4">Industry standard for reasoning capabilities.</p>
                        <ol className="list-decimal pl-5 space-y-2 text-sm mb-4">
                            <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-400 hover:underline">OpenAI Platform</a>.</li>
                            <li>Log in or Sign up.</li>
                            <li>Click "+ Create new secret key".</li>
                            <li>Name it "WiqayaX" and create it.</li>
                            <li>Copy the key starting with <code className="bg-gray-800 px-1 rounded">sk-...</code>.</li>
                        </ol>
                    </div>

                    {/* Groq */}
                    <div className="bg-[#12141a] p-6 rounded-xl border border-gray-800">
                        <h3 className="text-xl font-bold text-white mb-2">Groq</h3>
                        <p className="text-sm text-gray-400 mb-4">Fastest inference for Llama 3 & Mixtral models.</p>
                        <ol className="list-decimal pl-5 space-y-2 text-sm mb-4">
                            <li>Go to <a href="https://console.groq.com/keys" target="_blank" className="text-blue-400 hover:underline">Groq Console</a>.</li>
                            <li>Login with Email.</li>
                            <li>Click "Create API Key".</li>
                            <li>Copy the key starting with <code className="bg-gray-800 px-1 rounded">gsk_...</code>.</li>
                        </ol>
                    </div>

                     {/* DeepSeek */}
                     <div className="bg-[#12141a] p-6 rounded-xl border border-gray-800">
                        <h3 className="text-xl font-bold text-white mb-2">DeepSeek</h3>
                        <p className="text-sm text-gray-400 mb-4">Specialized coding models, extremely cost-effective.</p>
                        <ol className="list-decimal pl-5 space-y-2 text-sm mb-4">
                            <li>Visit <a href="https://platform.deepseek.com/" target="_blank" className="text-blue-400 hover:underline">DeepSeek Platform</a>.</li>
                            <li>Register and navigate to API Keys.</li>
                            <li>Create a new API Key.</li>
                            <li>Copy the key.</li>
                        </ol>
                    </div>
                </div>
            </section>

            {/* Local AI */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Terminal className="w-6 h-6 text-green-500" /> Private / Local AI Setup
                </h2>
                <div className="space-y-6">
                    {/* Ollama */}
                    <div className="bg-[#12141a] p-8 rounded-xl border border-green-900/30">
                        <h3 className="text-xl font-bold text-white mb-2">Ollama (Recommended)</h3>
                        <p className="text-gray-400 mb-4">Run Llama 3, Mistral, and other models locally on your machine. No data leaves your device.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-white text-sm mb-2">Step 1: Install Ollama</h4>
                                <p className="text-sm">Download for Mac, Linux, or Windows from <a href="https://ollama.com" target="_blank" className="text-blue-400 hover:underline">ollama.com</a>.</p>
                            </div>

                            <div>
                                <h4 className="font-bold text-white text-sm mb-2">Step 2: Pull a Model</h4>
                                <div className="bg-black p-3 rounded-lg font-mono text-sm text-green-400">
                                    ollama pull llama3
                                </div>
                                <p className="text-xs text-gray-500 mt-1">We recommend <code className="text-gray-300">llama3</code> or <code className="text-gray-300">mistral</code> for best results.</p>
                            </div>

                            <div>
                                <h4 className="font-bold text-white text-sm mb-2">Step 3: Run with CORS Enabled (Crucial)</h4>
                                <p className="text-sm mb-2">By default, browsers block web apps from talking to local servers. You must enable CORS:</p>
                                <div className="bg-black p-3 rounded-lg font-mono text-sm text-green-400 mb-2">
                                    # macOS / Linux<br/>
                                    OLLAMA_ORIGINS="*" ollama serve
                                </div>
                                <div className="bg-black p-3 rounded-lg font-mono text-sm text-green-400">
                                    # Windows PowerShell<br/>
                                    $env:OLLAMA_ORIGINS="*"; ollama serve
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* vLLM */}
                    <div className="bg-[#12141a] p-8 rounded-xl border border-gray-800">
                        <h3 className="text-xl font-bold text-white mb-2">vLLM / LM Studio</h3>
                        <p className="text-gray-400 mb-4">If you use other OpenAI-compatible local servers like vLLM or LM Studio.</p>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Ensure the server is running on <code className="bg-gray-800 px-1 rounded">http://localhost:1234</code> (or similar).</li>
                            <li>In WiqayaX Settings, select "Ollama" (or generic local) and change the endpoint URL to match your server.</li>
                        </ul>
                    </div>
                </div>
            </section>

        </div>
      </div>
    </div>
  );
};