import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  Camera,
  Upload,
  Sparkles,
  Trash2,
  Check,
  Building,
  MapPin,
  Save,
  ShieldCheck,
  Lock,
  Phone,
  User,
} from 'lucide-react';

const PRESET_AVATARS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces', label: 'Executive' },
  { id: '2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop&crop=faces', label: 'Classic' },
  { id: '3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop&crop=faces', label: 'Modern' },
  { id: '4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop&crop=faces', label: 'Creative' },
  { id: '5', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&fit=crop&crop=faces', label: 'Analyst' },
  { id: '6', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&fit=crop&crop=faces', label: 'Developer' },
  { id: '7', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&fit=crop&crop=faces', label: 'Founder' },
  { id: '8', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&fit=crop&crop=faces', label: 'Specialist' },
];

export const CustomerSettingsPage: React.FC = () => {
  const { user, customer, updateCurrentUser, updateCustomerData } = useAuth();
  const { showToast } = useNotifications();

  // Profile Photo state
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Billing & Org state
  const [companyName, setCompanyName] = useState(customer?.companyName || '');
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [taxId, setTaxId] = useState(customer?.taxId || '');
  const [street, setStreet] = useState(customer?.billingAddress?.street || '');
  const [city, setCity] = useState(customer?.billingAddress?.city || 'Bengaluru');
  const [state, setState] = useState(customer?.billingAddress?.state || 'Karnataka');
  const [postalCode, setPostalCode] = useState(customer?.billingAddress?.postalCode || '560103');
  const [country, setCountry] = useState(customer?.billingAddress?.country || 'India');
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR'>(customer?.currency || 'INR');
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Upload Photo File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      setAvatarPreview(base64Data);
      await saveAvatar(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const saveAvatar = async (imageData: string) => {
    setIsUploadingPhoto(true);
    try {
      const res: any = await api.post('/auth/upload-avatar', { image: imageData });
      updateCurrentUser({ avatar: res.avatar || imageData });
      setAvatarPreview(res.avatar || imageData);
      showToast('Profile photo updated successfully!', 'success');
    } catch (err: any) {
      try {
        await api.put('/auth/profile', { avatar: imageData });
        updateCurrentUser({ avatar: imageData });
        showToast('Profile photo updated!', 'success');
      } catch (e: any) {
        showToast(err.message || 'Failed to update photo.', 'error');
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSelectPreset = async (url: string) => {
    setAvatarPreview(url);
    await saveAvatar(url);
  };

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      await api.put('/auth/profile', { avatar: '' });
      updateCurrentUser({ avatar: '' });
      setAvatarPreview('');
      showToast('Profile photo removed.', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Save Billing & Profile Details
  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/auth/profile', {
        name,
        phoneNumber,
        companyName,
        taxId,
        currency,
        billingAddress: {
          street,
          city,
          state,
          postalCode,
          country,
        },
      });

      updateCurrentUser({ name, phoneNumber });
      updateCustomerData({
        companyName,
        taxId,
        currency,
        billingAddress: { street, city, state, postalCode, country },
      });

      showToast('Billing profile and tax details saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl pb-12">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Account Settings &amp; Profile</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Manage your personal avatar photo, organization tax information, and security credentials.
        </p>
      </div>

      {/* 1. Profile Photo & Avatar Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Profile Photo &amp; Avatar</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Personalize your identity across invoices, notifications, and team seating
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
          <div className="relative group shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user?.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-orange-500 shadow-lg shadow-orange-500/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 border-4 border-orange-500 flex items-center justify-center text-3xl font-extrabold shadow-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{user?.name}</h4>
              <p className="text-xs text-zinc-400">{user?.email}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                {isUploadingPhoto ? 'Uploading Photo...' : 'Upload New Photo'}
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isUploadingPhoto}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">Recommended 400x400 square format. Max file size: 5MB.</p>
          </div>
        </div>

        {/* Preset Avatars Gallery */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            Or select a curated persona avatar
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {PRESET_AVATARS.map((preset) => {
              const isSelected = avatarPreview === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.url)}
                  className={`group relative p-1 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-orange-500 ring-2 ring-orange-500/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-orange-400'
                  }`}
                  title={preset.label}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Image URL */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={customAvatarUrl}
            onChange={(e) => setCustomAvatarUrl(e.target.value)}
            placeholder="Paste direct image link (e.g. https://.../photo.jpg)"
            className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
          />
          <button
            type="button"
            onClick={() => customAvatarUrl && saveAvatar(customAvatarUrl)}
            disabled={!customAvatarUrl || isUploadingPhoto}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Apply Image URL
          </button>
        </div>
      </div>

      {/* 2. Organization & Billing Details */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Organization &amp; Tax Information</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Details rendered on all generated GST tax invoices and accounting exports
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveBilling} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Company / Legal Entity Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="29AABCS1429B1Z8"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Primary Contact Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-medium"
              />
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              Registered Billing Address
            </h4>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Office Suite, Building, Street"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving changes...' : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Billing Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Security & Password Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Security &amp; Password</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Ensure your workspace credentials remain strong and secure
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              New Password (min 8 characters)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
