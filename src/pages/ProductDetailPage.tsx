import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShoppingCart,
  Zap,
  ShieldCheck,
  RotateCcw,
  Truck,
  MapPin,
  ChevronRight,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Product } from '../types';
import { StarRating } from '../components/StarRating';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { api } from '../services/api';

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (page: string, param?: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  slug,
  onNavigate,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [pinCode, setPinCode] = useState('560001');
  const [pinChecked, setPinChecked] = useState(true);

  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await api.products.getBySlug(slug);
        if (res.success && res.product) {
          setProduct(res.product);
          const primaryImg =
            res.product.images?.find((img) => img.isPrimary)?.url ||
            res.product.images?.[0]?.url ||
            '';
          setSelectedImage(primaryImg);

          // Fetch related
          const relRes = await api.products.getRelated(res.product.id);
          if (relRes.success) {
            setRelated(relRes.related || []);
          }
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eaeded] py-8">
        <div className="max-w-[1300px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-white rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 bg-white rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-white rounded w-1/3 animate-pulse" />
            <div className="h-10 bg-white rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#eaeded] py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The product you requested might have been retired or moved.</p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded-full text-xs shadow-xs"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  let specsMap: Record<string, string> = {};
  if (product.specifications) {
    try {
      specsMap = JSON.parse(product.specifications);
    } catch {}
  }

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async () => {
    if (product.stock <= 0) return;
    setAdding(true);
    await addItem(product.id, quantity);
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (product.stock <= 0) return;
    setAdding(true);
    const ok = await addItem(product.id, quantity);
    setAdding(false);
    if (ok) {
      onNavigate('checkout');
    }
  };

  return (
    <div className="min-h-screen bg-[#eaeded] py-6">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5 flex-wrap">
          <button onClick={() => onNavigate('home')} className="hover:underline hover:text-amber-700">
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          {product.category && (
            <>
              <button
                onClick={() => {
                  onNavigate('search');
                }}
                className="hover:underline hover:text-amber-700"
              >
                {product.category.name}
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </>
          )}
          <span className="text-slate-400">{product.brand}</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-medium text-slate-800 truncate max-w-xs">{product.title}</span>
        </nav>

        {/* Main Product Layout */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 1. Left Gallery (Col 1-5) */}
          <div className="lg:col-span-5 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-2 shrink-0 overflow-x-auto sm:overflow-y-auto max-h-[460px]">
              {(product.images || []).map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`w-16 h-16 rounded border p-1 shrink-0 overflow-hidden bg-slate-50 transition-all ${
                    selectedImage === img.url
                      ? 'border-amber-500 ring-2 ring-amber-400/50'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>

            {/* Primary Large Image */}
            <div className="flex-1 aspect-square bg-slate-50/50 rounded-lg border border-slate-100 flex items-center justify-center p-6 relative overflow-hidden group">
              <img
                src={selectedImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
                alt={product.title}
                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
              />
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-4 right-4 p-2 rounded-full shadow-sm backdrop-blur-xs transition-colors ${
                  inWishlist
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white'
                }`}
                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-rose-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* 2. Center Product Details (Col 6-8) */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <span className="text-xs font-bold text-amber-700 tracking-wider uppercase">
                Brand: {product.brand}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 leading-snug">
                {product.title}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <StarRating rating={product.rating} reviewCount={product.reviewCount} size="md" />
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-emerald-700 font-medium">Verified Purchase Rating</span>
            </div>

            {/* Price Section */}
            <div className="space-y-1">
              {discountPercent && (
                <div className="flex items-center gap-2">
                  <span className="bg-rose-600 text-white text-xs font-black px-2 py-0.5 rounded shadow-xs uppercase">
                    Limited Time Deal: -{discountPercent}%
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.compareAtPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    M.R.P.: ₹{product.compareAtPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Inclusive of all taxes. EMI starts at ₹{Math.round(product.price / 12).toLocaleString()}/month.
              </p>
            </div>

            {/* Value Guarantees row */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
              <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded">
                <Truck className="w-4 h-4 text-amber-600" />
                <span className="text-[10px] font-bold text-slate-700">Free Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span className="text-[10px] font-bold text-slate-700">7 Days Return</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="text-[10px] font-bold text-slate-700">Sphere Care</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                About this item
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Specifications Table */}
            {Object.keys(specsMap).length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Technical Specifications
                </h3>
                <div className="border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                  {Object.entries(specsMap).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-2 p-2.5">
                      <span className="font-semibold text-slate-500">{key}</span>
                      <span className="text-slate-800">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Right Purchase & Delivery Box (Col 9-12) */}
          <div className="lg:col-span-3">
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  ₹{product.price.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  In Stock
                </span>
              </div>

              {/* Delivery ETA */}
              <div className="text-xs text-slate-600 space-y-1.5 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-1 text-slate-800 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Deliver to {pinCode}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Order within <span className="font-bold text-emerald-700">4 hrs 20 mins</span> for FREE delivery Tomorrow by 11:00 AM.
                </p>
              </div>

              {/* Stock condition */}
              {product.stock <= 0 ? (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded">
                  Temporarily out of stock.
                </div>
              ) : product.stock <= 8 ? (
                <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Only {product.stock} left in stock - order soon.</span>
                </div>
              ) : (
                <div className="text-xs font-semibold text-emerald-700">
                  Ships from and sold by ShopSphere Retail India.
                </div>
              )}

              {/* Quantity selector */}
              {product.stock > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-slate-600">Quantity:</span>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => i + 1).map(
                      (num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={product.stock <= 0 || adding}
                  onClick={handleAddToCart}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2.5 px-4 rounded-full text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShoppingCart className="w-4 h-4 text-slate-900" />
                  <span>{adding ? 'Adding...' : 'Add to Cart'}</span>
                </button>

                <button
                  type="button"
                  disabled={product.stock <= 0 || adding}
                  onClick={handleBuyNow}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-full text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Trust Badge */}
              <div className="pt-2 text-[11px] text-slate-500 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 font-semibold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Secure Razorpay Transaction</span>
                </div>
                <p>Your transaction is encrypted with 256-bit TLS security.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Related Products Carousel */}
        {related.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Customers who viewed this item also viewed
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
