import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Detect environment configuration
const getStaticEnv = () => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID,
  };
};

const getProcessEnv = () => {
  const gEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};
  return {
    apiKey: gEnv.NEXT_PUBLIC_FIREBASE_API_KEY || gEnv.FIREBASE_API_KEY,
    authDomain: gEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || gEnv.FIREBASE_AUTH_DOMAIN,
    projectId: gEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID || gEnv.FIREBASE_PROJECT_ID,
    storageBucket: gEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || gEnv.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: gEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || gEnv.FIREBASE_MESSAGING_SENDER_ID,
    appId: gEnv.NEXT_PUBLIC_FIREBASE_APP_ID || gEnv.FIREBASE_APP_ID,
    databaseId: gEnv.NEXT_PUBLIC_FIREBASE_DATABASE_ID || gEnv.FIREBASE_DATABASE_ID,
  };
};

const staticEnv = getStaticEnv();
const processEnv = getProcessEnv();

const finalConfig = {
  apiKey: staticEnv.apiKey || processEnv.apiKey || "",
  authDomain: staticEnv.authDomain || processEnv.authDomain || "",
  projectId: staticEnv.projectId || processEnv.projectId || "",
  storageBucket: staticEnv.storageBucket || processEnv.storageBucket || "",
  messagingSenderId: staticEnv.messagingSenderId || processEnv.messagingSenderId || "",
  appId: staticEnv.appId || processEnv.appId || "",
  databaseId: staticEnv.databaseId || processEnv.databaseId || "",
  adminEmail: "admin@startupsummit.co.bw",
  adminPassword: "YOUR_ADMIN_PASSWORD"
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const hasAllEnvKeys = requiredKeys.every(k => !!(finalConfig as any)[k]);

let isFirebaseConfigured = true;
let configErrorMessage = "";

if (!hasAllEnvKeys) {
  try {
    console.log("[Firebase] Environment variables not fully loaded. Attempting fallback: fetching /api/config...");
    const configResponse = await fetch('/api/config');
    if (!configResponse.ok) {
      throw new Error(`HTTP status ${configResponse.status}`);
    }
    const serverConfig = await configResponse.json();
    
    finalConfig.apiKey = finalConfig.apiKey || serverConfig.apiKey || "";
    finalConfig.authDomain = finalConfig.authDomain || serverConfig.authDomain || "";
    finalConfig.projectId = finalConfig.projectId || serverConfig.projectId || "";
    finalConfig.storageBucket = finalConfig.storageBucket || serverConfig.storageBucket || "";
    finalConfig.messagingSenderId = finalConfig.messagingSenderId || serverConfig.messagingSenderId || "";
    finalConfig.appId = finalConfig.appId || serverConfig.appId || "";
    finalConfig.databaseId = finalConfig.databaseId || serverConfig.databaseId || "";
    if (serverConfig.adminEmail) finalConfig.adminEmail = serverConfig.adminEmail;
    if (serverConfig.adminPassword) finalConfig.adminPassword = serverConfig.adminPassword;
  } catch (error: any) {
    console.warn("[Firebase] Could not fetch config from /api/config:", error);
    isFirebaseConfigured = false;
    configErrorMessage = `Firebase client-side configuration variables are not set.
Vercel deployment needs these configured in your dashboard or .env.local file.
The fallback /api/config also failed: ${error.message || error}`;
  }
}

// Final configuration check
const finalHasAllKeys = requiredKeys.every(k => !!(finalConfig as any)[k]);
if (!finalHasAllKeys) {
  isFirebaseConfigured = false;
  const missingKeys = requiredKeys.filter(k => !(finalConfig as any)[k]);
  configErrorMessage = `Firebase is missing the following required keys: ${missingKeys.join(', ')}. 
Please configure them in your .env.local, Vercel Environment Variables, or ensure the backend server is running and /api/config is accessible.`;
}

const dummyConfig = {
  apiKey: "AIzaSyDummyKey_PleaseConfigureEnvironmentVariables",
  authDomain: "dummy-project.firebaseapp.com",
  projectId: "dummy-project",
  storageBucket: "dummy-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:dummy",
  databaseId: ""
};

const activeConfig = isFirebaseConfigured ? finalConfig : dummyConfig;

// Initialize Firebase
const app = initializeApp(activeConfig);

// Initialize Cloud Firestore with the correct database ID
const dbId = activeConfig.databaseId || "ai-studio-startupsummitbot-95035c0c-ff62-4d88-b693-ccacd9498d61";
export const db = getFirestore(app, dbId);
export const auth = getAuth(app);

// Pre-seed admin credentials
export const ADMIN_EMAIL = finalConfig.adminEmail || 'admin@startupsummit.co.bw';
export const ADMIN_PASSWORD = finalConfig.adminPassword || 'YOUR_ADMIN_PASSWORD';

export { isFirebaseConfigured, configErrorMessage };

// Helper to seed the admin user if they do not exist
export async function seedAdminUser() {
  try {
    await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log("Admin user successfully seeded!");
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("Admin user already seeded.");
    } else if (error.code === 'auth/operation-not-allowed') {
      console.warn("Firebase Email/Password Authentication is not yet enabled in the Firebase Console. Dashboard will fall back to local validation for the pre-seeded credentials.");
    } else {
      console.error("Failed to seed admin user:", error);
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { collection, addDoc, serverTimestamp };

