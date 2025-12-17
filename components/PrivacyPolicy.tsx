import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppRoute } from '../types';

interface PageProps {
  onNavigate: (route: AppRoute) => void;
}

export const PrivacyPolicy: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-300 p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => onNavigate(AppRoute.LANDING)}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>Welcome to Wiqaya. We value your privacy and are committed to protecting your personal information and code integrity. This Privacy Policy explains how Scalovate Systems Solutions ("we", "us", "our") collects, uses, and safeguards your information when you use our Wiqaya application.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Data Processing</h2>
            <p>Wiqaya is designed with a privacy-first approach. When using the application:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Source Code:</strong> Your source code is processed to identify vulnerabilities. If you use local LLMs (like Ollama), your code never leaves your machine. If you use cloud providers (Gemini, OpenAI, Claude), code snippets are sent to their respective APIs solely for analysis and are not stored by us.</li>
              <li><strong>API Keys:</strong> API keys provided in the settings are stored only in your browser's temporary memory and are never transmitted to our servers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Retention</h2>
            <p>We do not store your source code or analysis reports on our servers. All analysis results are generated in real-time and delivered directly to your browser.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at support@scalovate.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
};