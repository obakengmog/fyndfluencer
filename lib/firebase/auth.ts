// lib/firebase/auth.ts
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import type { User, UserType } from '@/types/database';

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Add scopes for social data access
googleProvider.addScope('profile');
googleProvider.addScope('email');
facebookProvider.addScope('public_profile');
facebookProvider.addScope('email');

// ============================================================
// INFLUENCER SOCIAL LOGIN (Google + Facebook)
// ============================================================

export async function signInInfluencerWithGoogle() {
    const { user } = await signInWithPopup(auth, googleProvider);
    return handleSocialAuth(user, 'google');
}

export async function signInInfluencerWithFacebook() {
    const { user } = await signInWithPopup(auth, facebookProvider);
    return handleSocialAuth(user, 'facebook');
}

async function handleSocialAuth(
    firebaseUser: FirebaseUser, 
    provider: 'google' | 'facebook'
  ) {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

  if (userDoc.exists()) {
        const userData = userDoc.data() as User;

      if (userData.userType !== 'influencer') {
              throw new Error('This account is not registered as an influencer.');
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), {
              lastLoginAt: serverTimestamp()
      }, { merge: true });

      return { firebaseUser, isNewUser: false, user: userData };
  }

  const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'Influencer',
        photoURL: firebaseUser.photoURL || undefined,
        userType: 'influencer',
        onboardingCompleted: false,
        authProvider: provider,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        lastLoginAt: serverTimestamp() as any
  };

  await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

  await setDoc(doc(db, 'influencers', firebaseUser.uid), {
        id: firebaseUser.uid,
        userId: firebaseUser.uid,
        profile: {
                displayName: firebaseUser.displayName || '',
                bio: '',
                avatar: firebaseUser.photoURL || '',
                country: '',
                languages: [],
                niches: []
        },
        socialAccounts: {},
        metrics: {
                totalFollowers: 0,
                averageEngagement: 0,
                authenticityScore: 0,
                tier: 'nano',
                lastUpdated: serverTimestamp()
        },
        rateCard: {
                currency: 'USD',
                post: 0,
                story: 0,
                reel: 0,
                video: 0
        },
        verified: false,
        featured: false,
        searchableNiches: [],
        searchableCountry: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
  });

  return { firebaseUser, isNewUser: true, user: newUser };
}

// ============================================================
// BRAND/AGENCY EMAIL REGISTRATION
// ============================================================

export async function registerBrandOrAgency(
    email: string,
    password: string,
    userType: 'brand' | 'agency',
    displayName: string,
    organizationName: string
  ) {
    const isPersonalEmail = isPersonalEmailDomain(email);

  const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth, email, password
      );

  await sendEmailVerification(firebaseUser);

  const orgId = firebaseUser.uid;
    await setDoc(doc(db, 'organizations', orgId), {
          id: orgId,
          type: userType,
          name: organizationName,
          ownerId: firebaseUser.uid,
          members: [{
                  userId: firebaseUser.uid,
                  email: email,
                  displayName: displayName,
                  role: 'owner',
                  joinedAt: serverTimestamp(),
                  invitedBy: firebaseUser.uid
          }],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
    });

  const newUser: User = {
        id: firebaseUser.uid,
        email: email,
        displayName: displayName,
        userType: userType,
        organizationId: orgId,
        role: 'owner',
        onboardingCompleted: false,
        emailVerified: false,
        isPersonalEmail: isPersonalEmail,
        authProvider: 'email',
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        lastLoginAt: serverTimestamp() as any
  };

  await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

  return { firebaseUser, user: newUser, organizationId: orgId };
}

// ============================================================
// BRAND/AGENCY EMAIL LOGIN
// ============================================================

export async function loginBrandOrAgency(email: string, password: string) {
    const { user: firebaseUser } = await signInWithEmailAndPassword(
          auth, email, password
        );

  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

  if (!userDoc.exists()) {
        throw new Error('User account not found. Please register first.');
  }

  const userData = userDoc.data() as User;

  if (userData.userType === 'influencer' && userData.authProvider !== 'email') {
        throw new Error('Please sign in using Google or Facebook.');
  }

  await setDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        emailVerified: firebaseUser.emailVerified
  }, { merge: true });

  return { firebaseUser, user: userData };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isPersonalEmailDomain(email: string): boolean {
    const personalDomains = [
          'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
          'icloud.com', 'aol.com', 'protonmail.com', 'mail.com',
          'zoho.com', 'yandex.com', 'gmx.com'
        ];

  const domain = email.split('@')[1]?.toLowerCase();
    return personalDomains.includes(domain);
}

export async function logout() {
    await signOut(auth);
}

export async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
}
