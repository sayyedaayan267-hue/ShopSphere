import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  MapPin,
  ChevronDown,
  User as UserIcon,
  Heart,
  Package,
  ShieldCheck,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { LocationModal } from './LocationModal';
import { Category, Product } from '../types';
import { api } from '../services/api';

interface HeaderProps {
  categories: Category[];
  currentCategory: string;
  onSelectCategory: (slug: string) => void;
  onSearch: (query: string, category: string) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  currentCategory,
  onSelectCategory,
  onSearch,
  onNavigate,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { cart } = useCart();
  const { items: wishlistItems } = useWishlist();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState(currentCategory || 'all');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<{ city: string; pincode: string }>({
    city: 'Bengaluru',
    pincode: '560001',
  });
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync category prop
  useEffect(() => {
    setSelectedCat(currentCategory || 'all');
  }, [currentCategory]);

  // Load saved location from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('shopsphere_location');
    if (saved) {
      try {
        setDeliveryLocation(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleSaveLocation = (loc: { city: string; pincode: string }) => {
    setDeliveryLocation(loc);
    localStorage.setItem('shopsphere_location', JSON.stringify(loc));
  };

  // Live autocomplete suggestions
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const delay = setTimeout(async () => {
        try {
          const res = await api.products.getSuggestions(searchTerm);
          if (res.success) {
            setSuggestions(res.suggestions || []);
            setShowSuggestions(true);
          }
        } catch {
          setSuggestions([]);
        }
      }, 250);
      return () => clearTimeout(delay);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(searchTerm, selectedCat);
  };

  return (
    <>
      <header className="bg-[#131921] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* 1. ShopSphere Brand Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 p-1.5 rounded hover:ring-1 hover:ring-white transition-all text-left shrink-0 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-900 shadow-inner">
              <Sparkles className="w-4 h-4 fill-slate-900" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center text-xl font-black tracking-tight leading-none text-white">
                Shop<span className="text-amber-400">Sphere</span>
              </div>
              <span className="text-[10px] text-amber-300/80 tracking-widest uppercase font-semibold">
                .in
              </span>
            </div>
          </button>

          {/* 2. Deliver To Location Selector */}
          <button
            onClick={() => setIsLocationOpen(true)}
            className="hidden md:flex items-center gap-1.5 p-1.5 rounded hover:ring-1 hover:ring-white transition-all text-left shrink-0 cursor-pointer text-slate-300"
          >
            <MapPin className="w-4 h-4 text-white mt-2" />
            <div className="flex flex-col text-xs leading-tight">
              <span className="text-slate-400 text-[11px]">
                Deliver to {user ? user.name.split(' ')[0] : 'Guest'}
              </span>
              <span className="font-bold text-white text-[13px]">
                {deliveryLocation.city} {deliveryLocation.pincode}
              </span>
            </div>
          </button>

          {/* 3. Search Bar with Category Dropdown */}
          <div ref={searchContainerRef} className="flex-1 relative max-w-3xl">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-stretch rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-amber-500 shadow-inner"
            >
              {/* Category selector */}
              <div className="relative bg-slate-100 border-r border-slate-300 shrink-0">
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="h-10 pl-3 pr-7 text-xs bg-slate-100 text-slate-800 font-medium appearance-none focus:outline-none cursor-pointer"
                >
                  <option value="all">All</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute right-2 top-3 pointer-events-none" />
              </div>

              {/* Input */}
              <div className="flex-1 relative flex items-center bg-white">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Search ShopSphere products, brands and tech..."
                  className="w-full h-10 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 mr-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Search"
              >
                <Search className="w-5 h-5 text-slate-900" />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white text-slate-900 rounded-md shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-100">
                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Suggested Products</span>
                  <span>Press Enter to search</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                        onNavigate('product', p.slug);
                      }}
                      className="w-full text-left p-2.5 hover:bg-amber-50/70 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      {p.images?.[0]?.url ? (
                        <img
                          src={p.images[0].url}
                          alt={p.title}
                          className="w-9 h-9 object-cover rounded shrink-0 bg-slate-50"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs">
                          Img
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{p.brand}</span>
                          <span className="font-bold text-amber-700">
                            ₹{p.price.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Right Utility Section */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Account & Lists Menu */}
            <div
              className="relative"
              onMouseEnter={() => setShowAccountMenu(true)}
              onMouseLeave={() => setShowAccountMenu(false)}
            >
              <button
                onClick={() => {
                  if (!user) onNavigate('login');
                  else onNavigate('profile');
                }}
                className="flex items-center gap-1 p-1.5 rounded hover:ring-1 hover:ring-white transition-all text-left cursor-pointer"
              >
                <div className="flex flex-col text-xs leading-tight">
                  <span className="text-slate-300 text-[11px]">
                    Hello, {user ? user.name.split(' ')[0] : 'Sign In'}
                  </span>
                  <span className="font-bold text-white text-[13px] flex items-center gap-0.5">
                    Account & Lists
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </span>
                </div>
              </button>

              {/* Dropdown Card */}
              {showAccountMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {!user ? (
                    <div className="text-center pb-3 border-b border-slate-100">
                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          onNavigate('login');
                        }}
                        className="w-full bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold py-2 rounded text-xs transition-all shadow-xs cursor-pointer"
                      >
                        Sign In
                      </button>
                      <p className="text-[11px] text-slate-500 mt-2">
                        New customer?{' '}
                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            onNavigate('register');
                          }}
                          className="text-amber-700 font-semibold hover:underline"
                        >
                          Start here.
                        </button>
                      </p>
                    </div>
                  ) : (
                    <div className="pb-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded uppercase tracking-wider">
                          Administrator
                        </span>
                      )}
                    </div>
                  )}

                  <div className="py-2 text-xs space-y-1">
                    <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider px-2 py-1">
                      Your Account
                    </p>
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        onNavigate('profile');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-700 font-medium"
                    >
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      Account Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        onNavigate('orders');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-700 font-medium"
                    >
                      <Package className="w-4 h-4 text-slate-500" />
                      Your Orders
                    </button>
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        onNavigate('wishlist');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-700 font-medium"
                    >
                      <Heart className="w-4 h-4 text-slate-500" />
                      Your Wishlist ({wishlistItems.length})
                    </button>
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        onNavigate('addresses');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-700 font-medium"
                    >
                      <MapPin className="w-4 h-4 text-slate-500" />
                      Delivery Addresses
                    </button>

                    {isAdmin && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            onNavigate('admin');
                          }}
                          className="w-full text-left px-2 py-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-700" />
                          Admin Console
                        </button>
                      </div>
                    )}

                    {user && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={async () => {
                            setShowAccountMenu(false);
                            await logout();
                            onNavigate('home');
                          }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-50 text-rose-700 font-medium flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Returns & Orders */}
            <button
              onClick={() => onNavigate('orders')}
              className="hidden sm:flex flex-col text-xs leading-tight p-1.5 rounded hover:ring-1 hover:ring-white transition-all text-left cursor-pointer"
            >
              <span className="text-slate-300 text-[11px]">Returns</span>
              <span className="font-bold text-white text-[13px]">& Orders</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => onNavigate('cart')}
              className="flex items-center gap-1.5 p-1.5 rounded hover:ring-1 hover:ring-white transition-all cursor-pointer relative"
              title="Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-7 h-7 text-white" />
                <span className="absolute -top-1.5 left-3.5 bg-amber-400 text-slate-900 font-extrabold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {cart.itemsCount}
                </span>
              </div>
              <span className="font-bold text-[13px] text-white hidden md:inline mt-2">
                Cart
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        currentLocation={deliveryLocation}
        onSelectLocation={handleSaveLocation}
      />
    </>
  );
};
