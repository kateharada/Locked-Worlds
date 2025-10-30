export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "KEY_COUNT",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimKeys",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint8",
        "name": "keyIndex",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "euint16",
        "name": "reward",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "euint32",
        "name": "newBalance",
        "type": "bytes32"
      }
    ],
    "name": "KeyUsed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "KeysClaimed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getCoinBalance",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "index",
        "type": "uint8"
      }
    ],
    "name": "getKey",
    "outputs": [
      {
        "components": [
          {
            "internalType": "euint8",
            "name": "attribute",
            "type": "bytes32"
          },
          {
            "internalType": "euint16",
            "name": "reward",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "used",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "initialized",
            "type": "bool"
          }
        ],
        "internalType": "struct LockedWorlds.KeySlot",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getPlayerKeys",
    "outputs": [
      {
        "components": [
          {
            "internalType": "euint8",
            "name": "attribute",
            "type": "bytes32"
          },
          {
            "internalType": "euint16",
            "name": "reward",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "used",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "initialized",
            "type": "bool"
          }
        ],
        "internalType": "struct LockedWorlds.KeySlot[3]",
        "name": "",
        "type": "tuple[3]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "hasClaimed",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "index",
        "type": "uint8"
      }
    ],
    "name": "useKey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
