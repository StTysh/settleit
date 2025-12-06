/**
 * NeoLine wallet integration (minimal viable)
 * Detects NeoLine N3 extension, connects to get account, fetches balances, and signs messages.
 * Falls back to mock behaviors when extension is unavailable so UI can still demo flows.
 */
import { useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';

type NeoLineAccount = {
  address: string;
  label?: string;
};

type NeoLineBalanceResponse = {
  address: string;
  balances: Array<{
    asset_hash: string;
    amount: string;
    symbol: string;
  }>;
};

type NeoLineN3 = {
  getAccount: () => Promise<{ result: NeoLineAccount }>;
  getBalance: (input: { address: string; contracts?: string[] }) => Promise<{ result: NeoLineBalanceResponse[] }>;
  signMessage: (input: { message: string }) => Promise<{ result: { publicKey: string; signature: string } }>;
};

declare global {
  interface Window {
    NeoLineN3?: NeoLineN3;
  }
}

export const useWallet = () => {
  const [neoline, setNeoline] = useState<NeoLineN3 | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<NeoLineAccount | null>(null);
  const [balances, setBalances] = useState<NeoLineBalanceResponse['balances']>([]);
  const { connectWallet, disconnectWallet, setWalletBalances, updatePreferences } = useUserStore();

  useEffect(() => {
    // Detect NeoLine on mount
    if (typeof window !== 'undefined' && window.NeoLineN3) {
      setNeoline(window.NeoLineN3);
    }
  }, []);

  const connect = async (): Promise<NeoLineAccount | null> => {
    if (!neoline) {
      console.warn('NeoLine N3 extension not detected');
      setIsConnected(false);
      setAccount(null);
      return null;
    }

    try {
      const { result } = await neoline.getAccount();
      setAccount(result);
      setIsConnected(true);
      connectWallet({ address: result.address });
      updatePreferences({ walletAddress: result.address });
      return result;
    } catch (err) {
      console.error('NeoLine connect failed:', err);
      setIsConnected(false);
      setAccount(null);
      throw err;
    }
  };

  const disconnect = async (): Promise<void> => {
    // NeoLine does not expose an explicit disconnect; clear local state.
    setIsConnected(false);
    setAccount(null);
    setBalances([]);
    disconnectWallet();
  };

  const getBalance = async (address?: string) => {
    const targetAddress = address || account?.address;
    if (!targetAddress) {
      throw new Error('No address available for balance fetch');
    }
    if (!neoline) {
      console.warn('NeoLine not available; returning mock balances');
      const mock = [
        { asset_hash: 'NEO', amount: '100', symbol: 'NEO' },
        { asset_hash: 'GAS', amount: '50', symbol: 'GAS' },
      ];
      setBalances(mock);
      setWalletBalances(mock);
      return mock;
    }

    try {
      const { result } = await neoline.getBalance({ address: targetAddress });
      const balanceList = result?.[0]?.balances || [];
      setBalances(balanceList);
      setWalletBalances(balanceList);
      return balanceList;
    } catch (err) {
      console.error('NeoLine getBalance failed:', err);
      throw err;
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!neoline) {
      console.warn('NeoLine not available; returning mock signature');
      return 'mock_signature';
    }
    try {
      const { result } = await neoline.signMessage({ message });
      return result.signature;
    } catch (err) {
      console.error('NeoLine signMessage failed:', err);
      throw err;
    }
  };

  const invokeMockTransaction = async (description: string): Promise<string> => {
    // Placeholder that mirrors a typical invoke flow and returns a mock txid
    console.log('Mock invoke called:', description);
    return `mock_tx_${Date.now()}`;
  };

  return {
    isConnected,
    account,
    balances,
    connect,
    disconnect,
    getBalance,
    signMessage,
    invokeMockTransaction,
  };
};
