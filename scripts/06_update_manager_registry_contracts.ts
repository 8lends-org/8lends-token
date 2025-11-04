import dotenv from "dotenv";
import hre, { ethers } from "hardhat";
import { readJsonFile } from "./helpers";
dotenv.config();

async function main() {
  const net = await ethers.provider.getNetwork();
  const filePath = `./scripts/config/${net.chainId}-config.json`;
  const config = await readJsonFile(filePath);

  console.log(`\nUpdating contract addresses in ManagerRegistry...`);
  console.log(`Network: ${net.name} (Chain ID: ${net.chainId})`);

  const [signer] = await ethers.getSigners();
  console.log(`Signer: ${await signer.getAddress()}`);

  // Get contract addresses from configuration
  const managerRegistryAddress = config.ManagerRegistry;
  const rewardSystemAddress = config.RewardSystem;
  const fundraiseAddress = config.Fundraise;
  const treasuryAddress = config.Treasury;
  const poolAddress = config.pool;
  const tokenAddress = config.token;

  if (!managerRegistryAddress) {
    throw new Error("ManagerRegistry contract not found in config");
  }

  if (!rewardSystemAddress) {
    throw new Error("RewardSystem contract not found in config");
  }

  if (!fundraiseAddress) {
    throw new Error("Fundraise contract not found in config");
  }

  if (!treasuryAddress) {
    throw new Error("Treasury contract not found in config");
  }

  console.log(`\nContract addresses:`);
  console.log(`ManagerRegistry: ${managerRegistryAddress}`);
  console.log(`RewardSystem: ${rewardSystemAddress}`);
  console.log(`Fundraise: ${fundraiseAddress}`);
  console.log(`Treasury: ${treasuryAddress}`);
  console.log(`Token: ${tokenAddress}`);
  console.log(`Pool: ${poolAddress}`);

  // Connect to ManagerRegistry contract
  const managerRegistry = await ethers.getContractAt("ManagerRegistry", managerRegistryAddress);

  // Check owner rights
  const owner = await managerRegistry.owner();
  if (owner.toLowerCase() !== (await signer.getAddress()).toLowerCase()) {
    throw new Error("Not the owner of ManagerRegistry contract");
  }

  console.log(`\nSetting contract addresses...`);

  // Call setContractAddresses method
  const tx = await managerRegistry.setContractAddresses(
    rewardSystemAddress,
    fundraiseAddress,
    treasuryAddress
  );

  console.log(`Transaction hash: ${tx.hash}`);
  console.log(`Waiting for confirmation...`);

  const receipt = await tx.wait(5);
  console.log(`✅ Contract addresses updated successfully!`);
  console.log(`Gas used: ${receipt?.gasUsed.toString()}`);

  // Check that addresses are set correctly
  console.log(`\nVerifying addresses...`);
  const currentRewardSystem = await managerRegistry.rewardSystemAddress();
  const currentFundraise = await managerRegistry.fundraiseAddress();
  const currentTreasury = await managerRegistry.treasuryAddress();

  console.log(`Current RewardSystem: ${currentRewardSystem}`);
  console.log(`Current Fundraise: ${currentFundraise}`);
  console.log(`Current Treasury: ${currentTreasury}`);

  // Check correspondence
  if (currentRewardSystem.toLowerCase() !== rewardSystemAddress.toLowerCase()) {
    throw new Error("RewardSystem address mismatch");
  }
  if (currentFundraise.toLowerCase() !== fundraiseAddress.toLowerCase()) {
    throw new Error("Fundraise address mismatch");
  }
  if (currentTreasury.toLowerCase() !== treasuryAddress.toLowerCase()) {
    throw new Error("Treasury address mismatch");
  }

  console.log(`✅ All addresses verified successfully!`);

  // Set ManagerRegistry in Token contract
  if (tokenAddress) {
    console.log(`\nSetting ManagerRegistry in Token contract...`);
    
    const token = await ethers.getContractAt("Token", tokenAddress);
    
    // Check if ManagerRegistry is already set
    const currentManagerRegistry = await token.managerRegistry();
    if (currentManagerRegistry === "0x0000000000000000000000000000000000000000") {
      const tokenTx = await token.setManagerRegistry(managerRegistryAddress);
      console.log(`Token transaction hash: ${tokenTx.hash}`);
      await tokenTx.wait(5);
      console.log(`✅ ManagerRegistry set in Token contract!`);
    } else {
      console.log(`⚠️  ManagerRegistry already set in Token: ${currentManagerRegistry}`);
    }
  }

  // Information about pool
  if (poolAddress) {
    console.log(
      `\nNote: Pool address (${poolAddress}) is available but not set in ManagerRegistry.`
    );
    console.log(`To set pool status, use: setPoolStatus("${poolAddress}", true)`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
