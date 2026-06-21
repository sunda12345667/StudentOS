/**
 * Wallet service layer
 * All balance reads go through these helpers. Never mutate balances outside these functions.
 */
import { base44 } from '@/api/base44Client';

/** Get or create wallet for a user */
export async function getOrCreateWallet(userEmail, userName = '') {
  const wallets = await base44.entities.Wallet.filter({ user_email: userEmail });
  if (wallets.length > 0) return wallets[0];
  return base44.entities.Wallet.create({
    user_email: userEmail,
    user_name: userName,
    wallet_balance: 0,
    pending_earnings: 0,
    available_earnings: 0,
    total_funded: 0,
    total_spent: 0,
    total_earned: 0,
    total_withdrawn: 0,
    is_frozen: false,
  });
}

/** Total spendable = wallet_balance only (earnings are not for spending) */
export function getSpendableBalance(wallet) {
  return wallet?.wallet_balance || 0;
}

/** Total withdrawable = available_earnings only */
export function getWithdrawableBalance(wallet) {
  return wallet?.available_earnings || 0;
}

/** Sum of all three balances */
export function getTotalBalance(wallet) {
  return (wallet?.wallet_balance || 0) + (wallet?.pending_earnings || 0) + (wallet?.available_earnings || 0);
}