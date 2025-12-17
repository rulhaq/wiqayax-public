import React from 'react';
import { Shield, ArrowLeft, ExternalLink } from 'lucide-react';
import { AppRoute } from '../types';

interface LicensePageProps {
  onNavigate: (route: AppRoute) => void;
}

export const LicensePage: React.FC<LicensePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#050507] text-white">
      {/* Header */}
      <header className="bg-[#050507]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate(AppRoute.LANDING)}>
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform opacity-80"></div>
                <div className="absolute inset-0 bg-[#0a0a0c] rounded-xl border border-white/10 flex items-center justify-center z-10">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">WiqayaX</span>
            </div>
            <button
              onClick={() => onNavigate(AppRoute.LANDING)}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-[#0a0a0c] rounded-2xl border border-white/10 p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-2 text-white">License</h1>
          <p className="text-gray-400 mb-8">MIT License - Non-Commercial Use Only</p>

          <div className="prose prose-invert max-w-none text-gray-300 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Copyright</h2>
              <p className="text-gray-300">
                Copyright (c) 2026 Scalovate Systems Solutions
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Permission</h2>
              <p className="text-gray-300 mb-4">
                Permission is hereby granted, free of charge, to any person obtaining a copy
                of this software and associated documentation files (the "Software"), to use,
                copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
                the Software, subject to the following conditions:
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Terms and Conditions</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">1. Copyright Notice</h3>
                  <p className="text-gray-300">
                    The above copyright notice and this permission notice shall be included in
                    all copies or substantial portions of the Software.
                  </p>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">2. Disclaimer of Warranty</h3>
                  <p className="text-gray-300">
                    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                    SOFTWARE.
                  </p>
                </div>

                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">3. Commercial Use Restriction</h3>
                  <p className="text-gray-300 mb-2">
                    This software is provided free of charge for personal, educational, and non-commercial use only. 
                    You may <strong className="text-white">NOT</strong> use this software, or any derivative works 
                    based on this software, for commercial purposes, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-300">
                    <li>Selling the software or any derivative works</li>
                    <li>Using the software as part of a commercial product or service</li>
                    <li>Using the software to provide commercial services to third parties</li>
                    <li>Any other commercial exploitation of the software</li>
                  </ul>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">4. Ownership</h3>
                  <p className="text-gray-300">
                    All code, logic, algorithms, and intellectual property contained
                    in this software are the exclusive property of Scalovate Systems Solutions.
                    This license does not transfer ownership of the software or any of its
                    components.
                  </p>
                </div>

                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-orange-400 mb-2">5. Modifications</h3>
                  <p className="text-gray-300">
                    Any modifications made to this software by users are made at
                    their own risk. Scalovate Systems Solutions is not responsible for any
                    issues, damages, or liabilities arising from user modifications.
                  </p>
                </div>

                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">6. Contribution</h3>
                  <p className="text-gray-300">
                    This software is provided as a contribution to the open source
                    community as part of Scalovate Systems Solutions' Corporate Social
                    Responsibility (CSR) initiative. The software is provided "as is" without any
                    warranties or guarantees.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8 pt-6 border-t border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-4">Commercial Licensing</h2>
              <p className="text-gray-300 mb-4">
                For commercial licensing inquiries, please contact Scalovate Systems Solutions at{' '}
                <a 
                  href="https://www.scalovate.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1 inline-flex"
                >
                  www.scalovate.com
                  <ExternalLink className="w-4 h-4" />
                </a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <button
              onClick={() => onNavigate(AppRoute.LANDING)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all shadow-lg"
            >
              Return to Home
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#020203] py-8 border-t border-gray-900 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-xs text-gray-600">
            <p>&copy; {new Date().getFullYear()} WiqayaX. A product of <a href="https://www.scalovate.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Scalovate Systems Solutions</a>. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

