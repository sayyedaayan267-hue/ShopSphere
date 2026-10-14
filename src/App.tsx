import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/Header';
import { SubNav } from './components/SubNav';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { AddressesPage } from './pages/AddressesPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

import { Category } from './types';
import { api } from './services/api';

function AppContent() {
  const { user, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParam, setPageParam] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories globally for navbars
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.products.getCategories();
        if (res.success) {
          setCategories(res.categories || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Parse path on initial load
  useEffect(() => {
    const syncRouteFromLocation = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      if (path === '/' || path === '') {
        setCurrentPage('home');
      } else if (path === '/search') {
        setCurrentPage('search');
        if (searchParams.get('q')) setSearchQuery(searchParams.get('q') || '');
        if (searchParams.get('category')) setCurrentCategory(searchParams.get('category') || 'all');
      } else if (path.startsWith('/product/')) {
        setCurrentPage('product');
        setPageParam(path.replace('/product/', ''));
      } else if (path === '/cart') {
        setCurrentPage('cart');
      } else if (path === '/checkout') {
        setCurrentPage('checkout');
      } else if (path.startsWith('/order-confirmation/')) {
        setCurrentPage('order-confirmation');
        setPageParam(path.replace('/order-confirmation/', ''));
      } else if (path === '/orders') {
        setCurrentPage('orders');
      } else if (path.startsWith('/orders/')) {
        setCurrentPage('order-detail');
        setPageParam(path.replace('/orders/', ''));
      } else if (path === '/wishlist') {
        setCurrentPage('wishlist');
      } else if (path === '/profile') {
        setCurrentPage('profile');
      } else if (path === '/addresses') {
        setCurrentPage('addresses');
      } else if (path === '/login') {
        setCurrentPage('login');
      } else if (path === '/register') {
        setCurrentPage('register');
      } else if (path === '/forgot-password') {
        setCurrentPage('forgot-password');
      } else if (path === '/reset-password') {
        setCurrentPage('reset-password');
        setPageParam(searchParams.get('token') || '');
      } else if (path.startsWith('/admin')) {
        setCurrentPage('admin');
      }
    };

    syncRouteFromLocation();
    window.addEventListener('popstate', syncRouteFromLocation);
    return () => window.removeEventListener('popstate', syncRouteFromLocation);
  }, []);

  const navigate = (page: string, param = '') => {
    setCurrentPage(page);
    setPageParam(param);

    // Update URL without full page reload
    let url = '/';
    if (page === 'home') url = '/';
    else if (page === 'search') {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory);
      const qStr = params.toString();
      url = `/search${qStr ? `?${qStr}` : ''}`;
    } else if (page === 'product') url = `/product/${param}`;
    else if (page === 'cart') url = '/cart';
    else if (page === 'checkout') url = '/checkout';
    else if (page === 'order-confirmation') url = `/order-confirmation/${param}`;
    else if (page === 'orders') url = '/orders';
    else if (page === 'order-detail') url = `/orders/${param}`;
    else if (page === 'wishlist') url = '/wishlist';
    else if (page === 'profile') url = '/profile';
    else if (page === 'addresses') url = '/addresses';
    else if (page === 'login') url = '/login';
    else if (page === 'register') url = '/register';
    else if (page === 'forgot-password') url = '/forgot-password';
    else if (page === 'reset-password') url = `/reset-password?token=${param}`;
    else if (page === 'admin') url = '/admin';

    window.history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query: string, category: string) => {
    setSearchQuery(query);
    setCurrentCategory(category);
    navigate('search');
  };

  const handleSelectCategory = (categorySlug: string) => {
    setCurrentCategory(categorySlug);
    navigate('search');
  };

  const isAuthPage = ['login', 'register', 'forgot-password', 'reset-password'].includes(currentPage);

  return (
    <div className="min-h-screen flex flex-col bg-[#eaeded] font-sans antialiased text-slate-900">
      {/* Show header & subnav on regular shopping pages */}
      {!isAuthPage && (
        <>
          <Header
            categories={categories}
            currentCategory={currentCategory}
            onSelectCategory={handleSelectCategory}
            onSearch={handleSearch}
            onNavigate={navigate}
          />
          <SubNav
            categories={categories}
            currentCategory={currentCategory}
            onSelectCategory={handleSelectCategory}
            onNavigate={navigate}
          />
        </>
      )}

      {/* Main Page Routing */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            categories={categories}
            onSelectCategory={handleSelectCategory}
            onNavigate={navigate}
          />
        )}

        {currentPage === 'search' && (
          <SearchPage
            initialQuery={searchQuery}
            initialCategory={currentCategory}
            categories={categories}
            onNavigate={navigate}
          />
        )}

        {currentPage === 'product' && (
          <ProductDetailPage slug={pageParam} onNavigate={navigate} />
        )}

        {currentPage === 'cart' && <CartPage onNavigate={navigate} />}

        {currentPage === 'checkout' && <CheckoutPage onNavigate={navigate} />}

        {currentPage === 'order-confirmation' && (
          <OrderConfirmationPage orderNumber={pageParam} onNavigate={navigate} />
        )}

        {currentPage === 'orders' && <OrdersPage onNavigate={navigate} />}

        {currentPage === 'order-detail' && (
          <OrderDetailPage orderNumber={pageParam} onNavigate={navigate} />
        )}

        {currentPage === 'wishlist' && <WishlistPage onNavigate={navigate} />}

        {currentPage === 'profile' && <ProfilePage onNavigate={navigate} />}

        {currentPage === 'addresses' && <AddressesPage onNavigate={navigate} />}

        {currentPage === 'login' && <LoginPage onNavigate={navigate} />}

        {currentPage === 'register' && <RegisterPage onNavigate={navigate} />}

        {currentPage === 'forgot-password' && (
          <ForgotPasswordPage onNavigate={navigate} />
        )}

        {currentPage === 'reset-password' && (
          <ResetPasswordPage token={pageParam} onNavigate={navigate} />
        )}

        {currentPage === 'admin' && (
          <AdminDashboardPage categories={categories} onNavigate={navigate} />
        )}
      </main>

      {/* Footer on non-auth pages */}
      {!isAuthPage && <Footer onNavigate={navigate} />}
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}
