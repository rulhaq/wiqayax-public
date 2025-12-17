import React from 'react';
import { ArrowLeft, Check, Download, Shield, Rocket } from 'lucide-react';
import { AppRoute } from '../types';

interface PageProps {
  onNavigate: (route: AppRoute) => void;
}

export const PricingPage: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <button 
             onClick={() => onNavigate(AppRoute.LANDING)}
             className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
           >
             <ArrowLeft className="w-5 h-5" /> Back to Home
           </button>
           <span className="font-bold text-lg">Wiqaya Pricing</span>
        </div>
      </nav>

      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16 max-w-2xl mx-auto">
             <h1 className="text-4xl md:text-5xl font-bold mb-6">100% Free. Full Functionality.</h1>
             <p className="text-xl text-gray-400">WiqayaX is completely free to use. All features, unlimited scans, no credit card required.</p>
           </div>

           <div className="max-w-3xl mx-auto">
                {/* Free Plan - Full Features */}
                <div className="bg-gradient-to-br from-[#0f1117] to-[#181a1f] p-10 rounded-3xl border-2 border-blue-500/50 flex flex-col relative overflow-hidden shadow-[0_0_60px_rgba(37,99,235,0.2)] transition-transform hover:-translate-y-2 duration-300">
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">Free Forever</div>
                    <div className="text-center mb-8">
                        <h3 className="text-3xl font-bold text-white mb-2">Complete Access</h3>
                        <p className="text-gray-400">Everything you need to secure your code</p>
                    </div>
                    <div className="text-center mb-8">
                        <span className="text-6xl font-bold text-white">$0</span>
                        <span className="text-gray-400 text-xl ml-2">forever</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">Unlimited Projects</span>
                                <p className="text-xs text-gray-400">Scan as many projects as you want</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">Full AI Analysis</span>
                                <p className="text-xs text-gray-400">All AI models supported</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">PDF Reports</span>
                                <p className="text-xs text-gray-400">Professional vulnerability reports</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">50+ Languages</span>
                                <p className="text-xs text-gray-400">Python, JS, Go, Rust, and more</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">Security Scanning</span>
                                <p className="text-xs text-gray-400">CVE, CWE, OWASP Top 10</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">Performance Analysis</span>
                                <p className="text-xs text-gray-400">Find bottlenecks & optimizations</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">Auto-Fix Suggestions</span>
                                <p className="text-xs text-gray-400">AI-powered code fixes</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">Local LLM Support</span>
                                <p className="text-xs text-gray-400">Use Ollama for privacy</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">Bring Your Own API Key</span>
                                <p className="text-xs text-gray-400">Use your OpenAI, Gemini, or Groq key</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">No Code Storage</span>
                                <p className="text-xs text-gray-400">100% private, runs in browser</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">Project History</span>
                                <p className="text-xs text-gray-400">Track your scans & reports</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-white">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5"><Check className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <span className="font-semibold">Export & Download</span>
                                <p className="text-xs text-gray-400">ZIP files & PDF reports</p>
                            </div>
                        </div>
                    </div>

                    <button 
                         onClick={() => onNavigate(AppRoute.EDITOR)}
                         className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                    >
                        <Rocket className="w-5 h-5" /> Start Using WiqayaX Free
                    </button>
                    
                    <p className="text-center text-xs text-gray-500 mt-4">No credit card • No trial limits • No hidden fees</p>
                </div>
            </div>

            <div className="mt-20 text-center border-t border-gray-800 pt-10">
                <h3 className="text-xl font-semibold mb-6">Frequently Asked Questions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                    <div>
                        <h4 className="font-medium text-white mb-2">Is WiqayaX really free?</h4>
                        <p className="text-gray-400 text-sm">Yes! WiqayaX is completely free to use with full functionality. No trial periods, no feature limitations, no credit card required. Forever free.</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-white mb-2">Can I use my own API keys?</h4>
                        <p className="text-gray-400 text-sm">Absolutely! WiqayaX lets you use your own OpenAI, Google Gemini, Groq, DeepSeek, or Ollama API keys. You control your costs and privacy.</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-white mb-2">Is my code stored anywhere?</h4>
                        <p className="text-gray-400 text-sm">No. WiqayaX runs entirely in your browser. Your code never leaves your device. We only store project metadata (name, file count) if you're logged in.</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-white mb-2">What languages are supported?</h4>
                        <p className="text-gray-400 text-sm">WiqayaX supports 50+ languages including Python, JavaScript, TypeScript, Go, Rust, Java, C/C++, and more. If it's code, we can analyze it.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};