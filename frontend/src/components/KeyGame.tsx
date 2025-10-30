import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import '../styles/KeyGame.css';

type KeySlot = {
  attribute: string;
  reward: string;
  used: boolean;
  initialized: boolean;
};

type DecryptionMap = Record<number, number>;

const ATTRIBUTE_NAMES: Record<number, string> = {
  1: 'Gold',
  2: 'Silver',
  3: 'Diamond',
};

const EMPTY_KEY: KeySlot = {
  attribute: '0x0000000000000000000000000000000000000000000000000000000000000000',
  reward: '0x0000000000000000000000000000000000000000000000000000000000000000',
  used: false,
  initialized: false,
};

const DEFAULT_KEYS: KeySlot[] = [EMPTY_KEY, EMPTY_KEY, EMPTY_KEY];

export function KeyGame() {
  const { address, isConnected } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();

  const [claiming, setClaiming] = useState(false);
  const [usingIndex, setUsingIndex] = useState<number | null>(null);
  const [decryptingAttributeIndex, setDecryptingAttributeIndex] = useState<number | null>(null);
  const [decryptingRewardIndex, setDecryptingRewardIndex] = useState<number | null>(null);
  const [decryptingBalance, setDecryptingBalance] = useState(false);
  const [decryptedAttributes, setDecryptedAttributes] = useState<DecryptionMap>({});
  const [decryptedRewards, setDecryptedRewards] = useState<DecryptionMap>({});
  const [decryptedBalance, setDecryptedBalance] = useState<number | null>(null);

  const {
    data: hasClaimedData,
    refetch: refetchHasClaimed,
    isFetching: fetchingClaimStatus,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasClaimed',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: false,
    },
  });

  const {
    data: keysData,
    refetch: refetchKeys,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerKeys',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: false,
    },
  });

  const {
    data: balanceData,
    refetch: refetchBalance,
    isFetching: fetchingBalance,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getCoinBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: false,
    },
  });

  const hasClaimed = Boolean(hasClaimedData);

  const keys: KeySlot[] = useMemo(() => {
    if (!keysData) {
      return DEFAULT_KEYS;
    }

    const value = keysData as unknown as KeySlot[];

    return Array.from({ length: 3 }, (_item, index) => {
      const slot = value?.[index] ?? EMPTY_KEY;
      return {
        attribute: typeof slot.attribute === 'string' ? slot.attribute : EMPTY_KEY.attribute,
        reward: typeof slot.reward === 'string' ? slot.reward : EMPTY_KEY.reward,
        used: Boolean(slot.used),
        initialized: Boolean(slot.initialized),
      };
    });
  }, [keysData]);

  const balanceHandle =
    typeof balanceData === 'string'
      ? balanceData
      : '0x0000000000000000000000000000000000000000000000000000000000000000';

  const resetDecryptionState = useCallback(() => {
    setDecryptedAttributes({});
    setDecryptedRewards({});
    setDecryptedBalance(null);
  }, []);

  useEffect(() => {
    resetDecryptionState();
  }, [address, resetDecryptionState]);

  useEffect(() => {
    if (!hasClaimed) {
      resetDecryptionState();
    }
  }, [hasClaimed, resetDecryptionState]);

  const ensureSigner = useCallback(async () => {
    if (!signerPromise) {
      throw new Error('Wallet is not connected');
    }
    const resolvedSigner = await signerPromise;
    if (!resolvedSigner) {
      throw new Error('Signer is not ready');
    }
    return resolvedSigner;
  }, [signerPromise]);

  const decryptHandles = useCallback(
    async (handles: string[]) => {
      if (!instance) {
        throw new Error('Encryption service is not ready');
      }
      if (!address) {
        throw new Error('Connect your wallet first');
      }

      const signer = await ensureSigner();
      const keypair = instance.generateKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [CONTRACT_ADDRESS];
      const handleContractPairs = handles.map((handle) => ({
        handle,
        contractAddress: CONTRACT_ADDRESS,
      }));

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimestamp,
        durationDays,
      );

      const signature = await signer.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message,
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimestamp,
        durationDays,
      );

      return handles.map((handle) => {
        const raw = result[handle];
        if (typeof raw === 'string') {
          return Number(raw);
        }
        if (typeof raw === 'number') {
          return raw;
        }
        if (raw && typeof raw.toString === 'function') {
          return Number(raw.toString());
        }
        return 0;
      });
    },
    [address, ensureSigner, instance],
  );

  const handleClaimKeys = useCallback(async () => {
    if (!isConnected) {
      alert('Connect your wallet to claim keys.');
      return;
    }

    setClaiming(true);
    try {
      const signer = await ensureSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.claimKeys();
      await tx.wait();

      resetDecryptionState();
      await Promise.all([refetchHasClaimed(), refetchKeys(), refetchBalance()]);
    } catch (error) {
      console.error('Failed to claim keys:', error);
      alert(
        error instanceof Error ? `Failed to claim keys: ${error.message}` : 'Failed to claim keys.',
      );
    } finally {
      setClaiming(false);
    }
  }, [
    ensureSigner,
    isConnected,
    refetchBalance,
    refetchHasClaimed,
    refetchKeys,
    resetDecryptionState,
  ]);

  const handleUseKey = useCallback(
    async (index: number) => {
      setUsingIndex(index);
      try {
        const signer = await ensureSigner();
        const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const tx = await contract.useKey(index);
        await tx.wait();

        await Promise.all([refetchKeys(), refetchBalance()]);
      } catch (error) {
        console.error('Failed to use key:', error);
        alert(error instanceof Error ? `Failed to use key: ${error.message}` : 'Failed to use key');
      } finally {
        setUsingIndex(null);
      }
    },
    [ensureSigner, refetchBalance, refetchKeys],
  );

  const handleDecryptAttribute = useCallback(
    async (index: number, handle: string) => {
      setDecryptingAttributeIndex(index);
      try {
        const [value] = await decryptHandles([handle]);
        setDecryptedAttributes((prev) => ({ ...prev, [index]: value }));
      } catch (error) {
        console.error('Failed to decrypt attribute:', error);
        alert(
          error instanceof Error
            ? `Failed to decrypt attribute: ${error.message}`
            : 'Failed to decrypt attribute',
        );
      } finally {
        setDecryptingAttributeIndex(null);
      }
    },
    [decryptHandles],
  );

  const handleDecryptReward = useCallback(
    async (index: number, handle: string) => {
      setDecryptingRewardIndex(index);
      try {
        const [value] = await decryptHandles([handle]);
        setDecryptedRewards((prev) => ({ ...prev, [index]: value }));
      } catch (error) {
        console.error('Failed to decrypt reward:', error);
        alert(
          error instanceof Error
            ? `Failed to decrypt reward: ${error.message}`
            : 'Failed to decrypt reward',
        );
      } finally {
        setDecryptingRewardIndex(null);
      }
    },
    [decryptHandles],
  );

  const handleDecryptBalance = useCallback(
    async (handle: string) => {
      setDecryptingBalance(true);
      try {
        const [value] = await decryptHandles([handle]);
        setDecryptedBalance(value);
      } catch (error) {
        console.error('Failed to decrypt balance:', error);
        alert(
          error instanceof Error
            ? `Failed to decrypt balance: ${error.message}`
            : 'Failed to decrypt balance',
        );
      } finally {
        setDecryptingBalance(false);
      }
    },
    [decryptHandles],
  );

  if (!isConnected) {
    return (
      <div className="game-container">
        <div className="info-banner">
          <h2 className="info-title">Locked Worlds</h2>
          <p className="info-subtitle">
            Connect your wallet to claim encrypted keys and unlock your rewards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="info-banner">
        <h2 className="info-title">Encrypted Key Vault</h2>
        <p className="info-subtitle">
          Claim three homomorphically encrypted keys. Decrypt their attributes and spend them to
          reveal confidential rewards.
        </p>
      </div>

      {zamaError ? (
        <div className="error-banner">
          <strong>Encryption service error:</strong> {zamaError}
        </div>
      ) : null}

      <div className="actions-card">
        <div className="actions-text">
          <span className="actions-title">Key Allocation</span>
          <span className="actions-status">
            {fetchingClaimStatus ? 'Checking status...' : hasClaimed ? 'Keys claimed' : 'Available'}
          </span>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={handleClaimKeys}
          disabled={claiming || hasClaimed || zamaLoading}
        >
          {claiming ? 'Claiming...' : hasClaimed ? 'Keys already claimed' : 'Claim encrypted keys'}
        </button>
      </div>

      <div className="keys-grid">
        {keys.map((key, index) => {
          const attributeValue = decryptedAttributes[index];
          const rewardValue = decryptedRewards[index];
          const attributeLabel =
            attributeValue && ATTRIBUTE_NAMES[attributeValue]
              ? ATTRIBUTE_NAMES[attributeValue]
              : attributeValue
              ? `Attribute ${attributeValue}`
              : 'Encrypted';
          const rewardLabel = rewardValue ? `${rewardValue} coins` : 'Encrypted';

          const attributeDisabled =
            !hasClaimed ||
            !key.initialized ||
            decryptingAttributeIndex === index ||
            zamaLoading ||
            claiming;

          const rewardDisabled =
            !hasClaimed ||
            !key.initialized ||
            decryptingRewardIndex === index ||
            zamaLoading ||
            claiming;

          const useDisabled =
            !hasClaimed ||
            !key.initialized ||
            key.used ||
            usingIndex === index ||
            claiming ||
            zamaLoading;

          return (
            <div key={index} className={`key-card ${key.used ? 'key-card-used' : ''}`}>
              <div className="key-header">
                <span className="key-label">Key #{index + 1}</span>
                <span className={`key-status ${key.used ? 'key-status-used' : 'key-status-ready'}`}>
                  {key.used ? 'Used' : key.initialized ? 'Ready' : 'Unclaimed'}
                </span>
              </div>

              <div className="key-section">
                <span className="key-section-label">Attribute</span>
                <span className="key-section-value">{attributeLabel}</span>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={attributeDisabled}
                  onClick={() => handleDecryptAttribute(index, key.attribute)}
                >
                  {decryptingAttributeIndex === index ? 'Decrypting...' : 'Decrypt attribute'}
                </button>
              </div>

              <div className="key-section">
                <span className="key-section-label">Reward</span>
                <span className="key-section-value">{rewardLabel}</span>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={rewardDisabled}
                  onClick={() => handleDecryptReward(index, key.reward)}
                >
                  {decryptingRewardIndex === index ? 'Decrypting...' : 'Decrypt reward'}
                </button>
              </div>

              <button
                type="button"
                className="primary-button key-use-button"
                disabled={useDisabled}
                onClick={() => handleUseKey(index)}
              >
                {usingIndex === index ? 'Unlocking...' : key.used ? 'Already used' : 'Use key'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="balance-card">
        <div>
          <h3 className="balance-title">Encrypted Coin Balance</h3>
          <p className="balance-subtitle">
            Use your keys to accumulate randomized encrypted coins between 100 and 1000 per key.
          </p>
        </div>
        <div className="balance-value">
          <span className="balance-amount">
            {decryptedBalance !== null ? `${decryptedBalance} coins` : 'Encrypted'}
          </span>
          <button
            type="button"
            className="secondary-button"
            disabled={
              zamaLoading ||
              decryptingBalance ||
              !hasClaimed ||
              fetchingBalance
            }
            onClick={() => handleDecryptBalance(balanceHandle)}
          >
            {decryptingBalance ? 'Decrypting...' : 'Decrypt balance'}
          </button>
        </div>
      </div>

      <div className="helper-card">
        <h4 className="helper-title">How it works</h4>
        <ul className="helper-list">
          <li>Claim to mint three keys with encrypted attributes.</li>
          <li>Decrypt attributes with the Zama relayer to see whether they are Gold, Silver or Diamond.</li>
          <li>Each key hides an encrypted coin reward between 100 and 1000 coins.</li>
          <li>Using a key reveals and deposits its reward into your encrypted balance.</li>
        </ul>
      </div>
    </div>
  );
}
