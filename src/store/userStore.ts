import { create } from 'zustand';
import { User } from '../types';

interface UserState {
  currentUser: User | null;
  isWalletConnected: boolean;
  walletBalances: { asset_hash: string; symbol: string; amount: string }[];
  setUser: (user: User | null) => void;
  connectWallet: (payload?: { address?: string; balances?: { asset_hash: string; symbol: string; amount: string }[] }) => void;
  disconnectWallet: () => void;
  setWalletBalances: (balances: { asset_hash: string; symbol: string; amount: string }[]) => void;
  updatePreferences: (preferences: Partial<User>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isWalletConnected: false,
  walletBalances: [],
  setUser: (user) => set({ currentUser: user }),
  connectWallet: (payload) =>
    set((state) => ({
      isWalletConnected: true,
      walletBalances: payload?.balances ?? state.walletBalances,
      currentUser: state.currentUser
        ? {
            ...state.currentUser,
            walletAddress: payload?.address ?? state.currentUser.walletAddress,
          }
        : state.currentUser,
    })),
  disconnectWallet: () =>
    set((state) => ({
      isWalletConnected: false,
      walletBalances: [],
      currentUser: state.currentUser
        ? { ...state.currentUser, walletAddress: undefined }
        : null,
    })),
  setWalletBalances: (balances) => set({ walletBalances: balances }),
  updatePreferences: (preferences) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, ...preferences }
        : null,
    })),
}));
