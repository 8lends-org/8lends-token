import dotenv from "dotenv";
import { ethers } from "hardhat";
import { readJsonFile } from "../helpers";
import { createMerkleTree } from "../helpers";
import { parseUnits } from "ethers";
dotenv.config();

async function main() {
  const net = await ethers.provider.getNetwork();
  console.log(`\nNetwork name: ${net.name}\n`);

  const filePath = `./scripts/config/${net.chainId}-config.json`;
  const config = await readJsonFile(filePath);

  const [signer] = await ethers.getSigners();
  console.log("Signer:", await signer.getAddress());

  const signerBalance = await ethers.provider.getBalance(await signer.getAddress());
  console.log("Signer native balance:", ethers.formatEther(signerBalance));

  // Check required addresses
  if (!config.Fundraise) {
    throw new Error("Fundraise address not found in config");
  }
  if (!config.usdc && !config.testUsdt) {
    throw new Error("USDC/testUsdt address not found in config");
  }

  const usdcAddress = config.usdc || config.testUsdt;
  const fundraiseAddress = config.Fundraise;

  console.log("Fundraise address:", fundraiseAddress);
  console.log("USDC address:", usdcAddress);

  // Connect to contracts
  const fundraise = await ethers.getContractAt("Fundraise", fundraiseAddress);
  const usdcToken = await ethers.getContractAt("MockERC20", usdcAddress);

  // Get current project count
  const currentProjectCount = await fundraise.projectCount();
  console.log(`Current project count: ${currentProjectCount}`);

  // Constants
  const PLATFORM_PERCENT = parseUnits("3", 4); // 3%
  const INVESTOR_INTEREST_RATE = parseUnits("20", 4); // 20%
  const PROJECTS_TO_CREATE = 40;

  // Get current block timestamp
  const currentTime = await ethers.provider.getBlock("latest");
  if (!currentTime) {
    throw new Error("Failed to get current block");
  }
  const now = BigInt(currentTime.timestamp);

  // Create MerkleTree with signer address (for open whitelist)
  // Using signer address to create a valid MerkleTree root
  const merkleTree = await createMerkleTree([await signer.getAddress()]);
  const merkleRoot = merkleTree.getHexRoot();

  console.log(`\nCreating ${PROJECTS_TO_CREATE} projects...`);
  console.log("=".repeat(80));

  let nonce = await signer.getNonce()
  // Create projects
  for (let i = 0; i < PROJECTS_TO_CREATE; i++) {
    const projectIndex = Number(currentProjectCount) + i;

    // Variate project parameters
    const softCapAmount = 10000 + (i % 10) * 5000; // 10k to 55k
    const hardCapAmount = softCapAmount * 2; // hardCap = 2x softCap
    const daysOffset = i % 30; // 0 to 29 days
    const preFundDuration = 7 * 24 * 3600; // 7 days
    const openStageDuration = 14 * 24 * 3600; // 14 days

    const projectData = {
      softCap: parseUnits(softCapAmount.toString(), 6),
      hardCap: parseUnits(hardCapAmount.toString(), 6),
      totalInvested: 0,
      startAt: now + BigInt(daysOffset * 24 * 3600), // Start in the future
      preFundDuration: BigInt(preFundDuration),
      investorInterestRate: INVESTOR_INTEREST_RATE,
      openStageEndAt: now + BigInt((daysOffset + 14) * 24 * 3600), // 14 days after start
      innerStruct: {
        borrower: await signer.getAddress(), // Use signer as borrower
        loanToken: usdcAddress,
        platformInterestRate: PLATFORM_PERCENT,
        totalRepaid: 0,
        fundedTime: 0,
        stage: 0 // ComingSoon
      }
    };

    const projectHash = projectIndex + 1; // Unique hash for each project

    try {
      const tx = await fundraise.connect(signer).createProject(
        projectData,
        merkleRoot,
        projectHash, {nonce: nonce}
      );
      nonce++;
      console.log(`[${i + 1}/${PROJECTS_TO_CREATE}] Creating project ${projectIndex}...`);
      console.log(`  Transaction hash: ${tx.hash}`);
    //   await tx.wait();
    await new Promise((r)=>setTimeout(r,1000))
      console.log(`  ✅ Project ${projectIndex} created successfully`);
      console.log(`  SoftCap: ${softCapAmount} USDC, HardCap: ${hardCapAmount} USDC`);
      console.log(`  StartAt: ${new Date(Number(projectData.startAt) * 1000).toISOString()}`);
      console.log("");
    } catch (error: any) {
      console.error(`  ❌ Failed to create project ${projectIndex}:`, error.message);
      throw error;
    }
  }

  // Verify final project count
  const finalProjectCount = await fundraise.projectCount();
  console.log("=".repeat(80));
  console.log(`✅ Successfully created ${PROJECTS_TO_CREATE} projects!`);
  console.log(`Final project count: ${finalProjectCount}`);
  console.log(`Expected project count: ${Number(currentProjectCount) + PROJECTS_TO_CREATE}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
  process.exit(1);
});

