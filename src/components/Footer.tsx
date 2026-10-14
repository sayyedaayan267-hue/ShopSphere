import React from 'react';
import { Sparkles, Globe, ShieldCheck, HeartHandshake, Truck, RotateCcw } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-16 bg-[#232f3e] text-slate-300">
      {/* 1. Value propositions banner */}
      <div className="bg-[#1a222d] border-b border-slate-700/60 py-6 px-4">
        <div className="max-w-[1300px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <Truck className="w-6 h-6 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Fast & Free Shipping</h4>
            <p className="text-[11px] text-slate-400">On all prepaid orders over ₹500</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Secure Razorpay Payments</h4>
            <p className="text-[11px] text-slate-400">256-bit encrypted checkout</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RotateCcw className="w-6 h-6 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">7-Day Easy Returns</h4>
            <p className="text-[11px] text-slate-400">Hassle-free doorstep pickup</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">24/7 Dedicated Support</h4>
            <p className="text-[11px] text-slate-400">Sphere customer satisfaction guarantee</p>
          </div>
        </div>
      </div>

      {/* 2. Back to top button */}
      <button
        onClick={scrollToTop}
        className="w-full bg-[#37475a] hover:bg-[#485769] text-white text-xs font-semibold py-3.5 text-center transition-colors cursor-pointer"
      >
        Back to top
      </button>

      {/* 3. Main Footer Links */}
      <div className="max-w-[1200px] mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs leading-relaxed">
        <div>
          <h3 className="font-bold text-white text-sm mb-3">Get to Know Us</h3>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:underline">
                About ShopSphere
              </button>
            </li>
            <li>Careers at Sphere</li>
            <li>Press Releases</li>
            <li>ShopSphere Science & Cloud</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-white text-sm mb-3">Connect with Us</h3>
          <ul className="space-y-2 text-slate-400">
            <li>Facebook</li>
            <li>Twitter (X)</li>
            <li>Instagram</li>
            <li>Sphere Community Forum</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-white text-sm mb-3">Make Money with Us</h3>
          <ul className="space-y-2 text-slate-400">
            <li>Sell on ShopSphere</li>
            <li>Become an Affiliate</li>
            <li>Fulfillment by Sphere (FBS)</li>
            <li>Advertise Your Products</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-white text-sm mb-3">Let Us Help You</h3>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button onClick={() => onNavigate('orders')} className="hover:underline">
                Your Account & Orders
              </button>
            </li>
            <li>Shipping Rates & Policies</li>
            <li>Returns & Replacements</li>
            <li>
              <button onClick={() => onNavigate('admin')} className="hover:underline text-amber-400">
                Staff & Admin Portal
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Brand Signature & Country Selector */}
      <div className="border-t border-slate-700/80 py-8 px-4 bg-[#131921] text-center">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-slate-900">
              <Sparkles className="w-3.5 h-3.5 fill-slate-900" />
            </div>
            <span className="text-lg font-black text-white">
              Shop<span className="text-amber-400">Sphere</span>
            </span>
          </button>

          <div className="flex items-center gap-3 text-xs border border-slate-600 rounded px-3 py-1.5">
            <Globe className="w-4 h-4 text-slate-400" />
            <span>English (IN)</span>
          </div>

          <div className="flex items-center gap-2 text-xs border border-slate-600 rounded px-3 py-1.5">
            <span className="text-amber-400 font-bold">₹</span>
            <span>INR - Indian Rupee</span>
          </div>

          <div className="flex items-center gap-2 text-xs border border-slate-600 rounded px-3 py-1.5">
            <span>🇮🇳 India</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          © 2026 ShopSphere India Private Limited. All rights reserved. Built with React, TypeScript, Express & PostgreSQL.
        </p>
      </div>
    </footer>
  );
};
