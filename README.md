# Mystery Link Button - Farcaster Frame

A Farcaster Frame that lets users share mystery links as interactive buttons. When someone views the frame in their Farcaster feed, they see a clickable button that opens the mystery link directly in their browser.

## Features

- 🔗 **Mystery Link Sharing**: Submit a link that gets shared as an interactive Farcaster Frame
- 💰 **ETH Payment Verification**: Requires on-chain payment verification for link submissions
- 📊 **Click Tracking**: Track who clicks your mystery link
- 🎨 **Beautiful Frame Design**: Gradient background with animated button
- 🚀 **Vercel-Ready**: Fully configured for serverless deployment

## Live Demo

[Add your Vercel URL here after deployment]

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js (Serverless on Vercel)
- **Database**: PostgreSQL (Vercel Postgres or Neon)
- **Blockchain**: Ethereum/Base network payment verification
- **Frame Protocol**: Farcaster Frames v2 specification

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mystery-link-button
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5000
   ```

### Deploy to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

Quick deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

## How It Works

### For Link Submitters

1. Visit the app homepage
2. Submit a link you want to share (requires ETH payment)
3. Payment is verified on-chain
4. Link is activated as the current mystery link
5. Share the frame URL on Farcaster

### For Link Clickers

1. See the mystery link frame in their Farcaster feed
2. Click the "Open Link" button
3. Redirected to the mystery link
4. Click is tracked in the analytics

## Frame URL Structure

- **Frame endpoint**: `https://your-app.vercel.app/frame`
- **Frame image**: `https://your-app.vercel.app/api/frame/image`
- **Click tracking**: Automatic via frame actions

## API Endpoints

- `GET /frame` - Farcaster Frame HTML (with meta tags)
- `GET /api/frame/image` - Dynamic frame image (SVG/PNG)
- `GET /api/frame/redirect` - Click tracking redirect
- `POST /api/frame/action` - Frame button action handler
- `GET /api/current-link` - Get active mystery link
- `POST /api/links` - Submit new mystery link (requires payment)
- `GET /api/recent-clicks` - Get recent click analytics
- `GET /api/base-url` - Get canonical base URL

## Environment Variables

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-here
OWNER_WALLET_ADDRESS=0x...
VITE_OWNER_WALLET_ADDRESS=0x...
BASE_MAINNET_RPC_URL=https://mainnet.base.org
```

See `.env.example` for complete list.

## Database Schema

- **links**: Mystery link submissions
  - `id`, `url`, `submittedBy`, `txHash`, `submittedAt`
  
- **clicks**: Click tracking
  - `id`, `linkId`, `clickedBy`, `clickerUsername`, `clickedAt`

Managed with Drizzle ORM. See `shared/schema.ts`.

## Payment Verification

Links require on-chain ETH payment verification:

1. User sends ETH to configured wallet address
2. Transaction hash is submitted with link
3. Backend verifies transaction on Base network
4. Link is activated if payment is valid

Contract address and amount configured via environment variables.

## Project Structure

```
├── api/              # Vercel serverless functions
│   └── index.ts      # Main Express API
├── client/           # React frontend
│   └── src/
│       ├── pages/    # Page components
│       └── components/ # Reusable components
├── server/           # Backend logic
│   ├── routes.ts     # API routes (dev mode)
│   ├── storage.ts    # Database interface
│   └── contract-utils.ts # Blockchain verification
├── shared/           # Shared types/schemas
│   └── schema.ts     # Database schema + Zod validation
└── vercel.json       # Vercel configuration
```

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production build locally
npm run check        # TypeScript type checking
npm run db:push      # Push database schema changes
```

## Testing Frames

Use the official Warpcast Frame Validator:
https://warpcast.com/~/developers/frames

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Open a GitHub issue
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review Farcaster Frames documentation

## Acknowledgments

- Built with [Farcaster Frames](https://docs.farcaster.xyz/learn/what-is-farcaster/frames)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Deployed on [Vercel](https://vercel.com)
