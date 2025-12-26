
import { User, GeneratedImage, AdminStats, UserCredentials, CreditPlan } from "../types";
import { auth } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";

const USERS_KEY = 'lumina_users_v2';
const HISTORY_KEY = 'lumina_history';
const PLANS_KEY = 'lumina_credit_plans';

export const mockBackend = {
  // --- AUTH METHODS ---
  
  signup: async (creds: UserCredentials): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, creds.email, creds.password!);
      const fbUser = userCredential.user;
      
      if (creds.name) {
        await updateProfile(fbUser, { displayName: creds.name });
      }

      await sendEmailVerification(fbUser);

      const newUser: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || creds.name || fbUser.email?.split('@')[0] || 'Explorer',
        credits: 5,
        isAdmin: fbUser.email === 'bloginfoway@gmail.com'
      };

      const usersJson = localStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : {};
      users[fbUser.uid] = newUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // We stay logged in but in an unverified state
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("USER_EXISTS");
      }
      throw error;
    }
  },

  login: async (creds: UserCredentials): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, creds.email, creds.password!);
      const fbUser = userCredential.user;
      
      const usersJson = localStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : {};
      let user = users[fbUser.uid];
      
      if (!user) {
        user = {
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Explorer',
          credits: 5,
          isAdmin: fbUser.email === 'bloginfoway@gmail.com'
        };
        users[fbUser.uid] = user;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }

      if (!fbUser.emailVerified) {
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      return user;
    } catch (error: any) {
      if (error.message === "EMAIL_NOT_VERIFIED") throw error;
      if (error.code === 'auth/user-not-found') throw new Error("ACCOUNT_NOT_FOUND");
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') throw new Error("WRONG_PASSWORD");
      throw new Error("AUTH_FAILED");
    }
  },

  resendVerification: async (): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
    } else {
      throw new Error("No user currently logged in.");
    }
  },

  sendPasswordReset: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || "Failed to send reset email");
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  // --- USER METHODS ---

  getCurrentUser: (): User | null => {
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.emailVerified) return null;

    const usersJson = localStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};
    return users[fbUser.uid] || null;
  },

  getAllUsers: (): User[] => {
    const usersJson = localStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};
    return Object.values(users);
  },

  updateAnyUserCredits: (userId: string, credits: number): User => {
    const usersJson = localStorage.getItem(USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};
    if (users[userId]) {
      users[userId].credits = credits;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return users[userId];
    }
    throw new Error("User not found");
  },

  updateCredits: (amount: number): User => {
    const user = mockBackend.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    return mockBackend.updateAnyUserCredits(user.id, user.credits + amount);
  },

  deductCredit: (): boolean => {
    const user = mockBackend.getCurrentUser();
    if (!user || user.credits <= 0) return false;
    mockBackend.updateAnyUserCredits(user.id, user.credits - 1);
    return true;
  },

  getPlans: (): CreditPlan[] => {
    const plansJson = localStorage.getItem(PLANS_KEY);
    return plansJson ? JSON.parse(plansJson) : [];
  },

  updatePlan: (updatedPlan: CreditPlan): CreditPlan[] => {
    const plans = mockBackend.getPlans();
    const index = plans.findIndex(p => p.id === updatedPlan.id);
    if (index !== -1) {
      plans[index] = updatedPlan;
      localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
    }
    return plans;
  },

  saveImage: (prompt: string, imageUrl: string, aspectRatio: string): GeneratedImage => {
    const user = mockBackend.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const historyJson = localStorage.getItem(HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];
    const newImage: GeneratedImage = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      prompt,
      imageUrl,
      aspectRatio,
      timestamp: Date.now()
    };
    history.unshift(newImage);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
    return newImage;
  },

  getHistory: (userId: string): GeneratedImage[] => {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];
    return history.filter((img: GeneratedImage) => img.userId === userId);
  },

  getAdminStats: (): AdminStats => {
    const users = mockBackend.getAllUsers();
    const historyJson = localStorage.getItem(HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];
    return {
      totalUsers: users.length,
      totalCredits: users.reduce((acc, u) => acc + (u.credits || 0), 0),
      totalImages: history.length,
      activeToday: Math.max(1, Math.floor(users.length * 0.4))
    };
  }
};

(function seed() {
  const plansJson = localStorage.getItem(PLANS_KEY);
  if (!plansJson) {
    const defaultPlans: CreditPlan[] = [
      { id: 'starter', name: 'Starter', credits: 20, price: 9.99 },
      { id: 'pro', name: 'Pro Studio', credits: 100, price: 29.99, popular: true },
      { id: 'unlimited', name: 'Unlimited', credits: 500, price: 99.99 }
    ];
    localStorage.setItem(PLANS_KEY, JSON.stringify(defaultPlans));
  }
})();
