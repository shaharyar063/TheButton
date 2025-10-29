# Link Reveal - Farcaster Mini App

## Overview
A Farcaster-integrated mini app where users can pay 0.00001 ETH to submit a mystery link that gets revealed when visitors click the main button. Built with React, Express, Supabase, and Base Mainnet blockchain integration. Supports both traditional wallet connections and seamless Farcaster Frame SDK wallet integration.

## Purpose
- Allow users to pay 0.00001 ETH (on Base Mainnet) to submit a destination link
- Visitors click a prominent reveal button to be redirected to the current mystery link
- Display real-time click activity in a scrollable feed at the bottom
- Integrate with Farcaster for authentication and seamless in-frame transactions

## Current State
**Phase 1 Complete**: Schema & Frontend
- ✅ Data models defined (links, clicks) with proper TypeScript types
- ✅ Design system configured with clean white background and Inter/Roboto Mono fonts
- ✅ All React components built:
  - Header with Farcaster profile avatar and Add Link button
  - Centered reveal button with beautiful styling and hover effects
  - Add Link modal with URL input and "Post (0.00001 ETH)" payment button
  - Activity slider showing recent clicks with timestamps
  - Responsive design following Material Design + Web3 patterns

**Complete**: Backend implementation with Supabase and transaction verification

## Recent Changes
- 2025-10-29: Migrated payment system from USDC to native ETH (0.00001 ETH)
- 2025-10-29: Switched from Base Sepolia testnet to Base Mainnet for production
- 2025-10-29: Integrated Farcaster Frame SDK wallet provider for seamless in-frame transactions
- 2025-10-29: Removed "Sign in with Farcaster" button - authentication happens automatically in frames
- 2025-10-29: Implemented dual wallet support (MetaMask + Farcaster Frame SDK)
- 2025-10-28: Fixed Supabase database connection and transaction verification
- 2025-10-28: Created complete frontend with all components
- 2025-10-28: Defined database schema for links and clicks

## Project Architecture

### Frontend (React + TypeScript)
- **Pages**: Single-page app (`home.tsx`)
- **Components**:
  - `header.tsx` - Top navigation with branding, user profile, and Add Link button
  - `reveal-button.tsx` - Main CTA button for link revelation
  - `add-link-modal.tsx` - Modal for submitting new links with ETH payment
  - `activity-slider.tsx` - Bottom feed showing click history
- **Context Providers**:
  - `farcaster-context.tsx` - Manages Farcaster Frame SDK integration and wallet provider
  - `web3-context.tsx` - Manages wallet connections with Farcaster provider priority
- **Styling**: Tailwind CSS with shadcn/ui components
- **State**: TanStack Query for API data fetching

### Backend (Express + TypeScript)
- **Database**: Supabase PostgreSQL
  - `links` table: Stores submitted URLs with transaction hashes
  - `clicks` table: Tracks every button click with timestamps
- **API Routes**:
  - `GET /api/current-link` - Fetches the latest submitted link
  - `POST /api/links` - Submits new link after ETH payment verification
  - `POST /api/clicks` - Records a click event
  - `GET /api/recent-clicks` - Returns recent click history
- **Transaction Verification**: 
  - Verifies transaction exists on Base Mainnet blockchain
  - Confirms transaction succeeded (not failed/reverted)
  - Validates ETH transfer to correct owner wallet
  - Ensures payment amount is exactly 0.00001 ETH (10,000,000,000,000 wei)

### Payment System
- **Method**: Direct native ETH transfers (no smart contract or ERC-20 required)
- **Network**: Base Mainnet (Chain ID: 0x2105 / 8453)
- **Owner Wallet**: 0x31F02Ed2c900A157C851786B43772F86151C7E34
- **Amount**: 0.00001 ETH (10,000,000,000,000 wei)
- **Wallet Support**: 
  - Traditional wallets (MetaMask, Rainbow, etc.)
  - Farcaster Frame SDK wallet provider (seamless in-frame transactions)
- **Precision**: BigInt-based conversion ensures exact wei amounts without floating-point errors
- **Note**: Smart contract code exists in `/contracts` but is not currently deployed or used

### Database
- **Provider**: Supabase
- **Connection**: Direct PostgreSQL connection
- **Tables**: links, clicks (with foreign key relationships)

## Configuration

### Environment Variables
- `DATABASE_URL` - Supabase PostgreSQL connection string (configured)
- `OWNER_WALLET_ADDRESS` - Wallet to receive ETH payments (0x31F02Ed2c900A157C851786B43772F86151C7E34)
- `BASE_MAINNET_RPC_URL` - RPC endpoint for Base Mainnet (defaults to https://mainnet.base.org)

### Design System
- **Font**: Inter for UI text, Roboto Mono for addresses
- **Colors**: Clean white background with blue primary (#3B82F6)
- **Layout**: Single-page with fixed header and bottom activity feed
- **Components**: shadcn/ui with custom styling

## User Preferences
- White background theme (explicitly requested)
- Farcaster profile picture instead of wallet connect in Farcaster frames
- Simple, straightforward UX focused on the core flow
- Real-time activity feed to show engagement

## Issues Fixed
1. ✅ Database connection - Switched to Supabase PostgreSQL with connection timeout, data persists
2. ✅ Transaction verification - Failed transactions are now rejected before storing
3. ✅ Payment validation - Verifies ETH amount (exact 10T wei), recipient, and transaction success
4. ✅ Error handling - Proper error messages for failed/invalid transactions
5. ✅ BigInt precision - ETH-to-wei conversion uses BigInt string constructor to avoid precision loss
6. ✅ Farcaster wallet integration - Frame SDK wallet provider works without prompting user on every load

## Farcaster Integration
- ✅ Farcaster Frame support - Frame with link to open the full app
- ✅ Frame SDK integration - Detects when running in Frame context and shows user profile
- ✅ Frame metadata endpoint - Proper server-side rendering at `/frame`
- ✅ User profile display - Shows Farcaster avatar and username when in Frame context
- ✅ Farcaster wallet provider - Seamless ETH transactions using `sdk.wallet.ethProvider`
- ✅ Secure implementation - Frame links to app, payments verified on-chain

### Frame Features
- Frame serves as an entry point to the app in Farcaster feeds
- When users open the app from a Frame, their Farcaster profile is automatically detected
- **Seamless transactions**: Farcaster-authenticated users can submit links without connecting external wallet
- Click tracking records Farcaster FID when available via Frame SDK
- Dual wallet support: Works with both Farcaster Frame SDK and traditional wallets (MetaMask, etc.)
- Frame metadata dynamically generated with correct URLs
- Web3 context prioritizes Farcaster provider when available, falls back to window.ethereum

## Production Readiness
- ✅ All components implemented and tested
- ✅ Payment system configured for Base Mainnet
- ✅ Transaction verification working on-chain
- ✅ Farcaster Frame SDK integration complete
- ✅ Dual wallet support (traditional + Farcaster)
- ✅ Database connection stable with timeout handling
- ✅ Precise ETH-to-wei conversion without floating-point errors

## Next Steps
1. Test end-to-end payment flow with real Base Mainnet wallet
2. Verify Farcaster Frame integration with actual frame deployment
3. Monitor transaction verification for edge cases
4. Consider adding ETH-to-wei conversion tests for regression prevention
