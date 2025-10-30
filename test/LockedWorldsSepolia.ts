import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { deployments, ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { LockedWorlds } from "../types";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("LockedWorldsSepolia", function () {
  let signers: Signers;
  let contract: LockedWorlds;
  let contractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const deployment = await deployments.get("LockedWorlds");
      contractAddress = deployment.address;
      contract = (await ethers.getContractAt("LockedWorlds", deployment.address)) as LockedWorlds;
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async function () {
    step = 0;
    steps = 0;
  });

  it("claims encrypted keys and consumes one on Sepolia", async function () {
    steps = 8;
    this.timeout(4 * 40000);

    progress("Checking existing claim status...");
    const alreadyClaimed = await contract.hasClaimed(signers.alice.address);
    if (alreadyClaimed) {
      progress("Keys already claimed for signer, skipping test");
      this.skip();
    }

    progress("Calling claimKeys...");
    let tx = await contract.connect(signers.alice).claimKeys();
    await tx.wait();

    progress("Fetching first key metadata...");
    const key = await contract.getKey(signers.alice.address, 0);

    progress("Decrypting key attribute...");
    const attribute = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      key.attribute,
      contractAddress,
      signers.alice,
    );
    expect(attribute).to.be.gte(1);
    expect(attribute).to.be.lte(3);

    progress("Decrypting key reward...");
    const reward = await fhevm.userDecryptEuint(
      FhevmType.euint16,
      key.reward,
      contractAddress,
      signers.alice,
    );
    expect(reward).to.be.gte(100);
    expect(reward).to.be.lte(1000);

    progress("Consuming the key...");
    tx = await contract.connect(signers.alice).useKey(0);
    await tx.wait();

    progress("Reading encrypted balance...");
    const balance = await contract.getCoinBalance(signers.alice.address);

    progress("Decrypting balance...");
    const clearBalance = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      balance,
      contractAddress,
      signers.alice,
    );
    expect(clearBalance).to.equal(reward);
  });
});
