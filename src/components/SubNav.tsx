import React, { useState } from 'react';
import { Menu, X, ChevronRight, ShieldCheck, Flame, Zap, Sparkles } from 'lucide-react';
import { Category } from '../types';
import { useAuth } from '../context/AuthContext';

interface SubNavProps {
  categories: Category[];
  currentCategory: string;
  onSelectCategory: (slug: string) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const SubNav: React.FC<SubNavProps> = ({
  categories,
  currentCategory,
  onSelectCategory,
  onNavigate,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <>
      <nav className="bg-[#232f3e] text-white text-xs font-medium px-3 sm:px-4 py-1.5 flex items-center justify-between overflow-x-auto scrollbar-none border-t border-slate-700/50">
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* All Drawer Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 py-1 px-2 rounded hover:ring-1 hover:ring-white transition-all text-white font-bold cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span>All Categories</span>
          </button>

          {/* Quick links */}
          <button
            onClick={() => {
              onSelectCategory('all');
              onNavigate('search');
            }}
            className={`py-1 px-2 rounded hover:ring-1 hover:ring-white transition-all cursor-pointer ${
              currentCategory === 'all' ? 'text-amber-400 font-bold' : 'text-slate-200'
            }`}
          >
            All Products
          </button>

          <button
            onClick={() => {
              onSelectCategory('all');
              onNavigate('search');
            }}
            className="py-1 px-2 rounded hover:ring-1 hover:ring-white transition-all text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Today's Deals</span>
          </button>

          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.slug);
                onNavigate('search');
              }}
              className={`py-1 px-2 rounded hover:ring-1 hover:ring-white transition-all whitespace-nowrap cursor-pointer ${
                currentCategory === cat.slug ? 'text-amber-400 font-bold' : 'text-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}

          <button
            onClick={() => onNavigate('wishlist')}
            className="py-1 px-2 rounded hover:ring-1 hover:ring-white transition-all text-slate-200 whitespace-nowrap cursor-pointer"
          >
            Wishlist
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="py-1 px-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ml-1 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>

        {/* Right promotional tag */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-amber-300 font-semibold shrink-0 pl-4">
          <Zap className="w-3.5 h-3.5 fill-amber-300" />
          <span>ShopSphere Great Tech Festival | No-Cost EMI Available</span>
        </div>
      </nav>

      {/* Category Side Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer content */}
          <div className="relative w-80 sm:w-96 bg-white text-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="bg-[#232f3e] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-base">Browse ShopSphere</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-md"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Shop By Category
                </h4>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      onSelectCategory('all');
                      onNavigate('search');
                      setIsDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-slate-800 hover:bg-slate-100 font-medium"
                  >
                    <span>All Products & Deals</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectCategory(c.slug);
                        onNavigate('search');
                        setIsDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-slate-800 hover:bg-slate-100 font-medium"
                    >
                      <span>{c.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Help & Settings
                </h4>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setIsDrawerOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded text-sm text-slate-800 hover:bg-slate-100"
                  >
                    Your Account
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('orders');
                      setIsDrawerOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded text-sm text-slate-800 hover:bg-slate-100"
                  >
                    Your Orders
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('wishlist');
                      setIsDrawerOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded text-sm text-slate-800 hover:bg-slate-100"
                  >
                    Your Wishlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
