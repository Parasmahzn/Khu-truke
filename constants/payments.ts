export const PAYMENT_TYPES = ['Cash', 'Card', 'Digital'] as const;
export type PaymentType = typeof PAYMENT_TYPES[number];
