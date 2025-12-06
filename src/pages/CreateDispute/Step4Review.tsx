import React from 'react';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { useNeoIntegration } from '../../hooks/useNeoIntegration';
import { useUIStore } from '../../store/uiStore';
import { CreateDisputeForm } from '../../types';
import { format } from 'date-fns';

interface Step4ReviewProps {
  formData: CreateDisputeForm;
}

export const Step4Review: React.FC<Step4ReviewProps> = ({ formData }) => {
  const { lockStake } = useNeoIntegration();
  const { addToast } = useUIStore();

  const handleLockStake = async () => {
    try {
      const tx = await lockStake('preview_dispute', formData.stakeAmount + formData.opponentStakeAmount, formData.token);
      addToast(`Stake lock submitted: ${tx.txid}`, 'success');
    } catch (err) {
      addToast('Stake lock failed', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
        <p className="text-gray-600">
          Please review all information before confirming your dispute.
        </p>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Title</h3>
            <p className="text-lg font-semibold text-gray-900">{formData.title}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
            <p className="text-gray-900">{formData.type}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{formData.description}</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Parties & Stakes</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Opponent:</span>
                <span className="font-medium text-gray-900">
                  {formData.opponentIdentifier}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Stake:</span>
                <span className="font-medium text-gray-900">
                  {formData.stakeAmount} {formData.token}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Opponent Stake:</span>
                <span className="font-medium text-gray-900">
                  {formData.opponentStakeAmount} {formData.token}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-600">Total Staked:</span>
                <span className="font-bold text-gray-900">
                  {formData.stakeAmount + formData.opponentStakeAmount}{' '}
                  {formData.token}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Validator</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formData.validatorType === 'human' ? 'Human Validator' : 'AI Agent (SpoonOS)'}
                </span>
              </div>
              {formData.validatorType === 'human' && formData.validatorIdentifier && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Validator:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formData.validatorIdentifier}
                  </span>
                </div>
              )}
              {formData.validatorType === 'ai' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Agent:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    SpoonOS AI Agent
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Deadline:</span>
                <span className="font-medium text-gray-900">
                  {format(formData.deadline, 'PPpp')}
                </span>
              </div>
            </div>
          </div>

          {formData.evidenceRequirements && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Evidence Requirements
              </h3>
              <p className="text-gray-900 whitespace-pre-wrap">
                {formData.evidenceRequirements}
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Once confirmed, you'll need to lock your stake to
              finalize the dispute. Both parties must lock their stakes before the dispute
              can proceed to evidence submission.
            </p>
            <div className="mt-3">
              <Button variant="primary" onClick={handleLockStake}>
                Lock Stake (mock)
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
