import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDisputesStore } from '../store/disputesStore';
import { useUserStore } from '../store/userStore';
import { useUIStore } from '../store/uiStore';
import { useSpoonOS, EvidenceItem } from '../hooks/useSpoonOS';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Timeline } from '../components/ui/Timeline';
import { Input, Textarea, Select } from '../components/ui';
import { Evidence, EvidenceType } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Plus,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  File,
  Sparkles,
} from 'lucide-react';

export const DisputeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDisputeById, updateDispute } = useDisputesStore();
  const { currentUser } = useUserStore();
  const { addToast } = useUIStore();
  const { submitForAnalysis } = useSpoonOS();
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [decisionWinner, setDecisionWinner] = useState<'creator' | 'opponent'>('creator');
  const [decisionReason, setDecisionReason] = useState('');
  const [newEvidence, setNewEvidence] = useState({
    type: 'text' as EvidenceType,
    content: '',
    description: '',
  });

  const dispute = id ? getDisputeById(id) : null;

  useEffect(() => {
    if (!dispute && id) {
      addToast('Dispute not found', 'error');
      navigate('/dashboard');
    }
  }, [dispute, id, navigate, addToast]);

  if (!dispute) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading dispute...</p>
      </div>
    );
  }

  const userId = currentUser?.id || 'user1';
  const isCreator = dispute.creatorId === userId;
  const isOpponent = dispute.opponentId === userId;
  const isValidator = dispute.validatorType === 'human' && dispute.validatorId === userId;
  const isAIAgent = dispute.validatorType === 'ai';
  const canAddEvidence = isCreator || isOpponent;
  const canMakeDecision = isValidator && dispute.status === 'In Review';

  const handleAddEvidence = () => {
    if (!newEvidence.content.trim()) {
      addToast('Please provide evidence content', 'error');
      return;
    }

    const evidence: Evidence = {
      id: `evid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      disputeId: dispute.id,
      type: newEvidence.type,
      content: newEvidence.content,
      submittedBy: userId,
      timestamp: new Date(),
      description: newEvidence.description || undefined,
    };

    updateDispute(dispute.id, {
      evidence: [...dispute.evidence, evidence],
    });

    addToast('Evidence added successfully', 'success');
    setShowEvidenceModal(false);
    setNewEvidence({ type: 'text', content: '', description: '' });
  };

  const toEvidenceItems = (): { creator: EvidenceItem[]; opponent: EvidenceItem[] } => {
    const creatorId = dispute.creatorId;
    const opponentId = dispute.opponentId;
    const creator: EvidenceItem[] = [];
    const opponent: EvidenceItem[] = [];
    dispute.evidence.forEach((ev) => {
      const item: EvidenceItem = {
        id: ev.id,
        type:
          ev.type === 'file'
            ? 'document'
            : ev.type === 'image'
            ? 'image'
            : ev.type === 'link'
            ? 'link'
            : 'text',
        content: ev.content,
        submitted_by: ev.submittedBy === creatorId ? 'creator' : 'opponent',
      };
      if (item.submitted_by === 'creator') {
        creator.push(item);
      } else {
        opponent.push(item);
      }
    });
    return { creator, opponent };
  };

  const handleAgentAnalysis = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const { creator, opponent } = toEvidenceItems();
      const result = await submitForAnalysis(
        dispute.id,
        dispute.title,
        dispute.description,
        creator,
        opponent,
        dispute.stakeAmount + dispute.opponentStakeAmount
      );
      setAiAnalysis(result);
      setShowAIAnalysis(true);
      addToast('AI analysis completed', 'success');
    } catch (err: any) {
      console.error('AI analysis failed', err);
      setAiError(err?.message || 'Analysis failed');
      addToast('AI analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitDecision = () => {
    if (!decisionReason.trim()) {
      addToast('Please provide a reason for your decision', 'error');
      return;
    }

    updateDispute(dispute.id, {
      status: 'Resolved',
      decision: {
        winner: decisionWinner,
        reason: decisionReason,
        decidedAt: new Date(),
        decidedBy: userId,
      },
      resolvedAt: new Date(),
    });

    addToast('Decision submitted successfully', 'success');
    setShowDecisionModal(false);
    setDecisionReason('');
  };

  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case 'text':
        return <FileText className="h-5 w-5" />;
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'link':
        return <LinkIcon className="h-5 w-5" />;
      case 'file':
        return <File className="h-5 w-5" />;
    }
  };

  const evidenceTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'image', label: 'Image' },
    { value: 'link', label: 'Link' },
    { value: 'file', label: 'File' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{dispute.title}</h1>
            <p className="text-gray-600 mt-1">ID: {dispute.id}</p>
          </div>
          <Badge status={dispute.status}>{dispute.status}</Badge>
        </div>
        <Timeline
          status={dispute.status}
          createdAt={dispute.createdAt}
          fundedAt={dispute.fundedAt}
          evidenceSubmittedAt={dispute.evidenceSubmittedAt}
          inReviewAt={dispute.inReviewAt}
          resolvedAt={dispute.resolvedAt}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Parties</p>
                <div className="mt-1 flex items-center gap-4">
                  <div>
                    <span className="font-medium text-gray-900">
                      {isCreator ? 'You' : 'Creator'}
                    </span>
                    <span className="text-gray-600 ml-2">
                      ({dispute.stakeAmount} {dispute.token})
                    </span>
                  </div>
                  <span className="text-gray-400">vs</span>
                  <div>
                    <span className="font-medium text-gray-900">
                      {isOpponent ? 'You' : 'Opponent'}
                    </span>
                    <span className="text-gray-600 ml-2">
                      ({dispute.opponentStakeAmount} {dispute.token})
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Validator</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {dispute.validatorType === 'ai' 
                    ? 'AI Agent (SpoonOS)' 
                    : dispute.validatorId || 'Not assigned'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Staked</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {dispute.stakeAmount + dispute.opponentStakeAmount} {dispute.token}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="mt-1 font-medium text-gray-900">
                  {format(dispute.deadline, 'PPpp')} ({formatDistanceToNow(dispute.deadline, { addSuffix: true })})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="mt-1 font-medium text-gray-900">{dispute.type}</p>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
            {dispute.evidenceRequirements && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Evidence Requirements
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {dispute.evidenceRequirements}
                </p>
              </div>
            )}
          </Card>

          {/* Evidence Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Evidence</h2>
              {canAddEvidence && dispute.status !== 'Resolved' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowEvidenceModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Evidence
                </Button>
              )}
            </div>
            {dispute.evidence.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No evidence submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {dispute.evidence.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEvidenceIcon(evidence.type)}
                        <span className="font-medium text-gray-900">
                          {evidence.type.charAt(0).toUpperCase() + evidence.type.slice(1)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(evidence.timestamp, 'PPp')}
                      </span>
                    </div>
                    {evidence.description && (
                      <p className="text-sm text-gray-600 mb-2">{evidence.description}</p>
                    )}
                    <div className="text-gray-700">
                      {evidence.type === 'link' ? (
                        <a
                          href={evidence.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          {evidence.content}
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap">{evidence.content}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted by: {evidence.submittedBy === userId ? 'You' : evidence.submittedBy}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Decision Section */}
          {dispute.status === 'Resolved' && dispute.decision ? (
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Decision</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Winner</p>
                  <p className="mt-1 font-semibold text-green-600">
                    {dispute.decision.winner === 'creator'
                      ? isCreator
                        ? 'You (Creator)'
                        : 'Creator'
                      : isOpponent
                      ? 'You (Opponent)'
                      : 'Opponent'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reason</p>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                    {dispute.decision.reason}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Decided At</p>
                  <p className="mt-1 text-gray-700">
                    {format(dispute.decision.decidedAt, 'PPpp')}
                  </p>
                </div>
              </div>
            </Card>
          ) : canMakeDecision ? (
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Make Decision</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={decisionWinner === 'creator' ? 'primary' : 'secondary'}
                    onClick={() => setDecisionWinner('creator')}
                  >
                    Award to Creator
                  </Button>
                  <Button
                    variant={decisionWinner === 'opponent' ? 'primary' : 'secondary'}
                    onClick={() => setDecisionWinner('opponent')}
                  >
                    Award to Opponent
                  </Button>
                </div>
                <Textarea
                  label="Reason"
                  placeholder="Explain your decision (visible to both parties)"
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  rows={4}
                />
                <Button
                  variant="primary"
                  onClick={() => setShowDecisionModal(true)}
                  disabled={!decisionReason.trim()}
                >
                  Submit Decision
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Decision</h2>
              <p className="text-gray-600">
                {dispute.status === 'In Review'
                  ? 'Waiting for validator decision...'
                  : 'Decision pending...'}
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Agent Panel */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">AI Agent Insight</h2>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                Powered by SpoonOS
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Run the SpoonOS agent to analyze the evidence and get a recommendation.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAgentAnalysis}
              className="w-full"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
            </Button>
            {aiError && (
              <p className="text-sm text-red-600 mt-3">{aiError}</p>
            )}
            {showAIAnalysis && aiAnalysis && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  Recommendation: {aiAnalysis.recommendation === 'creator' ? 'Creator' : 'Opponent'}
                </p>
                <p className="text-xs text-blue-700">
                  Confidence: {(aiAnalysis.confidence * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">
                  {aiAnalysis.reasoning}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Evidence Modal */}
      <Modal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        title="Add Evidence"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Evidence Type"
            options={evidenceTypeOptions}
            value={newEvidence.type}
            onChange={(e) =>
              setNewEvidence({ ...newEvidence, type: e.target.value as EvidenceType })
            }
          />
          <Input
            label="Description (Optional)"
            placeholder="Brief description of this evidence"
            value={newEvidence.description}
            onChange={(e) =>
              setNewEvidence({ ...newEvidence, description: e.target.value })
            }
          />
          <Textarea
            label={
              newEvidence.type === 'link'
                ? 'Link URL'
                : newEvidence.type === 'image'
                ? 'Image URL'
                : 'Content'
            }
            placeholder={
              newEvidence.type === 'link'
                ? 'https://example.com/proof'
                : newEvidence.type === 'image'
                ? 'https://example.com/image.png'
                : 'Enter your evidence content...'
            }
            value={newEvidence.content}
            onChange={(e) =>
              setNewEvidence({ ...newEvidence, content: e.target.value })
            }
            rows={6}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowEvidenceModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddEvidence}>
              Add Evidence
            </Button>
          </div>
        </div>
      </Modal>

      {/* Decision Confirmation Modal */}
      <Modal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        title="Confirm Decision"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to award the dispute to{' '}
            <strong>
              {decisionWinner === 'creator' ? 'the Creator' : 'the Opponent'}
            </strong>
            ?
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Your Reason:</p>
            <p className="text-gray-600 whitespace-pre-wrap">{decisionReason}</p>
          </div>
          <p className="text-sm text-gray-600">
            This decision is final and will trigger the payout automatically.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDecisionModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitDecision}>
              Confirm Decision
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
