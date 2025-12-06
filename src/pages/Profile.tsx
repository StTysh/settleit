import React, { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { useUIStore } from '../store/uiStore';
import { useWallet } from '../hooks/useWallet';
import { useNeoIntegration } from '../hooks/useNeoIntegration';
import { getCurrentMockUser } from '../mock';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui';
import { User } from '../types';
import { Wallet, User as UserIcon, Bell, Globe, Shield, AlertTriangle } from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, setUser, isWalletConnected, connectWallet, disconnectWallet, updatePreferences } =
    useUserStore();
  const { addToast } = useUIStore();
  const { connect, disconnect, getBalance, account, balances, isConnected, invokeMockTransaction } = useWallet();
  const { signAndInvoke } = useNeoIntegration();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<Partial<User>>({});

  useEffect(() => {
    if (!currentUser) {
      const mockUser = getCurrentMockUser();
      setUser(mockUser);
      setProfileData(mockUser);
    } else {
      setProfileData(currentUser);
    }
  }, [currentUser, setUser]);

  const handleSave = () => {
    if (profileData.displayName?.trim()) {
      updatePreferences(profileData);
      setIsEditing(false);
      addToast('Profile updated successfully', 'success');
    }
  };

  const handleWalletConnect = async () => {
    if (isWalletConnected) {
      disconnectWallet();
      await disconnect();
      addToast('Wallet disconnected', 'info');
      return;
    }

    try {
      const acc = await connect();
      if (acc) {
        connectWallet({ address: acc.address });
        updatePreferences({ walletAddress: acc.address });
        await getBalance(acc.address);
        addToast('NeoLine wallet connected', 'success');
      }
    } catch (err: any) {
      addToast('Wallet connection failed', 'error');
      console.error('Wallet connection failed:', err);
    }
  };

  const handleMockInvoke = async () => {
    try {
      const tx = await signAndInvoke({
        scriptHash: 'demo_script_hash',
        operation: 'demoInvoke',
        args: [],
      });
      addToast(`Tx submitted: ${tx.txid}`, 'success');
    } catch (err: any) {
      addToast('Transaction failed', 'error');
    }
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile & Settings</h1>
        <p className="text-gray-600">Manage your profile and preferences.</p>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                getInitials(currentUser.displayName)
              )}
            </div>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  label="Display Name"
                  value={profileData.displayName || ''}
                  onChange={(e) =>
                    setProfileData({ ...profileData, displayName: e.target.value })
                  }
                />
                <Textarea
                  label="Bio / Role"
                  placeholder="I'm here mostly as..."
                  value={profileData.bio || ''}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  rows={3}
                />
                <div className="flex gap-3">
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setProfileData(currentUser);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentUser.displayName}
                  </h2>
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                </div>
                {currentUser.bio && (
                  <p className="text-gray-600 mb-4">{currentUser.bio}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserIcon className="h-4 w-4" />
                  <span>
                    Role: {currentUser.role === 'both' ? 'User & Validator' : currentUser.role}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Wallet & Web3 Section */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Wallet & Web3</h2>
        </div>
        <div className="space-y-4">
          {isWalletConnected && isConnected ? (
            <>
              <div>
                <p className="text-sm text-gray-600 mb-1">Wallet Address</p>
                <p className="font-mono text-sm text-gray-900">
                  {account?.address || currentUser.walletAddress || 'Not connected'}
                </p>
              </div>
              {balances.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Balances</p>
                  <div className="space-y-1 text-sm font-mono text-gray-900">
                    {balances.map((b) => (
                      <div key={`${b.symbol}-${b.asset_hash}`} className="flex justify-between">
                        <span>{b.symbol}</span>
                        <span>{b.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button variant="secondary" onClick={handleWalletConnect}>
                Disconnect Wallet
              </Button>
              <Button variant="primary" onClick={handleMockInvoke}>
                Mock Sign & Submit Tx
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                Connect a Neo-compatible wallet to interact with the blockchain.
              </p>
              <Button variant="primary" onClick={handleWalletConnect}>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Neo-compatible Wallet
              </Button>
            </>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Coming Soon:</strong> Full Neo blockchain integration and SpoonOS
              agent connectivity.
            </p>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Available as Validator</p>
              <p className="text-sm text-gray-600">
                Allow others to invite you as a validator
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentUser.isAvailableAsValidator}
                onChange={(e) =>
                  updatePreferences({ isAvailableAsValidator: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Notifications</p>
              <p className="text-sm text-gray-600">
                Receive email and app notifications
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentUser.notificationsEnabled}
                onChange={(e) =>
                  updatePreferences({ notificationsEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div>
            <Select
              label="Language"
              options={languageOptions}
              value={currentUser.language || 'en'}
              onChange={(e) => updatePreferences({ language: e.target.value })}
              helperText="Interface language (i18n support coming soon)"
            />
          </div>
        </div>
      </Card>

      {/* Danger / Experimental Section */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <h2 className="text-xl font-semibold text-gray-900">Developer / Agent Settings</h2>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Advanced settings for developers and agent integration will be available here in
            the future.
          </p>
        </div>
      </Card>
    </div>
  );
};
