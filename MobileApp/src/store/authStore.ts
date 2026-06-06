import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type UserRole = "admin" | "procurement_officer" | "manager" | "vendor";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  org_id: string;
  phone?: string;
  avatar_url?: string | null;
  department?: string;
  org_name?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (token: string, refreshToken: string, user: UserProfile) => Promise<void>;
  clearAuth: () => Promise<void>;
  updateUser: (user: Partial<UserProfile>) => void;
  hydrateAuth: () => Promise<void>;
}

const TOKEN_KEY = "vb_auth_token";
const REFRESH_TOKEN_KEY = "vb_refresh_token";
const USER_KEY = "vb_auth_user";

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: async (token, refreshToken, user) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      set({ token, refreshToken, user, isAuthenticated: true });
    } catch (error) {
      console.error("Failed to store credentials", error);
    }
  },

  clearAuth: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
    } catch (error) {
      console.error("Failed to clear credentials", error);
    }
  },

  updateUser: (updatedUser) => {
    const currentUser = get().user;
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedUser };
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser))
        .catch(err => console.error("Failed to update stored user", err));
      set({ user: newUser });
    }
  },

  hydrateAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const userString = await SecureStore.getItemAsync(USER_KEY);
      
      if (token && refreshToken && userString) {
        const user = JSON.parse(userString) as UserProfile;
        set({ token, refreshToken, user, isAuthenticated: true, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch (error) {
      console.error("Failed to hydrate auth state", error);
      set({ isHydrated: true });
    }
  },
}));
