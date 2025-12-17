import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Cpu, Lock, Download, Menu, X, AlertTriangle, ExternalLink, Zap, Code, Server, Database } from 'lucide-react';
import { AppRoute } from '../types';
import { LaunchModal } from './LaunchModal';
import { getCurrentUser, onAuthChange } from '../services/authService';

interface LandingPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is already logged in (local storage)
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    // Listen for auth state changes
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const navigateTo = (route: AppRoute) => {
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  const handleLaunchClick = () => {
    // Direct access - no authentication required
    // Show launch modal to configure API key and model
    setShowLaunchModal(true);
  };

  const handleLaunch = async (apiKey: string, provider: string, model: string) => {
    // Save API key and settings to localStorage
    localStorage.setItem('wiqaya_api_key', apiKey);
    localStorage.setItem('wiqaya_selected_provider', provider);
    if (model) {
      localStorage.setItem('wiqaya_selected_model', model);
    }
    
    setShowLaunchModal(false);
    setShowDisclaimer(true);
  };


  const handleProceed = () => {
    // API key and provider are already saved from LaunchModal
    // Just proceed to editor
    setShowDisclaimer(false);
    onNavigate(AppRoute.EDITOR);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#050507]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 w-full">
            <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => navigateTo(AppRoute.LANDING)}>
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform opacity-80"></div>
                <div className="absolute inset-0 bg-[#0a0a0c] rounded-xl border border-white/10 flex items-center justify-center z-10">
                    <Shield className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">WiqayaX</span>
            </div>
            
            {/* Desktop Menu Button - Visible ONLY on desktop screens (md and above) */}
            <div className="hidden md:flex shrink-0 relative items-center z-50">
              <button 
                onClick={() => setDesktopMenuOpen(!desktopMenuOpen)} 
                className="p-3 text-white hover:text-blue-400 transition-colors flex items-center justify-center bg-transparent border-none cursor-pointer outline-none focus:outline-none"
                aria-label="Desktop Menu"
                type="button"
                style={{ color: '#ffffff', minWidth: '44px', minHeight: '44px' }}
              >
                {desktopMenuOpen ? (
                  <X className="w-7 h-7" strokeWidth={2.5} style={{ color: '#ffffff' }} />
                ) : (
                  <Menu className="w-7 h-7" strokeWidth={2.5} style={{ color: '#ffffff' }} />
                )}
              </button>
              
              {/* Desktop Dropdown Menu */}
              {desktopMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/20" 
                    onClick={() => setDesktopMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#12141a] border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                    <button 
                      onClick={() => {
                        setDesktopMenuOpen(false);
                        navigateTo(AppRoute.LICENSE);
                      }}
                      className="block w-full text-left px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 hover:text-blue-400 transition-colors"
                    >
                      License
                    </button>
                    <button 
                      onClick={() => {
                        setDesktopMenuOpen(false);
                        navigateTo(AppRoute.API_GUIDE);
                      }}
                      className="block w-full text-left px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 hover:text-blue-400 transition-colors"
                    >
                      API Guide
                    </button>
                    <button 
                      onClick={() => {
                        setDesktopMenuOpen(false);
                        handleLaunchClick();
                      }}
                      className="block w-full text-left px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 hover:text-blue-400 transition-colors border-t border-gray-800"
                    >
                      Launch App
                    </button>
                    <a 
                      href="https://www.scalovate.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => setDesktopMenuOpen(false)}
                      className="block w-full text-left px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 hover:text-blue-400 transition-colors border-t border-gray-800 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> Scalovate
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button - Visible ONLY on mobile screens (below md) */}
            <div className="md:hidden shrink-0">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="p-2 text-white hover:text-blue-400"
                aria-label="Mobile Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#050507] border-b border-white/10 animate-fade-in absolute w-full">
            <div className="px-4 pt-4 pb-6 space-y-2">
              <button onClick={() => { setMobileMenuOpen(false); document.getElementById('quick-start')?.scrollIntoView({ behavior: 'smooth' }); }} className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-white hover:bg-white/10">Quick Start</button>
              <button onClick={() => { setMobileMenuOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-white hover:bg-white/10">Features</button>
              <button onClick={() => { setMobileMenuOpen(false); navigateTo(AppRoute.SUPPORT); }} className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-white hover:bg-white/10">Resources</button>
              <a 
                href="/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-white hover:bg-white/10"
              >
                License
              </a>
              <button onClick={() => { setMobileMenuOpen(false); navigateTo(AppRoute.API_GUIDE); }} className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-white hover:bg-white/10">API Guide</button>
              <a 
                href="https://www.scalovate.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-white hover:bg-white/10 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Scalovate Systems Solutions
              </a>
              <button onClick={() => { setMobileMenuOpen(false); handleLaunchClick(); }} className="mt-4 w-full text-center bg-blue-600 px-4 py-4 rounded-lg text-base font-bold text-white hover:bg-blue-500">Launch App</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/30 text-blue-400 text-sm font-semibold uppercase tracking-wider mb-8 animate-fade-in-up">
            <Shield className="w-3 h-3" /> 100% Private SAST Tool by <a href="https://www.scalovate.com" target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-300">Scalovate Systems Solutions</a>
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1] px-4">
            <span className="text-white">Secure Your Code.</span>
            <br />
            <span className="text-white">Before You Commit.</span>
          </h1>
          
          <p className="mt-6 text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed px-4">
            The first AI-native Static Application Security Testing (SAST) platform. 
            Identify critical vulnerabilities, performance bottlenecks, and logic bugs instantly using 
            your own AI API keys or local LLMs (Ollama, vLLM). <strong className="text-white font-bold">100% private. 100% free.</strong>
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 px-4">
            <button 
              onClick={handleLaunchClick}
              className="group relative flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] w-full sm:w-auto"
            >
              <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              Launch Web App
              <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">FREE</span>
            </button>
            <button 
              onClick={() => navigateTo(AppRoute.API_GUIDE)}
              className="flex items-center justify-center gap-3 bg-[#1e1e24] hover:bg-[#25252b] text-white px-8 py-4 rounded-xl text-lg font-semibold border border-white/10 transition-all w-full sm:w-auto"
            >
              <Code className="w-5 h-5 text-gray-400" />
              View API Guide
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div id="quick-start" className="py-24 bg-[#0a0a0c] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 px-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Quick Start Guide</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Get up and running in minutes with your own AI API keys or local LLM</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 px-4">
            {/* Option 1: Cloud API Keys */}
            <div className="bg-[#12141a] p-8 rounded-2xl border border-gray-800 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Option 1: Cloud API Keys</h3>
              </div>
              <ol className="space-y-4 text-gray-300 text-base">
                <li className="flex gap-3 items-start">
                  <span className="font-bold text-blue-400 shrink-0">1.</span>
                  <span>Launch the app and click "Launch App"</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-bold text-blue-400 shrink-0">2.</span>
                  <span>Click Settings (⚙️) in the activity bar</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-bold text-blue-400 shrink-0">3.</span>
                  <span>Select provider: Gemini, OpenAI, Groq, or DeepSeek</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-bold text-blue-400 shrink-0">4.</span>
                  <span>Enter your API key and select a model</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-bold text-blue-400 shrink-0">5.</span>
                  <span>Click "Save Settings" and start scanning!</span>
                </li>
              </ol>
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400 font-semibold mb-2">Get API Keys:</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Gemini: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a></li>
                  <li>• OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OpenAI Platform</a></li>
                  <li>• Groq: <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Groq Console</a></li>
                </ul>
              </div>
            </div>

            {/* Option 2: Local LLM (Ollama) */}
            <div className="bg-[#12141a] p-8 rounded-2xl border border-gray-800 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Option 2: Local LLM (Ollama)</h3>
              </div>
              <ol className="space-y-4 text-gray-300 text-base">
                <li className="flex gap-3 items-start">
                  <span className="font-bold text-green-400 shrink-0">1.</span>
                  <span>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">ollama.ai</a></span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-bold text-green-400 shrink-0">2.</span>
                  <span>Start Ollama: <code className="bg-black/30 px-2 py-1 rounded text-sm">ollama serve</code></span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-bold text-green-400 shrink-0">3.</span>
                  <span>Pull a model: <code className="bg-black/30 px-2 py-1 rounded text-sm">ollama pull llama3.2:3b</code></span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-bold text-green-400 shrink-0">4.</span>
                  <span>Enable CORS: <code className="bg-black/30 px-2 py-1 rounded text-sm">OLLAMA_ORIGINS=* ollama serve</code></span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="font-bold text-green-400 shrink-0">5.</span>
                  <span>In Settings, select "Local LLM (Ollama)" and choose your model</span>
                </li>
              </ol>
              <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 font-semibold">💡 Recommended Models:</p>
                <ul className="text-sm text-gray-400 mt-2 space-y-1">
                  <li>• llama3.2:3b (Fast, lightweight)</li>
                  <li>• codellama:7b (Code-focused)</li>
                  <li>• deepseek-coder:6.7b (Best for code analysis)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Option 3: vLLM */}
          <div className="bg-[#12141a] p-8 rounded-2xl border border-gray-800 px-4 mx-4 lg:mx-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Option 3: vLLM (Advanced)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-300 mb-4 text-base">For advanced users who want to run larger models locally:</p>
                <ol className="space-y-3 text-gray-300 text-base">
                  <li className="flex gap-3 items-start">
                    <span className="font-bold text-purple-400 shrink-0">1.</span>
                    <span>Install: <code className="bg-black/30 px-2 py-1 rounded text-sm">pip install vllm</code></span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="font-bold text-purple-400 shrink-0">2.</span>
                    <span className="break-words">Start server: <code className="bg-black/30 px-2 py-1 rounded text-xs break-all">python -m vllm.entrypoints.openai.api_server --model microsoft/Phi-3-mini-4k-instruct --port 8000</code></span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="font-bold text-purple-400 shrink-0">3.</span>
                    <span>In Settings, select "OpenAI" provider</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="font-bold text-purple-400 shrink-0">4.</span>
                    <span>Set endpoint to: <code className="bg-black/30 px-2 py-1 rounded text-sm">http://localhost:8000/v1</code></span>
                  </li>
                </ol>
              </div>
              <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-400 font-semibold mb-2">Benefits:</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✅ Run larger models (7B+) locally</li>
                  <li>✅ Better performance than Ollama</li>
                  <li>✅ Compatible with OpenAI API format</li>
                  <li>✅ Full control over model selection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="features" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
           <div className="text-center mb-16 px-4">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Security Simplified</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">No complex CI/CD pipelines to configure. No agents to install. Just pure code analysis.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
               {[
                   { icon: <Database className="w-6 h-6" />, title: "1. Upload Context", desc: "Select your project folder. WiqayaX scans the structure locally without uploading your files to any server." },
                   { icon: <Cpu className="w-6 h-6" />, title: "2. AI Analysis", desc: "Our engine sends anonymized snippets to your chosen AI (Gemini, OpenAI, or Local LLM) to find logic & security flaws." },
                   { icon: <CheckCircle className="w-6 h-6" />, title: "3. Auto-Remediation", desc: "Get specific code fixes. Apply them with one click. Download your secured project as a ZIP." }
               ].map((step, idx) => (
                   <div key={idx} className="bg-[#12141a] p-8 rounded-2xl border border-gray-800 relative group hover:border-blue-500/30 transition-all flex flex-col">
                       <div className="absolute top-0 right-0 p-4 text-6xl font-bold text-gray-800 opacity-20 pointer-events-none">{idx + 1}</div>
                       <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6 text-white shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform shrink-0">
                           {step.icon}
                       </div>
                       <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                       <p className="text-gray-400 text-base leading-relaxed flex-grow">{step.desc}</p>
                   </div>
               ))}
           </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-3xl p-12 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 px-4">Ready to Ship Secure Code?</h2>
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto px-4">Join thousands of developers using WiqayaX to prevent the next big data breach.</p>
                  <div className="flex justify-center px-4">
                      <button 
                          onClick={handleLaunchClick}
                          className="bg-white text-black px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition-colors shadow-xl w-full sm:w-auto"
                      >
                          Start Scanning Now
                      </button>
                  </div>
                  <p className="mt-6 text-sm text-gray-400">100% free. No credit card required.</p>
              </div>
          </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#020203] py-12 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center gap-2 mb-4 md:mb-0">
                    <Shield className="w-6 h-6 text-blue-600" />
                    <span className="text-xl font-bold text-white">WiqayaX</span>
                </div>
                <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                    <button 
                      onClick={() => navigateTo(AppRoute.LICENSE)} 
                      className="hover:text-white transition-colors text-white"
                    >
                      License
                    </button>
                    <button 
                      onClick={() => navigateTo(AppRoute.API_GUIDE)} 
                      className="hover:text-white transition-colors text-white"
                    >
                      API Guide
                    </button>
                    <button 
                      onClick={handleLaunchClick}
                      className="hover:text-white transition-colors text-white"
                    >
                      Launch App
                    </button>
                    <a 
                      href="https://www.scalovate.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-white transition-colors text-white flex items-center gap-1"
                    >
                      Scalovate
                      <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>
            <div className="mt-8 text-center md:text-left text-xs text-gray-600">
                <p>&copy; {new Date().getFullYear()} WiqayaX. A product of <a href="https://www.scalovate.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Scalovate Systems Solutions</a>. All rights reserved.</p>
                <p className="mt-2 text-gray-500">This software is provided free of charge as part of Scalovate's CSR initiative. See <button onClick={() => navigateTo(AppRoute.LICENSE)} className="text-blue-400 hover:underline">License</button> for terms.</p>
            </div>
        </div>
      </footer>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in px-4">
          <div className="bg-[#1e1e24] border border-gray-700 rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all scale-100 relative overflow-hidden">
            {/* Modal Header Background */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-red-500"></div>

            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center gap-3 text-white">
                 <AlertTriangle className="w-6 h-6 text-yellow-500" />
                 <h2 className="text-xl font-bold">Session Security Notice</h2>
               </div>
               <button onClick={() => setShowDisclaimer(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            
            <div className="text-gray-300 mb-6 leading-relaxed text-sm">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                <p className="text-blue-400 font-semibold mb-2">About This Software</p>
                <p className="text-gray-300 text-xs">
                  WiqayaX is provided free of charge as part of <strong>Scalovate Systems Solutions' Corporate Social Responsibility (CSR) initiative</strong> to contribute to the open source community. This software is provided "as is" without any warranties. Scalovate Systems Solutions is not responsible for any modifications made by users or any issues arising from such modifications.
                </p>
              </div>
              <p className="mb-2">
                <strong className="text-white">WiqayaX is a privacy-first tool.</strong> We do not store your code on our servers. 
                The application runs in your browser's memory.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                  <li>Any changes made will be lost if you refresh.</li>
                  <li>Please download your PDF Reports & Fixed Code before closing.</li>
                  <li>If using Local LLM (Ollama), your code never leaves this device.</li>
                  <li>All code and logic remain the property of Scalovate Systems Solutions.</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowDisclaimer(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleProceed}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold transition-all shadow-lg text-sm"
              >
                Accept & Launch
              </button>
            </div>
          </div>
          </div>
        )}

      {/* Launch Modal */}
      {showLaunchModal && (
        <LaunchModal
          onClose={() => setShowLaunchModal(false)}
          onLaunch={handleLaunch}
        />
      )}
    </div>
  );
};