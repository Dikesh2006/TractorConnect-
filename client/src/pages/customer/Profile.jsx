import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, MapPin, CheckCircle, AlertCircle, Save, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/axios';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  village: z.string().min(2, 'Village is required'),
  district: z.string().min(2, 'District is required'),
  state: z.string().default('Madhya Pradesh'),
  address: z.string().optional()
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password')
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword']
  });

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      village: user?.village || '',
      district: user?.district || '',
      state: user?.state || 'Madhya Pradesh',
      address: user?.address || ''
    }
  });

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  });

  const onUpdateProfile = async (data) => {
    try {
      setProfileError('');
      setProfileSuccess('');
      const res = await apiClient.put('/auth/profile', data);
      if (res.data?.success && res.data.data?.user) {
        updateUser(res.data.data.user);
        setProfileSuccess('Profile details updated successfully!');
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile');
    }
  };

  const onChangePassword = async (data) => {
    try {
      setPasswordError('');
      setPasswordSuccess('');
      const res = await apiClient.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      if (res.data?.success) {
        setPasswordSuccess('Password changed successfully!');
        resetPasswordForm();
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Farmer Profile & Settings</h1>
        <p className="text-sm text-slate-600">
          खाता जानकारी / Manage your personal contact details, location, and account password
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-4">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 flex items-center space-x-2 ${
            activeTab === 'details'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Details</span>
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 flex items-center space-x-2 ${
            activeTab === 'password'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Change Password</span>
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          {profileSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-emerald-800 text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{profileSuccess}</span>
            </div>
          )}
          {profileError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                disabled
                value={`+91 ${user?.mobile || ''}`}
                className="block w-full px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl border border-slate-200 text-sm cursor-not-allowed"
              />
              <span className="text-xs text-slate-500 mt-1 block">
                Mobile number is your account ID and cannot be changed directly.
              </span>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                {...regProfile('name')}
                className="block w-full px-4 py-2.5 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
              />
              {profileErrors.name && (
                <p className="mt-1 text-xs text-red-600">{profileErrors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                id="email"
                type="email"
                placeholder="ramesh@example.com"
                {...regProfile('email')}
                className="block w-full px-4 py-2.5 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
              />
              {profileErrors.email && (
                <p className="mt-1 text-xs text-red-600">{profileErrors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="village" className="block text-sm font-semibold text-slate-700 mb-1">
                  Village (गाँव) *
                </label>
                <input
                  id="village"
                  type="text"
                  {...regProfile('village')}
                  className="block w-full px-4 py-2.5 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                />
                {profileErrors.village && (
                  <p className="mt-1 text-xs text-red-600">{profileErrors.village.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="district" className="block text-sm font-semibold text-slate-700 mb-1">
                  District (ज़िला) *
                </label>
                <input
                  id="district"
                  type="text"
                  {...regProfile('district')}
                  className="block w-full px-4 py-2.5 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                />
                {profileErrors.district && (
                  <p className="mt-1 text-xs text-red-600">{profileErrors.district.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-1">
                Full Address / Landmark
              </label>
              <textarea
                id="address"
                rows={2}
                {...regProfile('address')}
                className="block w-full px-4 py-2.5 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                placeholder="House no., street, or landmark"
              />
            </div>

            <button
              type="submit"
              disabled={isProfileSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-700 text-white font-semibold rounded-xl hover:bg-brand-800 disabled:opacity-60 text-sm shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isProfileSubmitting ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 max-w-md">
          {passwordSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-emerald-800 text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}
          {passwordError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                {...regPassword('currentPassword')}
                className="block w-full px-4 py-2.5 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                New Password *
              </label>
              <input
                type="password"
                {...regPassword('newPassword')}
                className="block w-full px-4 py-2.5 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                {...regPassword('confirmNewPassword')}
                className="block w-full px-4 py-2.5 text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
              />
              {passwordErrors.confirmNewPassword && (
                <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmNewPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPasswordSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-700 text-white font-semibold rounded-xl hover:bg-brand-800 disabled:opacity-60 text-sm shadow-sm mt-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isPasswordSubmitting ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;

