import { GoogleGenerativeAI } from '@google/generative-ai';
import store from './store';

export interface BrowseTarget {
  site: string;
  url: string;
  topic: string;
}

const SITES = [
  {
    name: 'Wikipedia',
    buildUrl: (topic: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, '_'))}`
  },
  {
    name: 'BBC News',
    buildUrl: (topic: string) => `https://www.bbc.com/search?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'CNN',
    buildUrl: (topic: string) => `https://www.cnn.com/search?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'AllRecipes',
    buildUrl: (topic: string) => `https://www.allrecipes.com/search?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'Medium',
    buildUrl: (topic: string) => `https://medium.com/search?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'Amazon',
    buildUrl: (topic: string) => `https://www.amazon.com/s?k=${encodeURIComponent(topic)}`
  },
  {
    name: 'YouTube',
    buildUrl: (topic: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`
  },
  {
    name: 'Reuters',
    buildUrl: (topic: string) => `https://www.reuters.com/search/news?query=${encodeURIComponent(topic)}`
  },
  {
    name: 'AP News',
    buildUrl: (topic: string) => `https://apnews.com/search#?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'NPR',
    buildUrl: (topic: string) => `https://www.npr.org/search?query=${encodeURIComponent(topic)}`
  },
  {
    name: 'PBS',
    buildUrl: (topic: string) => `https://www.pbs.org/search/?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'SimplyRecipes',
    buildUrl: (topic: string) => `https://www.simplyrecipes.com/search?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'BudgetBytes',
    buildUrl: (topic: string) => `https://www.budgetbytes.com/?s=${encodeURIComponent(topic)}`
  },
  {
    name: 'SeriousEats',
    buildUrl: (topic: string) => `https://www.seriouseats.com/search?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'Britannica',
    buildUrl: (topic: string) => `https://www.britannica.com/search?query=${encodeURIComponent(topic)}`
  },
  {
    name: 'HowStuffWorks',
    buildUrl: (topic: string) => `https://www.howstuffworks.com/search?terms=${encodeURIComponent(topic)}`
  },
  {
    name: 'WikiHow',
    buildUrl: (topic: string) => `https://www.wikihow.com/wikiHowTo?search=${encodeURIComponent(topic)}`
  },
  {
    name: 'Instructables',
    buildUrl: (topic: string) => `https://www.instructables.com/search/?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'Archive.org',
    buildUrl: (topic: string) => `https://archive.org/search?query=${encodeURIComponent(topic)}`
  },
  {
    name: 'IMDB',
    buildUrl: (topic: string) => `https://www.imdb.com/find/?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'Dev.to',
    buildUrl: (topic: string) => `https://dev.to/search?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'DuckDuckGo',
    buildUrl: (topic: string) => `https://duckduckgo.com/?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'Weather.gov',
    buildUrl: (topic: string) => `https://www.weather.gov/search?query=${encodeURIComponent(topic)}`
  },
  {
    name: 'Goodreads',
    buildUrl: (topic: string) => `https://www.goodreads.com/search?q=${encodeURIComponent(topic)}`
  },
  {
    name: 'Craigslist',
    buildUrl: (topic: string) => `https://www.craigslist.org/search/?query=${encodeURIComponent(topic)}`
  }
];

export class LLMService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any;
  private rateLimitedUntil = 0;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.GEMINI_API_KEY || (store.get('settings.apiKey') as string) || '';
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
  }

  private ensureInitialized() {
    if (!this.genAI) {
      this.initialize();
      if (!this.genAI) {
        throw new Error('API Key not configured');
      }
    }
  }

  async generateBrowseTargets(interests: string[]): Promise<BrowseTarget[]> {
    try {
      const now = Date.now();
      if (now < this.rateLimitedUntil) {
        const waitSec = Math.ceil((this.rateLimitedUntil - now) / 1000);
        console.log(`Rate limited, waiting ${waitSec}s before next request...`);
        return [];
      }

      this.ensureInitialized();
      const siteNames = SITES.map(s => s.name).join(', ');
      const prompt = `You help generate realistic browsing activity. A user is interested in: ${interests.join(', ')}.

Generate exactly 5 browsing targets. For each, provide a site name and a topic/keyword to search or look up on that site.
For Wikipedia, use real article titles that exist (e.g. "Sourdough", "Machine learning", "Tokyo").
For other sites, use natural search terms (e.g. "easy pasta recipes", "latest tech news", "running shoes").

Available sites: ${siteNames}

Return ONLY a JSON array, no other text. Example:
[{"site":"Wikipedia","topic":"Sourdough"},{"site":"AllRecipes","topic":"chicken soup recipe"},{"site":"BBC News","topic":"climate change"},{"site":"YouTube","topic":"how to garden"},{"site":"Amazon","topic":"running shoes"}]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const parsed: { site: string; topic: string }[] = JSON.parse(jsonMatch[0]);

      return parsed
        .map(item => {
          const siteConfig = SITES.find(s => s.name.toLowerCase() === item.site.toLowerCase());
          if (!siteConfig) return null;
          return {
            site: siteConfig.name,
            url: siteConfig.buildUrl(item.topic),
            topic: item.topic
          };
        })
        .filter((t): t is BrowseTarget => t !== null);
    } catch (error: any) {
      if (error?.status === 429) {
        const retryMatch = error?.message?.match(/retry in ([\d.]+)s/i);
        const backoffSec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) + 5 : 60;
        this.rateLimitedUntil = Date.now() + backoffSec * 1000;
        console.log(`Rate limited by Gemini API. Backing off for ${backoffSec}s.`);
      } else {
        console.error('Error generating browse targets:', error);
      }
      return [];
    }
  }
}

export const llmService = new LLMService();
