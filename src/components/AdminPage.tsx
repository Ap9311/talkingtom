import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Download,
  RefreshCw,
  Search,
  ArrowLeft,
  LogOut,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Mail,
  Calendar,
} from 'lucide-react';
import { auth, signOutUser } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  ADMIN_EMAIL,
  isAdminUser,
  fetchRealAdminMetrics,
  exportUsersToCSV,
  AdminMetrics,
  AdminUserData,
} from '../utils/adminData';

interface AdminPageProps {
  onBackToApp: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToApp }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Metrics & Data
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'signed_in' | 'not_signed_in'>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  // 1. Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const isAuthorizedAdmin = useMemo(() => {
    return isAdminUser(currentUser?.email);
  }, [currentUser]);

  // Immediately redirect unauthorized users back to the main app
  useEffect(() => {
    if (!authChecking && (!currentUser || !isAuthorizedAdmin)) {
      window.history.replaceState({}, '', '/');
      onBackToApp();
    }
  }, [authChecking, currentUser, isAuthorizedAdmin, onBackToApp]);

  // 2. Fetch Real Data when authorized
  const loadData = async () => {
    setLoadingData(true);
    try {
      const data = await fetchRealAdminMetrics();
      setMetrics(data);
      setLastRefreshedAt(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthorizedAdmin) {
      loadData();
    }
  }, [isAuthorizedAdmin]);

  // 3. Sign out and redirect to main app
  const handleSignOut = async () => {
    await signOutUser();
    window.history.replaceState({}, '', '/');
    onBackToApp();
  };

  // 4. Filtered Users List
  const filteredUsers = useMemo(() => {
    if (!metrics) return [];
    return metrics.usersList.filter((user) => {
      // Status filter
      if (statusFilter !== 'all' && user.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = user.name.toLowerCase().includes(query);
        const matchEmail = user.email.toLowerCase().includes(query);
        const matchId = user.id.toLowerCase().includes(query);
        return matchName || matchEmail || matchId;
      }
      return true;
    });
  }, [metrics, statusFilter, searchQuery]);

  // Handle CSV Download
  const handleDownloadCSV = () => {
    if (!metrics || metrics.usersList.length === 0) return;
    exportUsersToCSV(metrics.usersList);
  };

  // If verifying credentials or unauthorized, do not render admin screens
  if (authChecking || !currentUser || !isAuthorizedAdmin) {
    return null;
  }

  // ----------------------------------------------------
  // Authenticated Admin Dashboard (Strictly akshatpopat9311@gmail.com)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col antialiased select-none">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Brand & Security Badge */}
          <div className="flex items-center gap-3">
            <img
              src="/negs-logo.svg"
              alt="School Logo"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base text-slate-900 tracking-tight">
                  Tom AI Administrator
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-extrabold uppercase">
                  Verified Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Connected as <strong className="text-slate-700">{currentUser.email}</strong>
              </p>
            </div>
          </div>

          {/* Controls: Return to App & Sign Out */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToApp}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Tom AI</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Title Bar & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Real-Time User Analytics
            </h1>
            <p className="text-xs text-slate-500">
              Live data from Firestore • Last updated at {lastRefreshedAt || 'Just now'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadData}
              disabled={loadingData}
              className="py-2 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.98] text-slate-700 font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-amber-500' : ''}`} />
              <span>Refresh Data</span>
            </button>

            {/* CSV Download Button */}
            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={!metrics || metrics.usersList.length === 0}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Users */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {metrics ? metrics.totalUsers : '...'}
              </p>
              <p className="text-[11px] text-slate-400">Unique visitors & accounts</p>
            </div>
          </div>

          {/* 2. Signed In Users */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Signed-In Users</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                {metrics ? metrics.signedInUsersCount : '...'}
              </p>
              <p className="text-[11px] text-emerald-700/80 font-medium">Verified Google sign-ins</p>
            </div>
          </div>

          {/* 3. Not Signed In Users */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Not Signed In</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                {metrics ? metrics.notSignedInUsersCount : '...'}
              </p>
              <p className="text-[11px] text-amber-700/80 font-medium">Guest / preview devices</p>
            </div>
          </div>

          {/* 4. Conversion Rate */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Sign-in Rate</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">
                {metrics ? metrics.conversionRate : '...'}
              </p>
              <p className="text-[11px] text-slate-400">Sign-in conversion</p>
            </div>
          </div>
        </div>

        {/* Table Filter & Search Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({metrics ? metrics.totalUsers : 0})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('signed_in')}
              className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'signed_in'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Signed In ({metrics ? metrics.signedInUsersCount : 0})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('not_signed_in')}
              className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'not_signed_in'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Not Signed In ({metrics ? metrics.notSignedInUsersCount : 0})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, device ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Sessions / Attempts</th>
                  <th className="py-3 px-4">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingData && !metrics ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-amber-500/40 border-t-amber-500 rounded-full animate-spin" />
                        <p>Loading real users data from Firestore...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No users match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* User Avatar & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
                              {user.status === 'signed_in' ? (
                                user.name.slice(0, 1).toUpperCase()
                              ) : (
                                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              ID: {user.id.slice(0, 14)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        {user.status === 'signed_in' ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{user.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Signed In</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        {user.status === 'signed_in' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Signed In • Google</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px]">
                            <UserX className="w-3 h-3 text-amber-500" />
                            <span>Not Signed In • Guest</span>
                          </span>
                        )}
                      </td>

                      {/* Sessions / Attempts */}
                      <td className="py-3 px-4 text-slate-600">
                        {user.status === 'signed_in' ? (
                          <span className="text-slate-500 font-medium">Unlimited</span>
                        ) : (
                          <span className="font-semibold text-amber-700">
                            {user.guestAttemptsUsed || 0} of 5 previews
                          </span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-4 text-slate-500">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{user.lastActive}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="py-3 px-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong>{filteredUsers.length}</strong> of{' '}
              <strong>{metrics ? metrics.totalUsers : 0}</strong> total records
            </span>
            <span>
              Real Firestore Database: <strong className="text-slate-700">tomm-ai</strong>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
