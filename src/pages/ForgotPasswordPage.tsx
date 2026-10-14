import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useNotification } from '../context/NotificationContext';

interface ForgotPasswordPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { error, success } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const res = await api.auth.forgotPassword(email.trim());
      if (res.success) {
        setSubmitted(true);
        if (res.resetToken) {
          setResetToken(res.resetToken);
        }
        success(res.message);
      }
    } catch (err: any) {
      error(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eaeded] py-8 px-4 flex flex-col items-center justify-center">
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

      <div className="bg-white p-8 rounded-lg border border-slate-300 shadow-sm max-w-sm w-full space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Password assistance</h1>

        {!submitted ? (
          <>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the email address associated with your ShopSphere account, and we will dispatch a single-use security reset token.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@shopsphere.store"
                  className="w-full px-3 py-2 border rounded border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-md text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>A password reset link has been created for your email.</span>
            </div>

            {resetToken && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 space-y-2">
                <p className="font-bold">Development Mode Direct Reset Link:</p>
                <button
                  onClick={() => onNavigate('reset-password', resetToken)}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Proceed to Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => onNavigate('login')}
              className="w-full text-center text-sky-700 hover:underline pt-2"
            >
              Back to Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
