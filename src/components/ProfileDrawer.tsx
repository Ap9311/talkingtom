import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User as UserIcon,
  LogOut,
  Camera,
  Check,
  AlertCircle,
  Sparkles,
  Save,
  MessageCircle,
} from 'lucide-react';
import { UserProfile } from '../types';
import { AVATAR_PRESETS } from '../utils/avatarPresets';
import { auth, updateUserProfile, signOutUser, formatAuthError } from '../lib/firebase';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onProfileUpdated: (updatedProfile: UserProfile) => void;
  onSignOut: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
  onSignOut,
}) => {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Sync state whenever userProfile changes
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhotoURL(userProfile.photoURL || '');
      setErrorMessage(null);
      setSaveSuccess(false);
    }
  }, [userProfile, isOpen]);

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Image size should be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoURL(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save changes to Firebase Auth and Firestore
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('Please enter a name for Tom to call you.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const updated = await updateUserProfile(currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL.trim(),
        });
        onProfileUpdated(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else if (userProfile) {
        // Guest mode fallback
        const updated: UserProfile = {
          ...userProfile,
          displayName: displayName.trim(),
          photoURL: photoURL.trim(),
        };
        onProfileUpdated(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err: any) {
      console.warn('Update Profile notice:', err?.code || err?.message);
      setErrorMessage(formatAuthError(err).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOutClick = async () => {
    try {
      await signOutUser();
      onSignOut();
      onClose();
    } catch (err: any) {
      console.warn('Sign Out notice:', err?.code || err?.message);
      setErrorMessage(formatAuthError(err).message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
          />

          {/* Right-side Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-sm sm:max-w-md h-full bg-white shadow-2xl border-l border-slate-200/80 flex flex-col z-10 select-none overflow-y-auto"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-amber-50/70 via-white to-white">
              <div className="flex items-center gap-2.5">
                <img
                  src="/negs-logo.svg"
                  alt="School Logo"
                  className="w-9 h-9 object-contain drop-shadow-2xs select-none"
                />
                <div>
                  <h2 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                    Your Profile
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Tom remembers your name & picture
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Profile"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content Form */}
            <div className="flex-1 p-5 space-y-5">
              {/* Alert Feedback */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Profile updated! Tom now knows you as <strong>{displayName}</strong>.</span>
                </div>
              )}

              {/* Profile Avatar Card */}
              <div className="flex flex-col items-center justify-center pt-2 pb-1">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-500 to-amber-300 shadow-md">
                    <img
                      src={photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=TomFriend'}
                      alt="User avatar"
                      className="w-full h-full rounded-full object-cover bg-white"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://api.dicebear.com/7.x/bottts/svg?seed=TomFriend';
                      }}
                    />
                  </div>

                  {/* Camera upload badge */}
                  <label
                    title="Change picture"
                    className="absolute bottom-0 right-0 p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="mt-3 text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    {userProfile?.provider === 'google' ? (
                      <>
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        Verified Google Account
                      </>
                    ) : (
                      'Guest Preview'
                    )}
                  </span>
                  {userProfile?.email && (
                    <p className="text-xs text-slate-400 mt-1">{userProfile.email}</p>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSave} className="space-y-4 pt-1">
                {/* Name field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Your Name (What Tom calls you)
                  </label>
                  <div className="relative flex items-center">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Profile Picture Chooser Button */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Profile Picture
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPresets(!showPresets)}
                      className="text-[11px] text-amber-600 hover:text-amber-700 font-medium hover:underline cursor-pointer"
                    >
                      {showPresets ? 'Hide presets' : 'Choose avatar'}
                    </button>
                  </div>

                  {showPresets && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-6 gap-2 mb-2">
                      {AVATAR_PRESETS.map((avatar) => {
                        const isSelected = photoURL === avatar.url;
                        return (
                          <button
                            key={avatar.id}
                            type="button"
                            onClick={() => setPhotoURL(avatar.url)}
                            title={avatar.name}
                            className={`relative aspect-square rounded-full p-0.5 border-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-amber-500 scale-105 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={avatar.url}
                              alt={avatar.name}
                              className="w-full h-full rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Direct Device Upload Button */}
                  <div className="flex items-center gap-2 mt-2">
                    <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer">
                      <Camera className="w-4 h-4 text-amber-500" />
                      <span>Upload photo from device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {auth.currentUser?.photoURL && photoURL !== auth.currentUser.photoURL && (
                      <button
                        type="button"
                        onClick={() => setPhotoURL(auth.currentUser?.photoURL || '')}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        title="Restore original Google Profile Picture"
                      >
                        Reset to Google Photo
                      </button>
                    )}
                  </div>
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </form>

              {/* Informational Tip Card */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-950">Tom Remembers You!</p>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    Say or ask <span className="font-medium bg-amber-100/80 px-1 py-0.5 rounded text-amber-900">"What is my name?"</span> anytime, and Tom will happily reply with your name!
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer Footer with Sign Out */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={handleSignOutClick}
                className="w-full py-2.5 px-4 bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
