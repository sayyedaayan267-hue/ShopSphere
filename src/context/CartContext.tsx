import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartSummary, CartItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface CartContextType {
  cart: CartSummary;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const emptyCart: CartSummary = {
  cartId: '',
  items: [],
  itemsCount: 0,
  subtotal: 0,
  discount: 0,
  appliedCoupon: null,
  shippingFee: 0,
  tax: 0,
  total: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartSummary>(emptyCart);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { success, error } = useNotification();

  const refreshCart = useCallback(async (coupon?: string) => {
    try {
      const res = await api.cart.get(coupon || cart.appliedCoupon?.code);
      if (res.success) {
        setCart({
          cartId: res.cartId,
          items: res.items || [],
          itemsCount: res.itemsCount || 0,
          subtotal: res.subtotal || 0,
          discount: res.discount || 0,
          appliedCoupon: res.appliedCoupon || null,
          shippingFee: res.shippingFee || 0,
          tax: res.tax || 0,
          total: res.total || 0,
        });
      }
    } catch (err: any) {
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  }, [cart.appliedCoupon?.code]);

  useEffect(() => {
    refreshCart();
  }, [user]);

  const addItem = async (productId: string, quantity = 1): Promise<boolean> => {
    try {
      const res = await api.cart.addItem(productId, quantity);
      if (res.success) {
        setCart({
          cartId: res.cartId,
          items: res.items || [],
          itemsCount: res.itemsCount || 0,
          subtotal: res.subtotal || 0,
          discount: res.discount || 0,
          appliedCoupon: res.appliedCoupon || null,
          shippingFee: res.shippingFee || 0,
          tax: res.tax || 0,
          total: res.total || 0,
        });
        success('Added to Cart');
        return true;
      }
      return false;
    } catch (err: any) {
      error(err.message || 'Failed to add item to cart');
      return false;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    try {
      const res = await api.cart.updateQuantity(itemId, quantity);
      if (res.success) {
        setCart({
          cartId: res.cartId,
          items: res.items || [],
          itemsCount: res.itemsCount || 0,
          subtotal: res.subtotal || 0,
          discount: res.discount || 0,
          appliedCoupon: res.appliedCoupon || null,
          shippingFee: res.shippingFee || 0,
          tax: res.tax || 0,
          total: res.total || 0,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      error(err.message || 'Failed to update quantity');
      return false;
    }
  };

  const removeItem = async (itemId: string): Promise<boolean> => {
    try {
      const res = await api.cart.removeItem(itemId);
      if (res.success) {
        setCart({
          cartId: res.cartId,
          items: res.items || [],
          itemsCount: res.itemsCount || 0,
          subtotal: res.subtotal || 0,
          discount: res.discount || 0,
          appliedCoupon: res.appliedCoupon || null,
          shippingFee: res.shippingFee || 0,
          tax: res.tax || 0,
          total: res.total || 0,
        });
        success('Item removed from cart');
        return true;
      }
      return false;
    } catch (err: any) {
      error(err.message || 'Failed to remove item');
      return false;
    }
  };

  const clearCart = async () => {
    try {
      await api.cart.clear();
      setCart(emptyCart);
    } catch (err: any) {
      error('Failed to clear cart');
    }
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      const res = await api.cart.applyCoupon(code);
      if (res.success) {
        setCart({
          cartId: res.cartId,
          items: res.items || [],
          itemsCount: res.itemsCount || 0,
          subtotal: res.subtotal || 0,
          discount: res.discount || 0,
          appliedCoupon: res.appliedCoupon || null,
          shippingFee: res.shippingFee || 0,
          tax: res.tax || 0,
          total: res.total || 0,
        });
        success(res.message || 'Coupon applied successfully');
        return true;
      }
      return false;
    } catch (err: any) {
      error(err.message || 'Failed to apply coupon');
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
