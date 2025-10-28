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

**In Progress**: Backend implementation with Supabase and smart contract integration

## Recent Changes
- 2025-10-28: Created complete frontend with all components
- 2025-10-28: Defined database schema for links and clicks
- 2025-10-28: Created Solidity smart contract for USDC payment handling

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
  - `POST /api/links` - Submits new link after USDC payment
  - `POST /api/clicks` - Records a click event
  - `GET /api/recent-clicks` - Returns recent click history

### Smart Contract (Solidity)
- **Contract**: `LinkRevealPayment.sol`
- **Network**: Base Sepolia testnet
- **Function**: Accepts 1 USDC payment and transfers to owner wallet
- **Owner Wallet**: 0x31F02Ed2c900A157C851786B43772F86151C7E34

### Database
- **Provider**: Supabase
- **Connection**: Direct PostgreSQL connection
- **Tables**: links, clicks (with foreign key relationships)

## Configuration

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `OWNER_WALLET_ADDRESS` - Wallet to receive USDC payments (0x31F02Ed2c900A157C851786B43772F86151C7E34)
- `BASE_SEPOLIA_RPC_URL` - RPC endpoint for Base Sepolia
- `SESSION_SECRET` - Session encryption key (already configured)

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

## Next Steps
1. Implement backend API routes with Supabase integration
2. Deploy smart contract to Base Sepolia
3. Connect frontend to backend with Web3 wallet integration
4. Add Farcaster authentication
5. Test end-to-end payment and link submission flow
6. Deploy to production on Base mainnet
