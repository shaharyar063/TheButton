# Link Reveal - Farcaster Mini App

## Overview
A Farcaster-integrated mini app where users can pay 1 USDC to submit a mystery link that gets revealed when visitors click the main button. Built with React, Express, Supabase, and Base blockchain integration.

## Purpose
- Allow users to pay 1 USDC (on Base Sepolia testnet) to submit a destination link
- Visitors click a prominent reveal button to be redirected to the current mystery link
- Display real-time click activity in a scrollable feed at the bottom
- Integrate with Farcaster for authentication and profile display

## Current State
**Phase 1 Complete**: Schema & Frontend
- ✅ Data models defined (links, clicks) with proper TypeScript types
- ✅ Design system configured with clean white background and Inter/Roboto Mono fonts
- ✅ All React components built:
  - Header with Farcaster profile avatar and Add Link button
  - Centered reveal button with beautiful styling and hover effects
  - Add Link modal with URL input and "Post (1 USDC)" payment button
  - Activity slider showing recent clicks with timestamps
  - Responsive design following Material Design + Web3 patterns

**Complete**: Backend implementation with Supabase and transaction verification

## Recent Changes
- 2025-10-28: Fixed Supabase database connection and transaction verification
- 2025-10-28: Implemented comprehensive USDC payment verification before accepting links
- 2025-10-28: Updated to use direct USDC transfers instead of smart contract
- 2025-10-28: Created complete frontend with all components
- 2025-10-28: Defined database schema for links and clicks

## Project Architecture

### Frontend (React + TypeScript)
- **Pages**: Single-page app (`home.tsx`)
- **Components**:
  - `header.tsx` - Top navigation with branding and user profile
  - `reveal-button.tsx` - Main CTA button for link revelation
  - `add-link-modal.tsx` - Modal for submitting new links with payment
  - `activity-slider.tsx` - Bottom feed showing click history
- **Styling**: Tailwind CSS with shadcn/ui components
- **State**: TanStack Query for API data fetching

### Backend (Express + TypeScript)
- **Database**: Supabase PostgreSQL
  - `links` table: Stores submitted URLs with transaction hashes
  - `clicks` table: Tracks every button click with timestamps
- **API Routes**:
  - `GET /api/current-link` - Fetches the latest submitted link
  - `POST /api/links` - Submits new link after USDC payment verification
  - `POST /api/clicks` - Records a click event
  - `GET /api/recent-clicks` - Returns recent click history
- **Transaction Verification**: 
  - Verifies transaction exists on Base Sepolia blockchain
  - Confirms transaction succeeded (not failed/reverted)
  - Validates USDC transfer to correct owner wallet
  - Ensures payment amount is at least 1 USDC

### Payment System
- **Method**: Direct USDC transfers (no smart contract required)
- **Network**: Base Sepolia testnet
- **USDC Contract**: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
- **Owner Wallet**: 0x31F02Ed2c900A157C851786B43772F86151C7E34
- **Amount**: 1 USDC (1,000,000 units with 6 decimals)
- **Note**: Smart contract code exists in `/contracts` but is not currently deployed or used

### Database
- **Provider**: Supabase
- **Connection**: Direct PostgreSQL connection
- **Tables**: links, clicks (with foreign key relationships)

## Configuration

### Environment Variables
- `DATABASE_URL` - Supabase PostgreSQL connection string (configured)
- `OWNER_WALLET_ADDRESS` - Wallet to receive USDC payments (0x31F02Ed2c900A157C851786B43772F86151C7E34)
- `BASE_SEPOLIA_RPC_URL` - RPC endpoint for Base Sepolia (defaults to https://sepolia.base.org)

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
1. ✅ Database connection - Switched to Supabase PostgreSQL, data now persists
2. ✅ Transaction verification - Failed transactions are now rejected before storing
3. ✅ Payment validation - Verifies USDC amount, recipient, and transaction success
4. ✅ Error handling - Proper error messages for failed/invalid transactions

## Farcaster Integration
- ✅ Farcaster Frame support - Frame with link to open the full app
- ✅ Frame SDK integration - Detects when running in Frame context and shows user profile
- ✅ Frame metadata endpoint - Proper server-side rendering at `/frame`
- ✅ User profile display - Shows Farcaster avatar and username when in Frame context
- ✅ Secure implementation - Frame links to app, no unverified POST endpoints

### Frame Features
- Frame serves as an entry point to the app in Farcaster feeds
- When users open the app from a Frame, their Farcaster profile is automatically detected
- Click tracking records Farcaster FID when available via Frame SDK
- All sensitive operations (payments, link submission) require proper wallet connection
- Frame metadata dynamically generated with correct URLs

## Next Steps
1. Test end-to-end payment and link submission flow with real wallet
2. Deploy to production on Base mainnet
3. (Optional) Implement standalone Sign In with Farcaster with proper verification
