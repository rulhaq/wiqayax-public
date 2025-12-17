import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Shield, Check, Loader2, Lock } from 'lucide-react';
import { AppRoute } from '../types';

interface PageProps {
  onNavigate: (route: AppRoute) => void;
}

export const CheckoutPage: React.FC<PageProps> = ({ onNavigate }) => {
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'skipcash'>('paypal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if(!email) return;

    setIsProcessing(true);
    // Simulate API call for payment processing
    setTimeout(() => {
        setIsProcessing(false);
        onNavigate(AppRoute.CHECKOUT_SUCCESS);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans flex flex-col">
       {/* Simple Header */}
       <div className="border-b border-gray-800 p-4">
           <div className="max-w-5xl mx-auto flex items-center gap-3">
               <button onClick={() => onNavigate(AppRoute.PRICING)} className="text-gray-400 hover:text-white">
                   <ArrowLeft className="w-5 h-5" />
               </button>
               <span className="font-bold text-xl tracking-tight">WiqayaX Secure Checkout</span>
               <div className="ml-auto flex items-center gap-2 text-green-500 text-sm">
                   <Lock className="w-4 h-4" /> 256-bit SSL Encrypted
               </div>
           </div>
       </div>

       <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
           
           {/* Order Summary (Left) */}
           <div className="md:col-span-1 order-2 md:order-1">
               <div className="bg-[#12141a] rounded-xl border border-gray-800 p-6">
                   <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                   <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-800">
                       <div>
                           <div className="font-medium">WiqayaX Lifetime License</div>
                           <div className="text-sm text-gray-500">Pro Edition</div>
                       </div>
                       <div className="font-bold">$299.00</div>
                   </div>
                   <div className="space-y-2 text-sm text-gray-400 mb-4 pb-4 border-b border-gray-800">
                       <div className="flex justify-between">
                           <span>Subtotal</span>
                           <span>$299.00</span>
                       </div>
                       <div className="flex justify-between">
                           <span>Tax (0%)</span>
                           <span>$0.00</span>
                       </div>
                   </div>
                   <div className="flex justify-between items-center text-xl font-bold mb-6">
                       <span>Total</span>
                       <span>$299.00</span>
                   </div>
                   <div className="bg-blue-900/20 text-blue-200 text-xs p-3 rounded flex gap-2">
                       <Shield className="w-4 h-4 shrink-0" />
                       <span>30-Day Money Back Guarantee included with your purchase.</span>
                   </div>
               </div>
           </div>

           {/* Payment Form (Right) */}
           <div className="md:col-span-2 order-1 md:order-2">
               <div className="bg-[#12141a] rounded-xl border border-gray-800 p-8">
                   <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
                   
                   <form onSubmit={handlePayment}>
                       <div className="mb-6">
                           <label className="block text-sm font-medium text-gray-400 mb-2">Email Address (for Invoice & License)</label>
                           <input 
                               type="email" 
                               required
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                               placeholder="you@company.com"
                               className="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                           />
                       </div>

                       <div className="mb-8">
                           <label className="block text-sm font-medium text-gray-400 mb-3">Select Payment Method</label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <button
                                   type="button"
                                   onClick={() => setPaymentMethod('paypal')}
                                   className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${paymentMethod === 'paypal' ? 'bg-blue-900/20 border-blue-500 ring-1 ring-blue-500' : 'bg-[#0a0a0c] border-gray-700 hover:border-gray-600'}`}
                               >
                                   <div className="font-bold italic text-white"><span className="text-[#003087]">Pay</span><span className="text-[#009cde]">Pal</span></div>
                                   {paymentMethod === 'paypal' && <Check className="w-5 h-5 text-blue-500 ml-auto" />}
                               </button>

                               <button
                                   type="button"
                                   onClick={() => setPaymentMethod('skipcash')}
                                   className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${paymentMethod === 'skipcash' ? 'bg-pink-900/20 border-pink-500 ring-1 ring-pink-500' : 'bg-[#0a0a0c] border-gray-700 hover:border-gray-600'}`}
                               >
                                   <div className="font-bold text-pink-500">SkipCash</div>
                                   {paymentMethod === 'skipcash' && <Check className="w-5 h-5 text-pink-500 ml-auto" />}
                               </button>
                           </div>
                       </div>

                       <button 
                           type="submit" 
                           disabled={isProcessing}
                           className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                       >
                           {isProcessing ? (
                               <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...
                               </>
                           ) : (
                               <>
                                Pay $299.00
                               </>
                           )}
                       </button>
                       <p className="text-center text-xs text-gray-500 mt-4">
                           By continuing, you agree to our Terms of Service. Payment is processed securely via {paymentMethod === 'paypal' ? 'PayPal' : 'SkipCash'}.
                       </p>
                   </form>
               </div>
           </div>
       </div>
    </div>
  );
};