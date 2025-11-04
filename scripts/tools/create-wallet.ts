import { Wallet } from "ethers";

async function main() {
  console.log("🔐 Creating new account...");

  try {
    const accountName = process.env.ACCOUNT_NAME || "account";
    console.log(`📝 Account name: ${accountName}`);

    // Generate new account
    const wallet = Wallet.createRandom();

    console.log("\n📋 Account Details:");
    console.log(`Address: ${wallet.address}`);
    console.log(`Private Key: ${wallet.privateKey}`);
    console.log(`Mnemonic: ${wallet.mnemonic?.phrase || "N/A"}`);
  } catch (error) {
    console.error("❌ Error creating account:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
