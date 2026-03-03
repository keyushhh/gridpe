export interface WalletTransaction {
    id: string;
    user_id: string;
    type: 'credit' | 'debit' | 'held' | 'deposit';
    transaction_type?: 'credit' | 'debit' | 'held' | 'deposit'; // Legacy field
    amount: number;
    status: string;
    created_at: string;
    description: string;
    reference_id?: string;
    metadata?: Record<string, unknown>;
    date?: string; // used locally for legacy mapping
}

export interface Payout {
    id: string;
    user_id: string;
    amount: number;
    status: string;
    created_at: string;
}

/**
 * Calculates the total wallet balance based on transaction history and payouts.
 * 
 * Rules:
 * 1. Balance = Sum of all 'completed' credits - Sum of all 'completed' payouts.
 * 2. If type is 'credit' or description contains 'top-up', status is 'completed' by default.
 */
export const calculateBalance = (transactions: WalletTransaction[], payouts: Payout[] = []): number => {
    if (!transactions || !Array.isArray(transactions)) return 0;

    const credits = transactions.reduce((total, tx) => {
        const type = (tx.type || tx.transaction_type)?.toLowerCase();
        const description = tx.description?.toLowerCase() || '';
        const rawStatus = tx.status?.toLowerCase();
        
        const isTopUp = type === 'credit' || description.includes('top-up');
        const isCompleted = isTopUp || rawStatus === 'completed';

        if (isCompleted && (type === 'credit' || type === 'deposit')) {
            return total + (Number(tx.amount) || 0);
        }
        return total;
    }, 0);

    const withdrawals = (payouts || []).reduce((total, p) => {
        const status = p.status?.toLowerCase();
        // Support both 'completed' and 'success' for robust matching
        if (status === 'completed' || status === 'success') {
            return total + (Number(p.amount) || 0);
        }
        return total;
    }, 0);

    const otherDebits = transactions.reduce((total, tx) => {
        const type = (tx.type || tx.transaction_type)?.toLowerCase();
        const description = tx.description?.toLowerCase() || '';
        const rawStatus = tx.status?.toLowerCase();

        if (type === 'debit' && rawStatus === 'completed') {
            // AVOID DOUBLE COUNTING:
            // If this is a withdrawal, we already count it from the 'payouts' table.
            if (description.includes('withdrawal')) {
                return total;
            }
            // This covers FX exchange, cash delivery, etc.
            return total + (Number(tx.amount) || 0);
        }
        return total;
    }, 0);

    return Math.floor(credits - (withdrawals + otherDebits));
};

/**
 * Calculates the total balance currently on hold.
 * 
 * Rules:
 * 1. On hold = Sum of all transactions with status === 'held'.
 */
export const calculateHeldBalance = (transactions: WalletTransaction[]): number => {
    if (!transactions || !Array.isArray(transactions)) return 0;

    const total = transactions.reduce((sum, tx) => {
        if (tx.status?.toLowerCase() === 'held') {
            return sum + (Number(tx.amount) || 0);
        }
        return sum;
    }, 0);

    return Math.abs(total);
};
