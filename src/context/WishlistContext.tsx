import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WishlistItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface WishlistContextType {
  items: WishlistItem[];
  wishlistProductIds: Set<string>;
  loading: boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const { success, error } = useNotification();

  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.wishlist.get();
      if (res.success) {
        setItems(res.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const wishlistProductIds = new Set(items.map((i) => i.productId));

  const isInWishlist = (productId: string) => wishlistProductIds.has(productId);

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    if (!user) {
      error('Please sign in to save items to your wishlist');
      return false;
    }

    try {
      const res = await api.wishlist.toggle(productId);
      if (res.success) {
        success(res.message);
        await refreshWishlist();
        return res.inWishlist;
      }
      return false;
    } catch (err: any) {
      error(err.message || 'Failed to update wishlist');
      return false;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const res = await api.wishlist.remove(productId);
      if (res.success) {
        success('Removed from Wishlist');
        await refreshWishlist();
      }
    } catch (err: any) {
      error(err.message || 'Failed to remove from wishlist');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistProductIds,
        loading,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
