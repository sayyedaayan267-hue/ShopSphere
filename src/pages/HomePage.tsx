import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  ArrowRight,
  Flame,
  Clock,
  Shield,
} from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';

interface HomePageProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
  onNavigate: (page: string, param?: string) => void;
}

const HERO_SLIDES = [
  {
    title: 'The Great Sphere Electronics Festival',
    subtitle: 'Up to 50% Off Flagship Smartphones, ANC Headphones & OLED Monitors',
    cta: 'Explore Top Tech Deals',
    category: 'electronics',
    bg: 'from-slate-950 via-slate-900 to-indigo-950',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    tag: 'FESTIVE SPECIAL',
  },
  {
    title: 'Studio Grade Audio & Smart Living',
    subtitle: 'Immerse in Spatial Sound with AuraSound Zenith & SonicPulse Wireless',
    cta: 'Shop Premium Audio',
    category: 'audio',
    bg: 'from-amber-950 via-slate-900 to-slate-950',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    tag: 'NEW ARRIVALS',
  },
  {
    title: 'Modern Kitchen & Home Automation',
    subtitle: 'Transform your space with Italian espresso systems & robotic cleaning',
    cta: 'Discover Home Comforts',
    category: 'home-kitchen',
    bg: 'from-slate-900 via-stone-900 to-slate-950',
    image: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?auto=format&fit=crop&w=1200&q=80',
    tag: 'BEST SELLERS',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  onSelectCategory,
  onNavigate,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredDeals, setFeaturedDeals] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto rotate hero slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Fetch featured lists
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.products.getFeatured();
        if (res.success) {
          setFeaturedDeals(res.featuredDeals || []);
          setTopRated(res.topRated || []);
          setNewArrivals(res.newArrivals || []);
        }
      } catch (err) {
        console.error('Failed to load home products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-[#eaeded] pb-12">
      {/* 1. Hero Promotional Carousel */}
      <div className="relative w-full overflow-hidden bg-slate-950">
        <div
          className={`relative h-[340px] sm:h-[420px] lg:h-[480px] bg-gradient-to-r ${slide.bg} transition-all duration-700 flex items-center`}
        >
          {/* Background image preview with soft gradient overlay */}
          <div className="absolute inset-0 opacity-25 mix-blend-overlay">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative max-w-[1400px] mx-auto px-6 sm:px-12 w-full flex items-center justify-between z-10">
            <div className="max-w-xl text-white space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-400 text-slate-950 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                {slide.tag}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
                {slide.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                {slide.subtitle}
              </p>
              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={() => {
                    onSelectCategory(slide.category);
                    onNavigate('search');
                  }}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold px-6 py-3 rounded-full text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer group"
                >
                  <span>{slide.cta}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Slide Hero Product Preview Card */}
            <div className="hidden lg:block w-96 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
              <img
                src={slide.image}
                alt="Highlight"
                className="w-full h-64 object-cover rounded-xl shadow-inner"
              />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-200">
                <span className="font-semibold text-amber-300">Exclusive Deals</span>
                <span>Fast Sphere+ Delivery</span>
              </div>
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
            }
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors cursor-pointer"
            title="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors cursor-pointer"
            title="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Carousel Dots */}
          <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? 'w-8 bg-amber-400' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Amazon-style bottom gradient fading into content */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#eaeded] to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="max-w-[1460px] mx-auto px-4 relative -mt-16 sm:-mt-24 z-20 space-y-8">
        {/* 2. Amazon-style Quad Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Electronics */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Upgrade your tech setup</h2>
              <div
                onClick={() => {
                  onSelectCategory('electronics');
                  onNavigate('search');
                }}
                className="cursor-pointer group"
              >
                <div className="aspect-4/3 rounded-md overflow-hidden bg-slate-100 mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80"
                    alt="Electronics"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-xs text-slate-600 mb-1">
                  Explore flagship 5G phones, creator laptops, and 4K gaming screens.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onSelectCategory('electronics');
                onNavigate('search');
              }}
              className="text-xs font-semibold text-sky-700 hover:text-amber-700 hover:underline text-left mt-3"
            >
              See all tech deals
            </button>
          </div>

          {/* Card 2: Audio & Acoustics */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Noise Cancelling & Audio</h2>
              <div
                onClick={() => {
                  onSelectCategory('audio');
                  onNavigate('search');
                }}
                className="cursor-pointer group"
              >
                <div className="aspect-4/3 rounded-md overflow-hidden bg-slate-100 mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
                    alt="Audio"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-xs text-slate-600 mb-1">
                  High-fidelity wireless headphones and earbuds with spatial acoustic tracking.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onSelectCategory('audio');
                onNavigate('search');
              }}
              className="text-xs font-semibold text-sky-700 hover:text-amber-700 hover:underline text-left mt-3"
            >
              Shop headphones & audio
            </button>
          </div>

          {/* Card 3: Home & Living */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Home & Barista Appliances</h2>
              <div
                onClick={() => {
                  onSelectCategory('home-kitchen');
                  onNavigate('search');
                }}
                className="cursor-pointer group"
              >
                <div className="aspect-4/3 rounded-md overflow-hidden bg-slate-100 mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1584269600519-112d071b35e6?auto=format&fit=crop&w=600&q=80"
                    alt="Home and Kitchen"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-xs text-slate-600 mb-1">
                  Italian espresso machines, robotic vacuums, and cookware essentials.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onSelectCategory('home-kitchen');
                onNavigate('search');
              }}
              className="text-xs font-semibold text-sky-700 hover:text-amber-700 hover:underline text-left mt-3"
            >
              Explore home & kitchen
            </button>
          </div>

          {/* Card 4: Promotional Deals */}
          <div className="bg-gradient-to-br from-slate-900 to-[#131921] text-white p-5 rounded-lg shadow-sm border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>Special Promo Offer</span>
              </div>
              <h2 className="text-xl font-black mb-2 leading-snug">
                Save 10% on your first order
              </h2>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Use code <span className="bg-amber-400 text-slate-900 font-mono font-bold px-1.5 py-0.5 rounded">WELCOME10</span> at checkout for instant discounts up to ₹1,000.
              </p>
              <div className="p-3 bg-white/10 rounded-md border border-white/10 text-xs space-y-1 mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>100% Genuine Certified Goods</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>7-Day Return Guarantee</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('search')}
              className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-2.5 rounded text-xs transition-colors text-center cursor-pointer shadow-sm"
            >
              Start Shopping Now
            </button>
          </div>
        </div>

        {/* 3. Today's Featured Deals Carousel */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Today's Featured Deals</h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <Clock className="w-3.5 h-3.5" /> Ends in 12h 45m
              </span>
            </div>
            <button
              onClick={() => onNavigate('search')}
              className="text-xs font-semibold text-sky-700 hover:text-amber-700 hover:underline"
            >
              See all deals
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredDeals.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>

        {/* 4. Top Rated Products Row */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Highly Rated by Customers</h2>
            <button
              onClick={() => onNavigate('search')}
              className="text-xs font-semibold text-sky-700 hover:text-amber-700 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {topRated.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        {/* 5. ShopSphere Membership Banner */}
        <div className="rounded-xl overflow-hidden bg-gradient-to-r from-[#131921] via-[#232f3e] to-[#131921] p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-slate-700">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-xl font-black italic bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                Sphere+ Membership
              </span>
              <span className="text-xs bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-400/40">
                Premium
              </span>
            </div>
            <h3 className="text-2xl font-black">Unlimited FREE One-Day Delivery & Early Access</h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Enjoy zero shipping charges on all eligible items, priority logistics processing, exclusive coupon vouchers, and dedicated customer concierges.
            </p>
          </div>
          <button
            onClick={() => onNavigate('search')}
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-black px-6 py-3 rounded-full text-xs uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
          >
            Join Sphere+ Free for 30 Days
          </button>
        </div>
      </div>
    </div>
  );
};
