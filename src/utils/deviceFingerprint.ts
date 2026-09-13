import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const MAX_GUEST_PREVIEWS = 5;

const STORAGE_FP_KEY = 'tom_device_fp_v1';
const STORAGE_GUEST_COUNT_PREFIX = 'tom_guest_count_';

// Synchronously cached fingerprint in memory
let memoryFingerprint: string | null = null;

/**
 * Fast synchronous DJB2 + FNV hash (0ms latency, zero crypto promises)
 */
function fastHash(input: string): string {
  let hash1 = 5381;
  let hash2 = 2166136261;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 ^ char) * 16777619;
  }
  return `${(hash1 >>> 0).toString(16)}${(hash2 >>> 0).toString(16)}`;
}

/**
 * Get device fingerprint synchronously (instant, 0ms latency)
 */
export function getDeviceFingerprintSync(): string {
  if (memoryFingerprint) return memoryFingerprint;

  try {
    const cached = localStorage.getItem(STORAGE_FP_KEY);
    if (cached && cached.length >= 10) {
      memoryFingerprint = cached;
      return cached;
    }
  } catch {}

  // Instant synchronous entropy calculation
  const screenEntropy = [
    window.screen?.width || 0,
    window.screen?.height || 0,
    window.screen?.colorDepth || 0,
    window.devicePixelRatio || 1,
  ].join('x');

  const nav = window.navigator as any;
  const navEntropy = [
    nav?.userAgent || '',
    nav?.language || '',
    nav?.hardwareConcurrency || 0,
    nav?.platform || '',
    Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || '',
  ].join('|');

  const hash = fastHash(screenEntropy + '###' + navEntropy);
  const fp = `fp_${hash}`;
  memoryFingerprint = fp;

  try {
    localStorage.setItem(STORAGE_FP_KEY, fp);
  } catch {}

  return fp;
}

export interface GuestUsageStatus {
  fingerprint: string;
  used: number;
  max: number;
  remaining: number;
  allowed: boolean;
}

/**
 * Get guest usage synchronously (0ms latency, instant UI rendering)
 */
export function getGuestUsageSync(): GuestUsageStatus {
  const fp = getDeviceFingerprintSync();
  let localCount = 0;

  try {
    const raw = localStorage.getItem(`${STORAGE_GUEST_COUNT_PREFIX}${fp}`);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        localCount = parsed;
      }
    }
  } catch {}

  const remaining = Math.max(0, MAX_GUEST_PREVIEWS - localCount);

  return {
    fingerprint: fp,
    used: localCount,
    max: MAX_GUEST_PREVIEWS,
    remaining,
    allowed: remaining > 0,
  };
}

/**
 * Record a guest usage synchronously (0ms latency, zero delay transition)
 * Then syncs with Firestore in the background asynchronously without blocking.
 */
export function recordGuestUsageSync(): GuestUsageStatus {
  const fp = getDeviceFingerprintSync();
  const current = getGuestUsageSync();
  const newCount = current.used + 1;

  // 1. Synchronously persist to local storage (instant!)
  try {
    localStorage.setItem(`${STORAGE_GUEST_COUNT_PREFIX}${fp}`, newCount.toString());
  } catch {}

  // 2. Sync to Firestore in background without blocking the caller
  syncFirestoreGuestRecord(fp, newCount);

  const remaining = Math.max(0, MAX_GUEST_PREVIEWS - newCount);
  return {
    fingerprint: fp,
    used: newCount,
    max: MAX_GUEST_PREVIEWS,
    remaining,
    allowed: remaining > 0,
  };
}

/**
 * Background Firestore sync (fire-and-forget)
 */
function syncFirestoreGuestRecord(fp: string, count: number): void {
  // Fire and forget in next idle slot
  const sync = async () => {
    try {
      const deviceRef = doc(db, 'device_guests', fp);
      await setDoc(
        deviceRef,
        {
          fingerprint: fp,
          usedCount: count,
          lastGuestAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      // Quiet fail if offline or permission denied
    }
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => sync());
  } else {
    setTimeout(sync, 100);
  }
}

/**
 * Check if Firestore has a higher count (e.g. if user cleared cache),
 * runs quietly in the background on mount without blocking the UI.
 */
export function syncWithRemoteFirestore(onUpdate?: (status: GuestUsageStatus) => void): void {
  const fp = getDeviceFingerprintSync();

  const task = async () => {
    try {
      const deviceRef = doc(db, 'device_guests', fp);
      const snap = await getDoc(deviceRef);
      if (snap.exists()) {
        const remoteCount = snap.data()?.usedCount || 0;
        const current = getGuestUsageSync();
        if (remoteCount > current.used) {
          localStorage.setItem(`${STORAGE_GUEST_COUNT_PREFIX}${fp}`, remoteCount.toString());
          onUpdate?.(getGuestUsageSync());
        }
      }
    } catch {}
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => task());
  } else {
    setTimeout(task, 500);
  }
}

/**
 * Records device visitor presence in Firestore device_guests collection quietly
 * in background idle so that the admin page sees all real visitors who have not signed in.
 */
export function recordVisitorDevicePresence(): void {
  const fp = getDeviceFingerprintSync();

  const task = async () => {
    try {
      const deviceRef = doc(db, 'device_guests', fp);
      const snap = await getDoc(deviceRef);
      if (!snap.exists()) {
        await setDoc(deviceRef, {
          fingerprint: fp,
          usedCount: 0,
          status: 'not_signed_in',
          firstSeenAt: serverTimestamp(),
          lastSeenAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          deviceRef,
          {
            lastSeenAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch {}
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => task());
  } else {
    setTimeout(task, 1000);
  }
}

