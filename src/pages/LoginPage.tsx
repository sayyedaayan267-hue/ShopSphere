import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface LoginPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { error, success } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password });
      success('Welcome back to ShopSphere!');
      onNavigate('home');
    } catch (err: any) {
      error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#eaeded] py-8 px-4 flex flex-col items-center justify-center">
      {/* Brand Header */}
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2 mb-6 cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 shadow-sm">
          <Sparkles className="w-5 h-5 fill-slate-900" />
        </div>
        <span className="text-2xl font-black text-slate-900 tracking-tight">
          Shop<span className="text-amber-500">Sphere</span>
        </span>
      </button>

      {/* Main Sign-In Card */}
      <div className="bg-white p-8 rounded-lg border border-slate-300 shadow-sm max-w-sm w-full space-y-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in</h1>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Email or mobile phone number</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. customer@shopsphere.store"
              className="w-full px-3 py-2 border rounded border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800">Password</label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-sky-700 hover:text-amber-700 hover:underline"
              >
                Forgot your password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-md text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          By continuing, you agree to ShopSphere's Conditions of Use and Privacy Notice.
        </p>

        {/* 1-Click Quick Demo Accounts for reviewer ease */}
        <div className="pt-3 border-t border-slate-200">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            One-Click Test Accounts
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('customer@shopsphere.store', 'Customer@12345')}
              className="p-2 rounded border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-slate-900">Customer Demo</div>
              <div className="text-[10px] text-slate-500">Regular buyer role</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@shopsphere.store', 'Admin@12345')}
              className="p-2 rounded border border-amber-300 bg-amber-50/40 hover:bg-amber-100/50 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-amber-900">Admin Demo</div>
              <div className="text-[10px] text-amber-700">Full operations access</div>
            </button>
          </div>
        </div>
      </div>

      {/* New customer footer divider */}
      <div className="max-w-sm w-full mt-6 text-center space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#eaeded] px-3 text-slate-500 font-medium">New to ShopSphere?</span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('register')}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 rounded-md border border-slate-300 text-xs transition-colors shadow-xs cursor-pointer"
        >
          Create your ShopSphere account
        </button>
      </div>
    </div>
  );
};
