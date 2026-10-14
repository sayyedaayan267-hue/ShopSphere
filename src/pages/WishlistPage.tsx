import React from 'react';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { StarRating } from '../components/StarRating';

interface WishlistPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate }) => {
  const { items, removeFromWishlist, loading } = useWishlist();
  const { addItem } = useCart();

  const handleMoveToCart = async (productId: string) => {
    const success = await addItem(productId, 1);
    if (success) {
      await removeFromWishlist(productId);
    }
  };

  return (
    <div className="min-h-screen bg-[#eaeded] py-6">
      <div className="max-w-[1200px] mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-300">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-600 fill-rose-600" />
              <span>Your Wishlist</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Items saved for future shopping. Move them to your cart anytime.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading your wishlist...</div>
        ) : items.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-slate-200 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Your Wishlist is empty</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Save items you love by clicking the heart icon on any product page or card.
            </p>
            <button
              onClick={() => onNavigate('search')}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-6 py-2.5 rounded-full text-xs shadow-xs"
            >
              Explore Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const product = item.product;
              const image =
                product.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative"
                >
                  <div>
                    <div
                      onClick={() => onNavigate('product', product.slug)}
                      className="aspect-square bg-slate-50 rounded p-2 mb-3 cursor-pointer overflow-hidden flex items-center justify-center"
                    >
                      <img
                        src={image}
                        alt={product.title}
                        className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform"
                      />
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {product.brand}
                    </span>
                    <h3
                      onClick={() => onNavigate('product', product.slug)}
                      className="text-xs font-semibold text-slate-900 hover:text-amber-700 line-clamp-2 cursor-pointer leading-snug mb-1.5"
                    >
                      {product.title}
                    </h3>

                    <div className="mb-2">
                      <StarRating rating={product.rating} reviewCount={product.reviewCount} size="sm" />
                    </div>

                    <div className="text-base font-bold text-slate-900 mb-2">
                      ₹{product.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleMoveToCart(product.id)}
                      className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded-full text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Move to Cart</span>
                    </button>

                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="w-full text-slate-400 hover:text-rose-600 text-xs font-medium py-1 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
