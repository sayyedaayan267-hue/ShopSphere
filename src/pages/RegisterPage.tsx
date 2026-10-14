import React, { useState } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface RegisterPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { error, success } = useNotification();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      error('Please fill in all mandatory fields');
      return;
    }
    if (password.length < 6) {
      error('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone ? phone.trim() : undefined,
      });
      success('Account created successfully! Welcome to ShopSphere.');
      onNavigate('home');
    } catch (err: any) {
      error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
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

      {/* Main Register Card */}
      <div className="bg-white p-8 rounded-lg border border-slate-300 shadow-sm max-w-sm w-full space-y-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Your name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First and last name"
              className="w-full px-3 py-2 border rounded border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@example.com"
              className="w-full px-3 py-2 border rounded border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Mobile number (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border rounded border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 border rounded border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Passwords must be at least 6 characters.
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Re-enter password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-md text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create your ShopSphere account'}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          By creating an account, you agree to ShopSphere's Conditions of Use and Privacy Notice.
        </p>

        <div className="pt-3 border-t border-slate-200 text-xs">
          <p className="text-slate-600">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-sky-700 hover:text-amber-700 font-bold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
