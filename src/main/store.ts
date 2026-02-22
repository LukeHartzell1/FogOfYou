import Store from 'electron-store';
import { Persona, Settings } from './types';

interface StoreSchema {
  personas: Persona[];
  settings: Settings;
  metrics: {
    totalQueries: number;
    uniqueDomains: string[];
    entropyScore: number;
    domainVisits: Record<string, number>;
  };
}

const store = new Store<StoreSchema>({
  defaults: {
    personas: [],
    settings: {
      apiKey: '',
      safeList: [
        'wikipedia.org', 'allrecipes.com', 'bbc.com', 'cnn.com', 'medium.com',
        'amazon.com', 'youtube.com',
        'reuters.com', 'apnews.com', 'npr.org', 'pbs.org',
        'simplyrecipes.com', 'budgetbytes.com', 'seriouseats.com',
        'britannica.com', 'howstuffworks.com', 'wikihow.com',
        'instructables.com', 'archive.org', 'imdb.com', 'dev.to',
        'duckduckgo.com', 'weather.gov', 'goodreads.com', 'craigslist.org'
      ],
      killSwitch: false
    },
    metrics: {
      totalQueries: 0,
      uniqueDomains: [],
      entropyScore: 0,
      domainVisits: {}
    }
  }
});

export default store;
