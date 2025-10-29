// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title LockedWorlds - Encrypted key and reward manager
/// @notice Players claim encrypted keys, decrypt attributes, and unlock confidential rewards.
/// @author Locked Worlds
contract LockedWorlds is SepoliaConfig {
    error KeysAlreadyClaimed();
    error KeysNotClaimed();
    error InvalidKeyIndex();
    error KeyNotInitialized();
    error KeyAlreadyUsed();

    /// @notice Amount of encrypted keys minted for each player.
    uint8 public constant KEY_COUNT = 3;

    struct KeySlot {
        euint8 attribute;
        euint16 reward;
        bool used;
        bool initialized;
    }

    mapping(address player => KeySlot[KEY_COUNT] keys) private _playerKeys;
    mapping(address player => euint32 balance) private _coinBalances;
    mapping(address player => bool claimed) private _hasClaimed;

    /// @notice Emitted when a player successfully claims their encrypted keys.
    /// @param player Address of the player that claimed keys.
    event KeysClaimed(address indexed player);

    /// @notice Emitted when a player consumes one of their keys.
    /// @param player Address of the player using the key.
    /// @param keyIndex Index of the key that was consumed.
    /// @param reward Encrypted reward allocated to the key.
    /// @param newBalance Updated encrypted balance after consuming the key.
    event KeyUsed(address indexed player, uint8 indexed keyIndex, euint16 reward, euint32 newBalance);

    /// @notice Ensures the provided key index is within the valid range.
    /// @param index Index of the key to validate.
    modifier onlyValidIndex(uint8 index) {
        if (index > KEY_COUNT - 1) {
            revert InvalidKeyIndex();
        }
        _;
    }

    /// @notice Returns whether a player already claimed their keys.
    /// @param player Address to check.
    /// @return claimed True if keys were already claimed.
    function hasClaimed(address player) external view returns (bool claimed) {
        return _hasClaimed[player];
    }

    /// @notice Returns key metadata for a given player and index.
    /// @param player Address of the key owner.
    /// @param index Index of the key to retrieve.
    /// @return slot Key metadata for the requested index.
    function getKey(address player, uint8 index)
        external
        view
        onlyValidIndex(index)
        returns (KeySlot memory slot)
    {
        slot = _playerKeys[player][index];
        if (!slot.initialized) {
            revert KeyNotInitialized();
        }
        return slot;
    }

    /// @notice Returns all keys for a player.
    /// @param player Address of the key owner.
    /// @return keys Array containing the player's key metadata.
    function getPlayerKeys(address player) external view returns (KeySlot[KEY_COUNT] memory keys) {
        return _playerKeys[player];
    }

    /// @notice Returns the encrypted coin balance for a player.
    /// @param player Address to query.
    /// @return balance Encrypted coin balance belonging to the player.
    function getCoinBalance(address player) external view returns (euint32 balance) {
        return _coinBalances[player];
    }

    /// @notice Claims three encrypted keys for the caller.
    function claimKeys() external {
        if (_hasClaimed[msg.sender]) {
            revert KeysAlreadyClaimed();
        }

        euint32 zeroBalance = FHE.asEuint32(0);
        _coinBalances[msg.sender] = zeroBalance;
        FHE.allowThis(zeroBalance);
        FHE.allow(zeroBalance, msg.sender);

        for (uint8 i = 0; i != KEY_COUNT; ++i) {
            euint8 attribute = _generateAttribute();
            euint16 reward = _generateReward();

            KeySlot storage slot = _playerKeys[msg.sender][i];
            slot.attribute = attribute;
            slot.reward = reward;
            slot.used = false;
            slot.initialized = true;

            FHE.allowThis(slot.attribute);
            FHE.allow(slot.attribute, msg.sender);

            FHE.allowThis(slot.reward);
            FHE.allow(slot.reward, msg.sender);
        }

        _hasClaimed[msg.sender] = true;
        emit KeysClaimed(msg.sender);
    }

    /// @notice Consumes an available key and grants the encrypted reward.
    /// @param index Index of the key being consumed.
    function useKey(uint8 index) external onlyValidIndex(index) {
        if (!_hasClaimed[msg.sender]) {
            revert KeysNotClaimed();
        }

        KeySlot storage slot = _playerKeys[msg.sender][index];
        if (!slot.initialized) {
            revert KeyNotInitialized();
        }
        if (slot.used) {
            revert KeyAlreadyUsed();
        }

        slot.used = true;

        euint32 updatedBalance = FHE.add(_coinBalances[msg.sender], FHE.asEuint32(slot.reward));
        _coinBalances[msg.sender] = updatedBalance;

        FHE.allowThis(updatedBalance);
        FHE.allow(updatedBalance, msg.sender);
        FHE.allow(slot.reward, msg.sender);

        emit KeyUsed(msg.sender, index, slot.reward, updatedBalance);
    }

    /// @notice Generates a random encrypted attribute in the range [1, 3].
    /// @return attribute Encrypted attribute value.
    function _generateAttribute() private returns (euint8 attribute) {
        euint8 randomValue = FHE.randEuint8();
        euint8 bounded = FHE.rem(randomValue, 3);
        return FHE.add(bounded, FHE.asEuint8(1));
    }

    /// @notice Generates a random encrypted reward between 100 and 1000.
    /// @return reward Encrypted reward value.
    function _generateReward() private returns (euint16 reward) {
        euint16 randomValue = FHE.randEuint16();
        euint16 bounded = FHE.rem(randomValue, 901);
        return FHE.add(bounded, FHE.asEuint16(100));
    }
}
