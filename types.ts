export enum AgeRange {
  RANGE_0_18 = '0-18',
  RANGE_19_23 = '19-23',
  RANGE_24_28 = '24-28',
  RANGE_29_33 = '29-33',
  RANGE_34_38 = '34-38',
  RANGE_39_43 = '39-43',
  RANGE_44_48 = '44-48',
  RANGE_49_53 = '49-53',
  RANGE_54_58 = '54-58',
  RANGE_59_PLUS = '59+',
}

export type QuoteCategory = 'PF' | 'PME_1' | 'PME_2' | 'PME_30';

export type CoparticipationType = 'full' | 'partial' | 'none';

export interface PlanPriceTable {
  [key: string]: number; // key is AgeRange value
}

export interface HealthPlan {
  id: string;
  name: string;
  operator: string;
  type: 'Enfermaria' | 'Apartamento';
  coparticipationType: CoparticipationType;
  logoColor: string;
  prices: PlanPriceTable;
  hospitals: string[];
  description: string; // Kept for backward compatibility or internal logic if needed, but won't be shown
  categories: QuoteCategory[];
  // New Fields
  coverage: string;
  gracePeriods: string[];
  copayFees: { service: string; value: string }[];
}

export interface UserSelection {
  [key: string]: number; // key is AgeRange value, value is quantity
}

export interface CalculatedPlan {
  plan: HealthPlan;
  totalPrice: number;
  details: { ageRange: string; count: number; unitPrice: number; subtotal: number }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}