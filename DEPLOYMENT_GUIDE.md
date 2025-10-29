# Link Reveal - Deployment & Setup Guide

## Overview

This Farcaster mini app allows users to pay 0.00001 ETH to submit a mystery link that visitors can reveal. The app uses:
- **Frontend**: React + Vite + shadcn/ui
- **Backend**: Express.js
- **Database**: Supabase PostgreSQL
- **Blockchain**: Base Mainnet (ETH payments)
- **Wallet Integration**: Web3 (MetaMask, etc.) + Farcaster Frame SDK

---

## 🗄️ Step 1: Setup Supabase Database

### 1.1 Create Tables

Go to your Supabase SQL Editor at:
**https://tmmqzpybrhmjutotvmxn.supabase.co/project/_/sql/new**

Run this SQL:

```sql
-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  url TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create clicks table
CREATE TABLE IF NOT EXISTS clicks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  link_id VARCHAR REFERENCES links(id),
  clicked_by TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
```

### 1.2 Verify Environment Variables

Ensure these Supabase secrets are set in Replit Secrets:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `DATABASE_URL` - PostgreSQL connection string (with SSL)

---

## ⛓️ Step 2: Deploy Smart Contract

### 2.1 Fund Deployment Wallet

The deployer wallet needs ETH on Base Mainnet for gas fees:

**Deployer Address**: `0x0e98c70F1dE9e8964c597B1b452FE618aeF73b8D`

Send approximately **0.001 ETH** to this address on Base Mainnet for deployment gas.

### 2.2 Run Deployment Script

Once funded, deploy the contract:

```bash
tsx scripts/deploy-contract.ts
```

This will:
1. Deploy `LinkRevealPaymentETH.sol` to Base Mainnet
2. Save the contract address to `deployment.json`
3. Display the contract address to add to Replit Secrets

### 2.3 Add Contract Address to Secrets

After successful deployment, add the contract address to Replit Secrets:
- Secret name: `CONTRACT_ADDRESS`
- Value: The deployed contract address (starts with `0x`)

---

## 🔧 Step 3: Configure Environment

Ensure all required secrets are set in Replit Secrets:

### Required Secrets:
- ✅ `DATABASE_URL` - Supabase PostgreSQL connection
- ✅ `SUPABASE_URL` - Supabase project URL
- ✅ `SUPABASE_ANON_KEY` - Supabase public key
- ✅ `DEPLOYER_PRIVATE_KEY` - Deployment wallet private key
- ⏳ `CONTRACT_ADDRESS` - Deployed contract address (from Step 2)
- ✅ `OWNER_WALLET_ADDRESS` - Wallet to receive payments (0x31F02Ed2c900A157C851786B43772F86151C7E34)

---

## 🚀 Step 4: Start the Application

The application should auto-start via the "Start application" workflow. If not:

```bash
npm run dev
```

This starts:
- Express backend on port 5000
- Vite dev server (proxied through Express)

---

## 🧪 Step 5: Test the Application

### Test Flow:

1. **Open the app** in your browser
2. **Click "Add Link"** button
3. **Connect wallet** (MetaMask or Farcaster Frame wallet)
4. **Enter a URL** (e.g., https://example.com)
5. **Pay 0.00001 ETH** and approve the transaction
6. **Wait for confirmation** - Link is now live
7. **Click "Reveal Link"** button to test redirect

### Verify:

- ✅ Database has new entry in `links` table
- ✅ Transaction appears on BaseScan: https://basescan.org/
- ✅ Payment received at owner wallet
- ✅ Clicking reveals and redirects to submitted URL

---

## 🔍 Troubleshooting

### Database Connection Issues

**Error**: `password authentication failed for user "postgres"`

**Solution**: Make sure `DATABASE_URL` includes the correct password and uses SSL:
```
postgresql://postgres.[ref]:[password]@[host]:6543/postgres
```

Update database connection to always use SSL (already configured in code).

### Contract Not Found

**Error**: `Invalid transaction hash` or payment validation fails

**Solution**: 
1. Verify `CONTRACT_ADDRESS` is set correctly
2. Check transaction on BaseScan
3. Ensure payment went to correct owner wallet address

### Frontend Build Issues

If Vite doesn't start:
```bash
rm -rf node_modules
npm install
npm run dev
```

---

## 📝 Payment Validation

The backend validates every submitted link transaction:

1. **Transaction Hash Format**: Must be valid 0x... hash
2. **Transaction Status**: Must be successful on Base Mainnet
3. **Recipient Address**: Must match `OWNER_WALLET_ADDRESS`
4. **Amount**: Must be >= 0.00001 ETH (10,000,000,000,000 wei)

All validations happen in `server/contract-utils.ts`.

---

## 🌐 Network Information

- **Network**: Base Mainnet
- **Chain ID**: 8453
- **RPC URL**: https://mainnet.base.org
- **Block Explorer**: https://basescan.org
- **Payment Token**: Native ETH
- **Payment Amount**: 0.00001 ETH

---

## 📚 Additional Resources

- **Supabase Dashboard**: https://tmmqzpybrhmjutotvmxn.supabase.co
- **Base Documentation**: https://docs.base.org
- **Contract Source**: `contracts/LinkRevealPaymentETH.sol`
- **Deployment Script**: `scripts/deploy-contract.ts`

---

## 🎯 Next Steps

1. ✅ Run SQL in Supabase to create tables
2. ⏳ Fund deployer wallet with ETH on Base Mainnet
3. ⏳ Deploy smart contract
4. ⏳ Add `CONTRACT_ADDRESS` to Replit Secrets
5. ✅ Test the full user flow
6. 🚀 Share your Farcaster Frame!

---

**Need Help?**

Check logs in Replit console or Supabase dashboard for detailed error messages.
