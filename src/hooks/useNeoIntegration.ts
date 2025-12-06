/**
 * Minimal Neo integration helpers
 * Uses NeoLine N3 when available, otherwise falls back to mocked txids so UI can demo flows.
 */
type InvokeParams = {
  scriptHash: string;
  operation: string;
  args: any[];
  signers?: any[];
};

type NeoLineInvokeClient = {
  invoke: (params: InvokeParams & { fee?: string; broadcastOverride?: boolean }) => Promise<{ result: { txid: string } }>;
};

export const useNeoIntegration = () => {
  const getClient = () => (window as any)?.NeoLineN3 as NeoLineInvokeClient | null;

  const readContract = async (scriptHash: string, operation: string, args: any[]) => {
    // For now, just log; real read would use RPC or invoke with `signers: []`.
    console.log('Contract read placeholder', { scriptHash, operation, args });
    return null;
  };

  const signAndInvoke = async (params: InvokeParams) => {
    const client = getClient();
    if (!client) {
      console.warn('NeoLine not available; returning mock tx');
      return { txid: `mock_tx_${Date.now()}` };
    }

    try {
      const { result } = await client.invoke({ ...params, broadcastOverride: false });
      return { txid: result.txid };
    } catch (err) {
      console.error('invoke failed', err);
      throw err;
    }
  };

  const transferTokens = async (tokenHash: string, from: string, to: string, amount: number) => {
    const args = [
      { type: 'Hash160', value: from },
      { type: 'Hash160', value: to },
      { type: 'Integer', value: amount },
    ];
    return signAndInvoke({ scriptHash: tokenHash, operation: 'transfer', args });
  };

  const lockStake = async (disputeId: string, amount: number, token: string) => {
    const args = [
      { type: 'String', value: disputeId },
      { type: 'Integer', value: amount },
      { type: 'String', value: token },
    ];
    return signAndInvoke({ scriptHash: 'stake_contract_hash_placeholder', operation: 'lockStake', args });
  };

  const releaseStake = async (disputeId: string, winner: 'creator' | 'opponent') => {
    const args = [
      { type: 'String', value: disputeId },
      { type: 'String', value: winner },
    ];
    return signAndInvoke({ scriptHash: 'stake_contract_hash_placeholder', operation: 'releaseStake', args });
  };

  return {
    readContract,
    signAndInvoke,
    transferTokens,
    lockStake,
    releaseStake,
  };
};
