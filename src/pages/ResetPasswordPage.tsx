import React, { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useNotification } from '../context/NotificationContext';

interface ResetPasswordPageProps {
  token: string;
  onNavigate: (page: string, param?: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  token,
  onNavigate,
}) => {
  const [resetToken, setResetToken] = useState(token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { error, success } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim()) {
      error('Reset token is required');
      return;
    }
    if (newPassword.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await api.auth.resetPassword({
        token: resetToken.trim(),
        newPassword,
      });
      if (res.success) {
        success(res.message);
        onNavigate('login');
      }
    } catch (err: any) {
      error(err.message || 'Failed to reset password');
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create new password</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          We'll ask for this password whenever you sign in to your ShopSphere account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Security Token</label>
            <input
              type="text"
              required
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              placeholder="Paste security token"
              className="w-full px-3 py-2 border rounded border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">New password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 border rounded border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Re-enter new password</label>
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
            {loading ? 'Updating password...' : 'Save changes and sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};
