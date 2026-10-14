import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  MapPin,
  Package,
  Heart,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';

interface ProfilePageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, refreshUser, isAdmin } = useAuth();
  const { error, success } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.auth.updateProfile({ name, phone });
      if (res.success) {
        success('Profile updated successfully');
        await refreshUser();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.auth.changePassword({ currentPassword, newPassword });
      if (res.success) {
        success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      error(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#eaeded] py-16 text-center">
        <p className="text-xs text-slate-500 mb-3">Please sign in to view your profile</p>
        <button
          onClick={() => onNavigate('login')}
          className="bg-amber-400 font-bold px-5 py-2 rounded-full text-xs shadow-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eaeded] py-6">
      <div className="max-w-[900px] mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal profile, security credentials, and preferences.
          </p>
        </div>

        {/* Quick Shortcut Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('orders')}
            className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Your Orders</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Track, return, or buy things again</p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('addresses')}
            className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Your Addresses</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Edit delivery locations for orders</p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('wishlist')}
            className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-800 shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Your Wishlist</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">View saved items and deals</p>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-amber-600" />
              <span>Personal Information</span>
            </h2>
            {isAdmin && (
              <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-0.5 rounded uppercase tracking-wider">
                Admin Role Active
              </span>
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3 py-2 border rounded border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Email cannot be changed directly.
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full sm:w-1/2 px-3 py-2 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded-full text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Change Account Password</span>
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password (min 6 chars)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2 rounded-full text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
