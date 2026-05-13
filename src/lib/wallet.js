/**
 * Wallet helper utilities
 * All wallet mutations go through these functions to ensure consistency.
 */
import { base44 } from '@/api/base44Client';

/** Get or create wallet for a user */
export async function getOrCreateWallet(userEmail, userName = '') {
  const wallets = await base44.entities.Wallet.filter({ user_email: userEmail });
  if (wallets.length > 0) return wallets[0];
  return base44.entities.Wallet.create({
    user_email: userEmail,
    user_name: userName,
    balance: 0,
    total_funded: 0,
    total_spent: 0,
    total_earned: 0,
    total_withdrawn: 0,
  });
}

/** Record a transaction and update wallet balance */
export async function recordTransaction(wallet, { type, amount, description, reference = '', orderId = '', counterpartyEmail = '', counterpartyName = '' }) {
  const balanceBefore = wallet.balance;
  let delta = 0;

  if (type === 'fund') delta = amount;
  else if (type === 'payment' || type === 'escrow_hold') delta = -amount;
  else if (type === 'escrow_release' || type === 'refund') delta = amount;
  else if (type === 'withdrawal') delta = -amount;

  const balanceAfter = balanceBefore + delta;

  // Update wallet totals
  const walletUpdate = { balance: balanceAfter };
  if (type === 'fund') walletUpdate.total_funded = (wallet.total_funded || 0) + amount;
  if (type === 'payment' || type === 'escrow_hold') walletUpdate.total_spent = (wallet.total_spent || 0) + amount;
  if (type === 'escrow_release') walletUpdate.total_earned = (wallet.total_earned || 0) + amount;
  if (type === 'withdrawal') walletUpdate.total_withdrawn = (wallet.total_withdrawn || 0) + amount;

  await base44.entities.Wallet.update(wallet.id, walletUpdate);

  await base44.entities.Transaction.create({
    user_email: wallet.user_email,
    type,
    amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description,
    reference,
    order_id: orderId,
    counterparty_email: counterpartyEmail,
    counterparty_name: counterpartyName,
    status: 'completed',
  });

  return { ...wallet, ...walletUpdate };
}