import { GoogleGenerativeAI } from '@google/generative-ai';
import store from './store';

export class LLMService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = (store.get('settings.apiKey') as string) || process.env.GEMINI_API_KEY || '';
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

  private rateLimitedUntil = 0;

  async generateSearchQueries(interests: string[]): Promise<string[]> {
    try {
      const now = Date.now();
      if (now < this.rateLimitedUntil) {
        const waitSec = Math.ceil((this.rateLimitedUntil - now) / 1000);
        console.log(`Rate limited, waiting ${waitSec}s before next request...`);
        return [];
      }

      this.ensureInitialized();
      const prompt = `
        Generate 3 realistic search queries for a user interested in: ${interests.join(', ')}.
        The queries should be natural, varied, and specific.
        Return only the queries, one per line.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text.split('\n').filter((q: string) => q.trim().length > 0);
    } catch (error: any) {
      if (error?.status === 429) {
        const retryMatch = error?.message?.match(/retry in ([\d.]+)s/i);
        const backoffSec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) + 5 : 60;
        this.rateLimitedUntil = Date.now() + backoffSec * 1000;
        console.log(`Rate limited by Gemini API. Backing off for ${backoffSec}s.`);
      } else {
        console.error('Error generating search queries:', error);
      }
      return [];
    }
  }

  async decideNextAction(currentUrl: string, pageContent: string): Promise<{ action: 'click' | 'scroll' | 'search', target?: string }> {
    try {
      this.ensureInitialized();
      const prompt = `
        You are browsing the web. You are currently on: ${currentUrl}.
        The page content is about: ${pageContent.substring(0, 500)}...
        Decide what to do next:
        1. Click a link (provide the link text or href)
        2. Scroll down
        3. Perform a new search (provide the query)
        
        Return a JSON object with "action" and "target" (if applicable).
        Example: { "action": "click", "target": "Next Page" }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Extract JSON from response
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { action: 'scroll' };
    } catch (error) {
      console.error('Error deciding next action:', error);
      return { action: 'scroll' };
    }
  }
}

export const llmService = new LLMService();
