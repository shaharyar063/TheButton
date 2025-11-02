import { storage } from './storage';

let lastOwnershipId: string | null = null;

export function startOwnershipExpiryChecker() {
  const CHECK_INTERVAL = 60000; // Check every 60 seconds

  setInterval(async () => {
    try {
      const currentOwnership = await storage.getActiveOwnership();
      
      if (currentOwnership && currentOwnership.id !== lastOwnershipId) {
        console.log(`🔵 New active ownership detected: ${currentOwnership.ownerAddress.slice(0, 10)}... (expires in ${Math.floor((new Date(currentOwnership.expiresAt).getTime() - Date.now()) / 1000)}s)`);
        lastOwnershipId = currentOwnership.id;
      } else if (!currentOwnership && lastOwnershipId) {
        console.log(`⏰ Ownership expired! Button is now available for purchase.`);
        lastOwnershipId = null;
      }
    } catch (error) {
      console.error('Error checking ownership expiry:', error);
    }
  }, CHECK_INTERVAL);

  console.log('✅ Ownership expiry checker started (runs every 60 seconds)');
}
