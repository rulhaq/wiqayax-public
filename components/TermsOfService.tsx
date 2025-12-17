import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppRoute } from '../types';

interface PageProps {
  onNavigate: (route: AppRoute) => void;
}

export const TermsOfService: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-300 p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => onNavigate(AppRoute.LANDING)}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Agreement to Terms</h2>
            <p>By downloading or using Wiqaya, a product of Scalovate Systems Solutions, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our software.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. License</h2>
            <p>We grant you a revocable, non-exclusive, non-transferable, limited license to download, install, and use the application strictly in accordance with the terms of this Agreement.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Use of AI Providers</h2>
            <p>The application allows integration with third-party AI providers (Google Gemini, OpenAI, etc.). You acknowledge that you are responsible for complying with the terms of service of any third-party provider you connect to. We are not responsible for the availability or accuracy of third-party AI services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Disclaimer</h2>
            <p>Wiqaya is provided "AS IS". While we strive to identify security vulnerabilities accurately, we do not guarantee that the application will detect all security flaws. You maintain full responsibility for the security of your code and applications.</p>
          </section>
           <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Ownership</h2>
            <p>Wiqaya and all related intellectual property rights are the exclusive property of Scalovate Systems Solutions.</p>
          </section>
        </div>
      </div>
    </div>
  );
};