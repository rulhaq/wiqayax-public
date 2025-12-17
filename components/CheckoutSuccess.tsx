import React from 'react';
import { CheckCircle, Download, ArrowRight, FileText } from 'lucide-react';
import { AppRoute } from '../types';

interface PageProps {
  onNavigate: (route: AppRoute) => void;
}

export const CheckoutSuccess: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans flex items-center justify-center p-4">
        <div className="bg-[#12141a] max-w-lg w-full rounded-2xl border border-gray-800 p-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-gray-400 mb-8">Thank you for purchasing WiqayaX Pro. Your license has been activated.</p>

            <div className="bg-[#0f1117] p-4 rounded-lg border border-gray-800 text-left mb-8">
                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Your License Key</p>
                <code className="block bg-black p-3 rounded border border-gray-700 text-green-400 font-mono text-center text-lg tracking-wider select-all">
                    WQX-PRO-8829-KLA9-22M1
                </code>
                <p className="text-xs text-gray-500 mt-2 text-center">A copy of the invoice and license key has been sent to your email.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => {}}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
                >
                    <FileText className="w-4 h-4" /> Invoice
                </button>
                 <button 
                    onClick={() => onNavigate(AppRoute.EDITOR)}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-900/20"
                >
                    Launch App <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
  );
};