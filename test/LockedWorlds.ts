import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { LockedWorlds, LockedWorlds__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("LockedWorlds")) as LockedWorlds__factory;
  const contract = (await factory.deploy()) as LockedWorlds;
  const address = await contract.getAddress();

  return { contract, address };
}

describe("LockedWorlds", function () {
  let signers: Signers;
  let contract: LockedWorlds;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ contract, address: contractAddress } = await deployFixture());
  });

  it("allows players to claim encrypted keys with valid attributes and rewards", async function () {
    await contract.connect(signers.alice).claimKeys();

    expect(await contract.hasClaimed(signers.alice.address)).to.equal(true);

    const balance = await contract.getCoinBalance(signers.alice.address);
    const clearBalance = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      balance,
      contractAddress,
      signers.alice,
    );
    expect(clearBalance).to.equal(0);

    for (let i = 0; i < 3; i++) {
      const key = await contract.getKey(signers.alice.address, i);
      expect(key.used).to.equal(false);
      expect(key.initialized).to.equal(true);

      const attribute = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        key.attribute,
        contractAddress,
        signers.alice,
      );
      expect(attribute).to.be.gte(1);
      expect(attribute).to.be.lte(3);

      const reward = await fhevm.userDecryptEuint(
        FhevmType.euint16,
        key.reward,
        contractAddress,
        signers.alice,
      );
      expect(reward).to.be.gte(100);
      expect(reward).to.be.lte(1000);
    }
  });

  it("grants encrypted coins when a key is used", async function () {
    await contract.connect(signers.alice).claimKeys();

    const key = await contract.getKey(signers.alice.address, 0);
    const clearReward = await fhevm.userDecryptEuint(
      FhevmType.euint16,
      key.reward,
      contractAddress,
      signers.alice,
    );

    await contract.connect(signers.alice).useKey(0);

    const updatedKey = await contract.getKey(signers.alice.address, 0);
    expect(updatedKey.used).to.equal(true);

    const balance = await contract.getCoinBalance(signers.alice.address);
    const clearBalance = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      balance,
      contractAddress,
      signers.alice,
    );

    expect(clearBalance).to.equal(clearReward);
  });

  it("prevents double claiming and reusing keys", async function () {
    await contract.connect(signers.alice).claimKeys();
    await expect(contract.connect(signers.alice).claimKeys()).to.be.revertedWithCustomError(
      contract,
      "KeysAlreadyClaimed",
    );

    await contract.connect(signers.alice).useKey(1);
    await expect(contract.connect(signers.alice).useKey(1)).to.be.revertedWithCustomError(
      contract,
      "KeyAlreadyUsed",
    );
  });
});
