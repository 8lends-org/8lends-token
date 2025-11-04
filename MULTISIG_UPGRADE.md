# Contract Upgrades via Gnosis Safe

Instructions for updating contracts when the owner is a Gnosis Safe multisig.

## Upgrade Process

### 1. Data Preparation

Run the script to deploy a new implementation and generate data:

```bash
CONTRACT=Fundraise npx hardhat run scripts/11_prepare_upgrade_for_multisig.ts --network base
```

The script will output:
- ✅ New implementation address
- ✅ Calldata for upgradeToAndCall
- ✅ JSON file with data

### 2. Transaction Builder in Safe

1. Open https://app.safe.global/
2. Select your Safe (correct network)
3. Go to **Apps** → **Transaction Builder**
4. Click **Create Batch**
5. Add transaction:
   - **To**: proxy contract address (from script output)
   - **Value**: 0
   - **Data**: calldata (from script output)
6. Click **Add transaction**
7. Review details and click **Create Batch**

### 3. Signature Collection

1. The created transaction will appear in **Transactions** → **Queue**
2. Each signer must:
   - Open the transaction
   - Review details (To, Data, Value)
   - Click **Confirm**
3. When enough signatures are collected (threshold), the **Execute** button will become active

### 4. Execution

1. The last signer (or anyone after threshold) clicks **Execute**
2. Confirms in MetaMask
3. Waits for transaction confirmation

### 5. Verification

```bash
CONTRACT=Fundraise npx hardhat run scripts/12_verify_upgrade.ts --network base
```

## Example

```bash
# 1. Prepare Fundraise upgrade on Base Mainnet
CONTRACT=Fundraise npx hardhat run scripts/11_prepare_upgrade_for_multisig.ts --network base

# Output:
# 📤 DATA FOR TRANSACTION BUILDER IN GNOSIS SAFE
# To: 0xc9dB2B5F73531a1280585d58Fd9a933552BB8316
# Value: 0
# Data: 0x4f1ef286000000000000000000000000...

# 2. Insert data into Transaction Builder on https://app.safe.global/

# 3. Collect signatures

# 4. Execute transaction

# 5. Verify
CONTRACT=Fundraise npx hardhat run scripts/12_verify_upgrade.ts --network base
# ✅ UPGRADE SUCCESSFUL! Implementation updated.
```

## Alternative Method: Contract Interaction

If Transaction Builder is unavailable, you can use **Contract Interaction**:

1. In Safe, select **New Transaction** → **Contract Interaction**
2. Enter the **proxy** contract address
3. Insert contract **ABI** or select method manually:
   - Method: `upgradeToAndCall`
   - Parameters:
     - `newImplementation`: new impl address
     - `data`: `0x`
4. Value: `0`
5. **Create** → collect signatures → **Execute**

## Important

- ⚠️ Test on testnet before mainnet
- ⚠️ Verify calldata before signing
- ⚠️ Ensure Safe has enough ETH for gas
- ⚠️ Save JSON files with upgrade data

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Transaction Builder not loading | Use Contract Interaction |
| Insufficient ETH for gas | Top up Safe |
| Calldata too long | This is normal for upgrades, proceed |
| "Not owner" on execution | Ensure Safe is the contract owner |

## Links

- Safe App: https://app.safe.global/
- Transaction Builder: https://app.safe.global/ → Apps → Transaction Builder
- BaseScan: https://basescan.org
