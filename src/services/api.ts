'use client';

import { TebexHeadless } from 'tebex_headless';

let tebexInstance: TebexHeadless | null = null;

/**
 * Initializes the Tebex headless client with the given public key.
 * This must be called before using any Tebex hooks.
 */
export function initTebexClient(publicKey: string): void {
  tebexInstance = new TebexHeadless(publicKey);
}

/**
 * Returns the initialized Tebex client.
 * Throws if the client has not been initialized.
 */
export function getTebexClient(): TebexHeadless {
  if (tebexInstance === null) {
    throw new Error('Tebex client not initialized. Make sure you are using TebexProvider.');
  }
  return tebexInstance;
}

/**
 * Checks if the Tebex client is initialized.
 */
export function isTebexClientInitialized(): boolean {
  return tebexInstance !== null;
}

/**
 * Resets the Tebex client. Useful for testing.
 */
export function resetTebexClient(): void {
  tebexInstance = null;
}
