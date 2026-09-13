import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { UserProfile } from "../types";

// Firebase configuration with environment variables support for secure GitHub & Vercel deployment
export const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyBS-2vh10jGIAk0icCjTS5vLC_DAOP1Lb0",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "tomm-ai.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    "tomm-ai",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "tomm-ai.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    "888021653513",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:888021653513:web:d9f027a558c38e925cc0d8",
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    "G-LDEFJGB6DL",
};

// Initialize Firebase App singleton
export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics safely
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(app);
      }
    })
    .catch(() => {});
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Local storage key prefix
const LOCAL_PROFILE_KEY = "tom_user_profile_";

/**
 * Save only and only Name and Profile Picture of user to Firestore
 * as explicitly requested: "we will save only and only Name and profile picture of user"
 */
export async function saveUserProfileToFirestore(
  uid: string,
  profileData: { displayName: string; photoURL: string; email?: string }
): Promise<void> {
  // Always cache locally as well for instant offline-first reliability
  try {
    localStorage.setItem(
      `${LOCAL_PROFILE_KEY}${uid}`,
      JSON.stringify(profileData)
    );
  } catch {}

  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(
      userDocRef,
      {
        uid,
        displayName: profileData.displayName || "Friend",
        photoURL: profileData.photoURL || "",
        email: profileData.email || "",
        provider: "google",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore save note (profile cached locally):", err);
  }
}

/**
 * Load user profile from Firestore or local fallback
 */
export async function loadUserProfileFromFirestore(
  uid: string
): Promise<{ displayName: string; photoURL: string } | null> {
  // Try Firestore first
  try {
    const userDocRef = doc(db, "users", uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const loaded = {
        displayName: data.displayName || "",
        photoURL: data.photoURL || "",
      };
      try {
        localStorage.setItem(
          `${LOCAL_PROFILE_KEY}${uid}`,
          JSON.stringify(loaded)
        );
      } catch {}
      return loaded;
    }
  } catch (err) {
    console.warn("Firestore fetch note (using local cache):", err);
  }

  // Fallback to local storage
  try {
    const cached = localStorage.getItem(`${LOCAL_PROFILE_KEY}${uid}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return null;
}

/**
 * Sign In with Google
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const displayName = user.displayName || "Friend";
  const photoURL =
    user.photoURL ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
      user.uid
    )}`;

  const profile: UserProfile = {
    uid: user.uid,
    displayName,
    photoURL,
    email: user.email || undefined,
    provider: "google",
  };

  try {
    localStorage.setItem("tom_cached_auth_user", JSON.stringify(profile));
  } catch {}

  // Save user profile including name and verified email (background sync so sign-in is instant)
  saveUserProfileToFirestore(user.uid, {
    displayName,
    photoURL,
    email: user.email || "",
  }).catch((e) => {
    console.warn("Background Firestore sync note:", e);
  });

  return profile;
}

/**
 * Sign Up with Email and Password
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  name: string,
  photoURL?: string
): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  const user = result.user;

  const displayName = name.trim() || "Friend";
  const chosenPhoto =
    photoURL?.trim() ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
      user.uid
    )}`;

  // Update Firebase Auth profile
  try {
    await updateProfile(user, {
      displayName,
      photoURL: chosenPhoto,
    });
  } catch (e) {
    console.warn("Auth updateProfile note:", e);
  }

  // Save strictly only Name and profile picture to Firestore
  await saveUserProfileToFirestore(user.uid, {
    displayName,
    photoURL: chosenPhoto,
  });

  return {
    uid: user.uid,
    displayName,
    photoURL: chosenPhoto,
    email: user.email || undefined,
    provider: "password",
  };
}

/**
 * Sign In with Email and Password
 */
export async function signInWithEmail(
  email: string,
  pass: string
): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const user = result.user;

  // Retrieve Firestore saved profile if available
  const firestoreProfile = await loadUserProfileFromFirestore(user.uid);

  const displayName =
    firestoreProfile?.displayName || user.displayName || "Friend";
  const photoURL =
    firestoreProfile?.photoURL ||
    user.photoURL ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
      user.uid
    )}`;

  return {
    uid: user.uid,
    displayName,
    photoURL,
    email: user.email || undefined,
    provider: "password",
  };
}

/**
 * Update Current User Profile (Name and/or Profile Picture)
 */
export async function updateUserProfile(
  currentUser: User,
  updates: { displayName?: string; photoURL?: string }
): Promise<UserProfile> {
  const newName =
    updates.displayName !== undefined
      ? updates.displayName.trim()
      : currentUser.displayName || "Friend";
  const newPhoto =
    updates.photoURL !== undefined
      ? updates.photoURL
      : currentUser.photoURL || "";

  // 1. Update Firebase Auth record
  await updateProfile(currentUser, {
    displayName: newName,
    photoURL: newPhoto,
  });

  // 2. Update Firestore record strictly with name and profile picture
  await saveUserProfileToFirestore(currentUser.uid, {
    displayName: newName,
    photoURL: newPhoto,
  });

  return {
    uid: currentUser.uid,
    displayName: newName,
    photoURL: newPhoto,
    email: currentUser.email || undefined,
    provider: currentUser.providerData[0]?.providerId || "password",
  };
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Sign Out
 */
export async function signOutUser(): Promise<void> {
  try {
    localStorage.removeItem("tom_cached_auth_user");
  } catch {}
  await signOut(auth);
}

/**
 * Format Firebase Auth errors into clear, friendly English with action flags
 */
export function formatAuthError(error: any): {
  message: string;
  isInvalidCredential?: boolean;
  isEmailInUse?: boolean;
  code?: string;
} {
  const code = error?.code || "";
  let message = "";

  switch (code) {
    case "auth/invalid-email":
      message = "Please enter a valid email address.";
      break;
    case "auth/user-disabled":
      message = "This account has been disabled. Please contact support.";
      break;
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      message =
        "Incorrect email or password, or no account exists with this email yet. If you are new, tap 'Create Account'!";
      break;
    case "auth/email-already-in-use":
      message =
        "An account with this email already exists. Try signing in instead.";
      break;
    case "auth/weak-password":
      message = "Password should be at least 6 characters long.";
      break;
    case "auth/popup-closed-by-user":
      message =
        "The Google sign-in window was closed before completing. Please try again.";
      break;
    case "auth/popup-blocked":
      message =
        "Sign-in popup was blocked by your browser. Please allow popups for this site.";
      break;
    case "auth/unauthorized-domain": {
      const currentHost =
        typeof window !== "undefined" ? window.location.hostname : "preview domain";
      message = `This domain (${currentHost}) is not authorized yet in Firebase. Add "${currentHost}" to Firebase Console > Authentication > Settings > Authorized domains.`;
      break;
    }
    case "auth/network-request-failed":
      message = "Network connection issue. Please check your internet connection.";
      break;
    case "auth/too-many-requests":
      message = "Too many attempts. Please wait a few moments and try again.";
      break;
    case "auth/operation-not-allowed":
      message =
        "This sign-in provider is not enabled in your Firebase console settings.";
      break;
    default:
      message =
        error?.message ||
        "An unexpected authentication error occurred. Please try again.";
  }

  return {
    message,
    isInvalidCredential:
      code === "auth/invalid-credential" ||
      code === "auth/user-not-found" ||
      code === "auth/wrong-password",
    isEmailInUse: code === "auth/email-already-in-use",
    code,
  };
}
