/**
 * SpoonOS Agent Integration Hook
 *
 * Connects the React frontend to the SpoonOS Python backend
 * for AI-powered dispute analysis and resolution.
 */

const API_BASE_URL = import.meta.env.VITE_SPOON_API_URL || 'http://localhost:8000';

// Types
interface EvidenceItem {
  id: string;
  type: 'text' | 'image' | 'document' | 'link';
  content: string;
  submitted_by: 'creator' | 'opponent';
}

interface AnalysisRequest {
  dispute_id: string;
  title: string;
  description: string;
  creator_evidence: EvidenceItem[];
  opponent_evidence: EvidenceItem[];
  stake_amount?: number;
}

interface AnalysisResponse {
  dispute_id: string;
  recommendation: 'creator' | 'opponent' | null;
  confidence: number;
  reasoning: string;
  evidence_scores: {
    creator: number;
    opponent: number;
  };
  status: string;
}

interface AgentStatus {
  status: 'ready' | 'not_configured';
  provider: string;
  model: string;
  message: string;
}

interface QuickAnalysisResponse {
  dispute_id: string;
  preliminary_leaning: 'creator' | 'opponent' | 'undecided';
  creator_evidence_count: number;
  opponent_evidence_count: number;
  message: string;
}

export const useSpoonOS = () => {
  /**
   * Check if the SpoonOS agent is properly configured and ready.
   */
  const checkAgentStatus = async (): Promise<AgentStatus> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/spoon/status`);
      if (!response.ok) {
        throw new Error('Failed to check agent status');
      }
      return await response.json();
    } catch (error) {
      console.error('SpoonOS status check failed:', error);
      return {
        status: 'not_configured',
        provider: 'none',
        model: 'none',
        message: 'Failed to connect to SpoonOS backend',
      };
    }
  };

  /**
   * Submit a dispute for full AI analysis.
   * The SpoonOS agent will analyze all evidence and provide a recommendation.
   */
  const submitForAnalysis = async (
    disputeId: string,
    title: string,
    description: string,
    creatorEvidence: EvidenceItem[],
    opponentEvidence: EvidenceItem[],
    stakeAmount?: number
  ): Promise<AnalysisResponse> => {
    const request: AnalysisRequest = {
      dispute_id: disputeId,
      title,
      description,
      creator_evidence: creatorEvidence,
      opponent_evidence: opponentEvidence,
      stake_amount: stakeAmount || 0,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/spoon/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Analysis failed');
      }

      return await response.json();
    } catch (error) {
      console.error('SpoonOS analysis failed:', error);
      throw error;
    }
  };

  /**
   * Get a quick preliminary analysis without full agent reasoning.
   * Useful for real-time UI feedback while waiting for full analysis.
   */
  const getQuickAnalysis = async (
    disputeId: string,
    title: string,
    description: string,
    creatorEvidence: EvidenceItem[],
    opponentEvidence: EvidenceItem[]
  ): Promise<QuickAnalysisResponse> => {
    const request: AnalysisRequest = {
      dispute_id: disputeId,
      title,
      description,
      creator_evidence: creatorEvidence,
      opponent_evidence: opponentEvidence,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/spoon/quick-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Quick analysis failed');
      }

      return await response.json();
    } catch (error) {
      console.error('SpoonOS quick analysis failed:', error);
      throw error;
    }
  };

  /**
   * Unified helper: run full analysis with prepared request object.
   */
  const analyzeDispute = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
    return submitForAnalysis(
      request.dispute_id,
      request.title,
      request.description,
      request.creator_evidence,
      request.opponent_evidence,
      request.stake_amount,
    );
  };

  return {
    // New SpoonOS integration methods
    checkAgentStatus,
    submitForAnalysis,
    getQuickAnalysis,
    analyzeDispute,
  };
};

// Export types for use in components
export type {
  EvidenceItem,
  AnalysisRequest,
  AnalysisResponse,
  AgentStatus,
  QuickAnalysisResponse,
};
