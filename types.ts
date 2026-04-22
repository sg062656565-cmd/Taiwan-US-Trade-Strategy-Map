
export enum AppStep {
  GLOBAL_VIEW = 'GLOBAL_VIEW',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
  LOCAL_IMPACT = 'LOCAL_IMPACT',
  PREDICTIVE_INSIGHT = 'PREDICTIVE_INSIGHT'
}

export type Industry = 'Semiconductors' | 'Electric Vehicles' | 'Medical Supplies' | 'Steel/Aluminum';

export interface GroundingLink {
  uri: string;
  title: string;
}

export interface NegotiationPoint {
  date: string;
  title: string;
  description: string;
  status: string;
  impact: string;
}

export interface CountryData {
  name: string;
  tariff: string;
  industries: string[];
}
