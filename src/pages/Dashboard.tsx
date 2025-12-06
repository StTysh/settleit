import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useDisputesStore } from '../store/disputesStore';
import { generateMockDisputes, getCurrentMockUser } from '../mock';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DisputeStatus } from '../types';
import { Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setUser, isWalletConnected, walletBalances } = useUserStore();
  const { disputes, setDisputes, getUserDisputes, getValidatorDisputes } =
    useDisputesStore();
  const [activeTab, setActiveTab] = useState<'my-disputes' | 'as-validator'>(
    'my-disputes'
  );

  useEffect(() => {
    // Initialize mock user and disputes
    if (!currentUser) {
      const mockUser = getCurrentMockUser();
      setUser(mockUser);
    }
    if (disputes.length === 0) {
      const userId = currentUser?.id || 'user1';
      const mockDisputes = generateMockDisputes(userId);
      setDisputes(mockDisputes);
    }
  }, [currentUser, disputes.length, setUser, setDisputes]);

  const userId = currentUser?.id || 'user1';
  const myDisputes = getUserDisputes(userId);
  const validatorDisputes = getValidatorDisputes(userId);

  const activeDisputes = myDisputes.filter(
    (d) => d.status !== 'Resolved' && d.status !== 'Cancelled'
  );
  const pendingValidatorDecisions = validatorDisputes.filter(
    (d) => d.status === 'In Review'
  );
  const totalResolved = disputes.filter((d) => d.status === 'Resolved').length;

  const getStatusColor = (status: DisputeStatus) => {
    switch (status) {
      case 'Resolved':
        return 'success';
      case 'In Review':
        return 'info';
      case 'Awaiting Funding':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDeadline = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const disputesToShow =
    activeTab === 'my-disputes' ? myDisputes : validatorDisputes;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        {!isWalletConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800">
                Connect wallet to start creating disputes
              </p>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-900">
          Hi, {currentUser?.displayName || 'User'}
        </h1>
        {currentUser?.walletAddress && (
          <p className="text-gray-600 mt-1">{currentUser.walletAddress}</p>
        )}
        {isWalletConnected && walletBalances.length > 0 && (
          <div className="mt-3 inline-flex gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
            {walletBalances.map((b) => (
              <span key={`${b.symbol}-${b.asset_hash}`} className="font-mono">
                {b.symbol}: {b.amount}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Disputes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {activeDisputes.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending as Validator</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {pendingValidatorDecisions.length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Resolved</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalResolved}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Disputes List */}
      <Card>
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('my-disputes')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'my-disputes'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Disputes
          </button>
          <button
            onClick={() => setActiveTab('as-validator')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'as-validator'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            As Validator
          </button>
        </div>

        {disputesToShow.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {activeTab === 'my-disputes'
                ? 'No disputes yet. Create your first dispute!'
                : 'No disputes to validate.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputesToShow.map((dispute) => {
              const isCreator = dispute.creatorId === userId;
              const role = isCreator
                ? 'Creator'
                : dispute.validatorId === userId
                ? 'Validator'
                : 'Opponent';

              return (
                <Link
                  key={dispute.id}
                  to={`/dispute/${dispute.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {dispute.title}
                        </h3>
                        <Badge status={dispute.status}>
                          {dispute.status}
                        </Badge>
                        <span className="text-sm text-gray-500">({role})</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Stake: {dispute.stakeAmount} {dispute.token}</span>
                        <span>•</span>
                        <span>Deadline: {formatDeadline(dispute.deadline)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* Floating Create Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/create-dispute')}
          className="shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Dispute
        </Button>
      </div>
    </div>
  );
};
