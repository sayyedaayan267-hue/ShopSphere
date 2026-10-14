import React, { useState } from 'react';
import { Heart, ShoppingCart, Check, Zap } from 'lucide-react';
import { Product } from '../types';
import { StarRating } from './StarRating';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  onNavigate: (page: string, param?: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate }) => {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    setAdding(true);
    const success = await addItem(product.id, 1);
    setAdding(false);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleWishlist(product.id);
  };

  return (
    <div
      onClick={() => onNavigate('product', product.slug)}
      className="group bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden relative cursor-pointer"
    >
      {/* Top badges: Discount & Wishlist */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
        {discountPercent ? (
          <span className="bg-rose-600 text-white text-[11px] font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
            {discountPercent}% OFF
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className={`pointer-events-auto p-1.5 rounded-full transition-colors backdrop-blur-xs ${
            inWishlist
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white shadow-xs'
          }`}
          title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-600' : ''}`} />
        </button>
      </div>

      {/* Image container */}
      <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            {product.brand}
          </span>
          <h3 className="text-sm font-medium text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug mb-1.5">
            {product.title}
          </h3>

          {/* Star rating */}
          <div className="mb-2">
            <StarRating rating={product.rating} reviewCount={product.reviewCount} size="sm" />
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-lg font-bold text-slate-900">
              ₹{product.price.toLocaleString()}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-slate-400 line-through">
                M.R.P: ₹{product.compareAtPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Prime & delivery note */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-2">
            <span className="inline-flex items-center text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-1.5 py-0.2 rounded italic">
              Sphere+
            </span>
            <span>FREE Delivery Tomorrow</span>
          </div>

          {/* Stock status */}
          {product.stock <= 0 ? (
            <p className="text-xs font-semibold text-rose-600">Currently out of stock.</p>
          ) : product.stock <= 8 ? (
            <p className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
              Only {product.stock} left in stock - order soon.
            </p>
          ) : (
            <p className="text-[11px] text-emerald-700 font-medium">In stock</p>
          )}
        </div>

        {/* Add to Cart button */}
        <div className="mt-4 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={product.stock <= 0 || adding}
            onClick={handleAddToCart}
            className={`w-full py-2 px-3 rounded-full text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
              added
                ? 'bg-emerald-600 text-white'
                : product.stock <= 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-500 text-slate-900'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Cart</span>
              </>
            ) : adding ? (
              <span>Adding...</span>
            ) : product.stock <= 0 ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 text-slate-800" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
