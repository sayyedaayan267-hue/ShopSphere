import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Check, Trash2, Edit3 } from 'lucide-react';
import { Address } from '../types';
import { api } from '../services/api';
import { useNotification } from '../context/NotificationContext';

interface AddressesPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const AddressesPage: React.FC<AddressesPageProps> = ({ onNavigate }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { error, success } = useNotification();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    isDefault: false,
  });

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.addresses.list();
      if (res.success) {
        setAddresses(res.addresses || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      isDefault: addresses.length === 0,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.addressLine1 || !form.city || !form.postalCode) {
      error('Please complete all required address fields');
      return;
    }

    try {
      if (editingId) {
        const res = await api.addresses.update(editingId, form);
        if (res.success) {
          success('Address updated');
          setShowModal(false);
          loadAddresses();
        }
      } else {
        const res = await api.addresses.create(form);
        if (res.success) {
          success('Address added');
          setShowModal(false);
          loadAddresses();
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to save address');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const res = await api.addresses.delete(id);
      if (res.success) {
        success('Address deleted');
        loadAddresses();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await api.addresses.setDefault(id);
      if (res.success) {
        success('Default address updated');
        loadAddresses();
      }
    } catch (err: any) {
      error(err.message || 'Failed to set default address');
    }
  };

  return (
    <div className="min-h-screen bg-[#eaeded] py-6">
      <div className="max-w-[1000px] mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-300">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Saved Addresses</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your delivery locations for faster one-click checkout.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-full text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Address</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading addresses...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Add new address placeholder tile */}
            <div
              onClick={handleOpenCreate}
              className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2 hover:border-amber-500 hover:bg-amber-50/20 cursor-pointer min-h-[180px] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm text-slate-800">Add address</span>
            </div>

            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white rounded-lg border p-5 flex flex-col justify-between shadow-xs text-xs relative ${
                  addr.isDefault ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                    {addr.isDefault && (
                      <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {addr.addressLine1}
                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  </p>
                  <p className="text-slate-600">
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </p>
                  <p className="text-slate-600">{addr.country}</p>
                  <p className="text-slate-500 mt-2">Phone number: {addr.phone}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenEdit(addr)}
                      className="text-sky-700 hover:text-amber-700 font-semibold"
                    >
                      Edit
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="text-rose-600 hover:text-rose-800 font-semibold"
                    >
                      Remove
                    </button>
                  </div>

                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-slate-500 hover:text-slate-800 underline"
                    >
                      Set as default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b">
              {editingId ? 'Edit delivery address' : 'Add a new delivery address'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 border rounded border-slate-300"
                />
              </div>
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span className="font-medium text-slate-700">Make this my default address</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded shadow-xs"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
