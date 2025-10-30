import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { TaskArguments } from "hardhat/types";

const CONTRACT_NAME = "LockedWorlds";

function findSigner(signers: HardhatEthersSigner[], address: string): HardhatEthersSigner {
  const normalized = address.toLowerCase();
  const signer = signers.find((s) => s.address.toLowerCase() === normalized);
  if (!signer) {
    throw new Error(`Signer ${address} is not available in the current Hardhat environment`);
  }
  return signer;
}

task("task:address", "Prints the LockedWorlds address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;
  const deployment = await deployments.get(CONTRACT_NAME);
  console.log(`${CONTRACT_NAME} address is ${deployment.address}`);
});

task("task:claim", "Calls claimKeys() for a player")
  .addOptionalParam("address", "Optionally specify the contract address")
  .addOptionalParam("player", "Player address (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers } = hre;

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get(CONTRACT_NAME);
    const signers = await ethers.getSigners();

    const playerAddress = (taskArguments.player as string | undefined) ?? signers[0].address;
    const signer = findSigner(signers, playerAddress);

    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const tx = await contract.connect(signer).claimKeys();
    console.log(`claimKeys tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`claimKeys status: ${receipt?.status}`);
  });

task("task:use-key", "Consumes a key and decrypts the reward")
  .addParam("index", "Key index (0-2)")
  .addOptionalParam("address", "Optionally specify the contract address")
  .addOptionalParam("player", "Player address (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const index = Number(taskArguments.index);
    if (!Number.isInteger(index) || index < 0 || index > 2) {
      throw new Error("--index must be 0, 1 or 2");
    }

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get(CONTRACT_NAME);
    const signers = await ethers.getSigners();

    const playerAddress = (taskArguments.player as string | undefined) ?? signers[0].address;
    const signer = findSigner(signers, playerAddress);

    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const tx = await contract.connect(signer).useKey(index);
    console.log(`useKey tx: ${tx.hash}`);
    await tx.wait();

    const key = await contract.getKey(playerAddress, index);
    const reward = await fhevm.userDecryptEuint(FhevmType.euint16, key.reward, deployment.address, signer);
    const balance = await contract.getCoinBalance(playerAddress);
    const clearBalance = await fhevm.userDecryptEuint(FhevmType.euint32, balance, deployment.address, signer);

    console.log(`Key ${index} reward (decrypted): ${reward}`);
    console.log(`Updated balance (decrypted): ${clearBalance}`);
  });

task("task:key", "Decrypts a key attribute and reward")
  .addParam("index", "Key index (0-2)")
  .addOptionalParam("address", "Optionally specify the contract address")
  .addOptionalParam("player", "Player address (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const index = Number(taskArguments.index);
    if (!Number.isInteger(index) || index < 0 || index > 2) {
      throw new Error("--index must be 0, 1 or 2");
    }

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get(CONTRACT_NAME);
    const signers = await ethers.getSigners();

    const playerAddress = (taskArguments.player as string | undefined) ?? signers[0].address;
    const signer = findSigner(signers, playerAddress);

    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const key = await contract.getKey(playerAddress, index);

    const attribute = await fhevm.userDecryptEuint(FhevmType.euint8, key.attribute, deployment.address, signer);
    const reward = await fhevm.userDecryptEuint(FhevmType.euint16, key.reward, deployment.address, signer);

    console.log(`Key ${index} attribute (decrypted): ${attribute}`);
    console.log(`Key ${index} reward (decrypted):    ${reward}`);
    console.log(`Key ${index} used: ${key.used}`);
  });

task("task:balance", "Decrypts the encrypted coin balance")
  .addOptionalParam("address", "Optionally specify the contract address")
  .addOptionalParam("player", "Player address (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get(CONTRACT_NAME);
    const signers = await ethers.getSigners();

    const playerAddress = (taskArguments.player as string | undefined) ?? signers[0].address;
    const signer = findSigner(signers, playerAddress);

    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const balance = await contract.getCoinBalance(playerAddress);
    const clearBalance = await fhevm.userDecryptEuint(FhevmType.euint32, balance, deployment.address, signer);

    console.log(`Encrypted balance: ${balance}`);
    console.log(`Decrypted balance: ${clearBalance}`);
  });
