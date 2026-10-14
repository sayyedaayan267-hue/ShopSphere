import React, { useState } from 'react';
import { MapPin, X, Check } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: { city: string; pincode: string };
  onSelectLocation: (loc: { city: string; pincode: string }) => void;
}

const POPULAR_LOCATIONS = [
  { city: 'Bengaluru', pincode: '560001' },
  { city: 'Mumbai', pincode: '400001' },
  { city: 'New Delhi', pincode: '110001' },
  { city: 'Hyderabad', pincode: '500001' },
  { city: 'Chennai', pincode: '600001' },
  { city: 'Pune', pincode: '411001' },
  { city: 'Kolkata', pincode: '700001' },
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}) => {
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      setError('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    onSelectLocation({ city: 'Custom Delivery', pincode: pincode.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-100 px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <MapPin className="w-5 h-5 text-amber-600" />
            <span>Choose your delivery location</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Select a delivery location to see product availability and delivery options tailored to your area.
          </p>

          <form onSubmit={handleApply} className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Enter an Indian PIN code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="e.g. 560001"
                className="flex-1 px-3 py-2 border rounded border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-medium px-4 py-2 rounded text-sm transition-colors shadow-xs"
              >
                Apply
              </button>
            </div>
            {error && <p className="text-xs text-rose-600 mt-1.5">{error}</p>}
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Or select a city</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 max-h-48 overflow-y-auto">
            {POPULAR_LOCATIONS.map((loc) => {
              const isSelected =
                currentLocation.city === loc.city && currentLocation.pincode === loc.pincode;
              return (
                <button
                  key={loc.pincode}
                  onClick={() => {
                    onSelectLocation(loc);
                    onClose();
                  }}
                  className={`text-left px-3 py-2 rounded border text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/50 font-semibold text-amber-900'
                      : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div>{loc.city}</div>
                    <div className="text-[10px] text-slate-400">{loc.pincode}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
