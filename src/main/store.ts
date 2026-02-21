import Store from 'electron-store';
import { Persona, Settings } from './types';

interface StoreSchema {
  personas: Persona[];
  settings: Settings;
  metrics: {
    totalQueries: number;
    uniqueDomains: string[];
    entropyScore: number;
  };
}

const store = new Store<StoreSchema>({
  defaults: {
    personas: [],
    settings: {
      apiKey: '',
      safeList: ['wikipedia.org', 'allrecipes.com', 'bbc.com', 'cnn.com', 'medium.com'],
      killSwitch: false
    },
    metrics: {
      totalQueries: 0,
      uniqueDomains: [],
      entropyScore: 0
    }
  }
});

export default store;
