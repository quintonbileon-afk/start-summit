import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Fetch config from server dynamically without any VITE_ prefix variables
const configResponse = await fetch('/api/config');
const serverConfig = await configResponse.json();

const firebaseConfig = {
  apiKey: serverConfig.apiKey,
  authDomain: serverConfig.authDomain,
  projectId: serverConfig.projectId,
  storageBucket: serverConfig.storageBucket,
  messagingSenderId: serverConfig.messagingSenderId,
  appId: serverConfig.appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with the correct database ID
const dbId = serverConfig.databaseId || "ai-studio-startupsummitbot-95035c0c-ff62-4d88-b693-ccacd9498d61";
export const db = getFirestore(app, dbId);
export const auth = getAuth(app);

// Pre-seed admin credentials
export const ADMIN_EMAIL = serverConfig.adminEmail || 'admin@startupsummit.co.bw';
export const ADMIN_PASSWORD = serverConfig.adminPassword || 'YOUR_ADMIN_PASSWORD';

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

