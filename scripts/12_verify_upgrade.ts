import dotenv from "dotenv";
import { ethers, upgrades } from "hardhat";
import { readJsonFile, writeJsonFile } from "./helpers";
dotenv.config();

/**
 * Verify contract upgrade success
 * 
 * Usage: CONTRACT=Fundraise npx hardhat run scripts/12_verify_upgrade.ts --network base
 */

async function main() {
  const contractName = process.env.CONTRACT;

  if (!contractName) {
    console.error("\n❌ CONTRACT not specified");
    console.error("Usage: CONTRACT=<ContractName> npx hardhat run scripts/12_verify_upgrade.ts --network <network>");
    process.exit(1);
  }

  const net = await ethers.provider.getNetwork();
  console.log("\n" + "=".repeat(80));
  console.log(`🌐 Network: ${net.name} (chainId: ${net.chainId})`);
  console.log("=".repeat(80));

  const filePath = `./scripts/config/${net.chainId}-config.json`;
  const config = await readJsonFile(filePath);

  const contractKey = contractName;
  const proxyAddress = config[contractKey];

  if (!proxyAddress) {
    throw new Error(`❌ ${contractName} not found in config`);
  }

  console.log(`\n📋 Contract: ${contractName}`);
  console.log(`📍 Proxy address: ${proxyAddress}`);

  try {
    // Get current implementation
    const currentImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`📦 Current implementation: ${currentImpl}`);

    // Check pending implementation from config
    const pendingImplKey = `${contractName}_impl_pending`;
    const oldImplKey = `${contractName}_impl`;
    
    if (config[pendingImplKey]) {
      console.log(`🔄 Expected implementation: ${config[pendingImplKey]}`);
      
      if (currentImpl.toLowerCase() === config[pendingImplKey].toLowerCase()) {
        console.log("\n✅ UPGRADE SUCCESSFUL! Implementation updated.");
        
        // Update config
        config[oldImplKey] = currentImpl;
        delete config[pendingImplKey];
        await writeJsonFile(filePath, config);
        console.log("💾 Config updated");
      } else {
        console.log("\n⚠️  Implementation NOT updated. Upgrade not yet executed or an error occurred.");
      }
    } else {
      console.log(`📌 Implementation from config: ${config[oldImplKey] || 'not found'}`);
    }

    // Get contract and check owner
    const contract = await ethers.getContractAt(contractName, proxyAddress);
    const owner = await contract.owner();
    console.log(`👤 Owner: ${owner}`);

    // Try to get version if available
    try {
      const version = await contract.version();
      console.log(`📌 Version: ${version}`);
    } catch (e) {
      // Version not implemented - this is normal
    }

    // Check basic functionality
    console.log("\n🔍 Checking basic functionality...");
    
    // Try to call view function
    try {
      await contract.owner();
      console.log("✅ Contract responds to requests");
    } catch (e) {
      console.log("❌ Contract does not respond to requests");
      throw e;
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ Verification completed successfully");
    console.log("=".repeat(80) + "\n");

  } catch (error: any) {
    console.error(`\n❌ Error during verification: ${error.message}\n`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("❌ Critical error:", error);
  process.exit(1);
});

