import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const ADMIN_EMAIL = 'akshatpopat9311@gmail.com';

/**
 * Checks if a given email is the designated administrator
 */
export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export interface AdminUserData {
  id: string;
  name: string;
  email: string;
  status: 'signed_in' | 'not_signed_in';
  photoURL?: string;
  provider?: string;
  guestAttemptsUsed?: number;
  lastActive: string;
  createdAt?: string;
  rawTimestamp: number;
}

export interface AdminMetrics {
  totalUsers: number;
  signedInUsersCount: number;
  notSignedInUsersCount: number;
  conversionRate: string;
  usersList: AdminUserData[];
}

/**
 * Format a Firestore timestamp or date value to human-readable string
 */
function formatDate(timestamp: any): { formatted: string; raw: number } {
  if (!timestamp) {
    return { formatted: 'Recent', raw: 0 };
  }

  try {
    let d: Date;
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      d = timestamp.toDate();
    } else if (timestamp?.seconds) {
      d = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      d = new Date(timestamp);
    } else {
      return { formatted: 'Recent', raw: 0 };
    }

    if (isNaN(d.getTime())) {
      return { formatted: 'Recent', raw: 0 };
    }

    return {
      formatted: d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      raw: d.getTime(),
    };
  } catch {
    return { formatted: 'Recent', raw: 0 };
  }
}

/**
 * Escapes a field value for CSV export
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Fetches real user and guest device analytics from Firestore
 */
export async function fetchRealAdminMetrics(): Promise<AdminMetrics> {
  const usersList: AdminUserData[] = [];
  const signedInUids = new Set<string>();

  // 1. Query real signed-in users
  try {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);

    userSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const uid = docSnap.id;
      signedInUids.add(uid);

      const activeTime = formatDate(data.lastActiveAt || data.updatedAt || data.createdAt);
      const createdTime = formatDate(data.createdAt || data.updatedAt);

      usersList.push({
        id: uid,
        name: data.displayName || 'Google User',
        email: data.email || 'No email on record',
        status: 'signed_in',
        photoURL: data.photoURL || undefined,
        provider: data.provider || 'google',
        guestAttemptsUsed: undefined,
        lastActive: activeTime.formatted,
        createdAt: createdTime.formatted,
        rawTimestamp: activeTime.raw || createdTime.raw,
      });
    });
  } catch (err) {
    console.error('Error fetching signed-in users from Firestore:', err);
  }

  // 2. Query real guest devices (users who have NOT signed in)
  try {
    const guestsCol = collection(db, 'device_guests');
    const guestSnapshot = await getDocs(guestsCol);

    guestSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const fp = docSnap.id;

      const activeTime = formatDate(data.lastGuestAt || data.lastSeenAt || data.firstSeenAt);
      const createdTime = formatDate(data.firstSeenAt || data.lastGuestAt);

      usersList.push({
        id: fp,
        name: `Guest (${fp.slice(0, 10)}...)`,
        email: 'Not Signed In',
        status: 'not_signed_in',
        photoURL: undefined,
        provider: 'guest_device',
        guestAttemptsUsed: typeof data.usedCount === 'number' ? data.usedCount : 0,
        lastActive: activeTime.formatted,
        createdAt: createdTime.formatted,
        rawTimestamp: activeTime.raw || createdTime.raw,
      });
    });
  } catch (err) {
    console.error('Error fetching guest devices from Firestore:', err);
  }

  // Sort by most recent activity
  usersList.sort((a, b) => b.rawTimestamp - a.rawTimestamp);

  const signedInCount = usersList.filter((u) => u.status === 'signed_in').length;
  const notSignedInCount = usersList.filter((u) => u.status === 'not_signed_in').length;
  const total = signedInCount + notSignedInCount;

  const convRate = total > 0 ? ((signedInCount / total) * 100).toFixed(1) + '%' : '0.0%';

  return {
    totalUsers: total,
    signedInUsersCount: signedInCount,
    notSignedInUsersCount: notSignedInCount,
    conversionRate: convRate,
    usersList,
  };
}

/**
 * Downloads a sanitized, formatted CSV file of users
 */
export function exportUsersToCSV(users: AdminUserData[]): void {
  const headers = [
    'Name',
    'Email',
    'Status',
    'User or Device ID',
    'Account Provider',
    'Guest Attempts Used',
    'Last Active Time',
    'Created Time',
  ];

  const rows = users.map((u) => [
    escapeCSV(u.name),
    escapeCSV(u.email),
    escapeCSV(u.status === 'signed_in' ? 'Signed In (Google)' : 'Not Signed In (Guest)'),
    escapeCSV(u.id),
    escapeCSV(u.provider || 'N/A'),
    escapeCSV(u.guestAttemptsUsed !== undefined ? u.guestAttemptsUsed : 'N/A'),
    escapeCSV(u.lastActive),
    escapeCSV(u.createdAt || 'N/A'),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const today = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `tom-ai-users-real-data-${today}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
