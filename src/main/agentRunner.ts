import { chromium, BrowserContext, Page } from 'playwright';
import { EventEmitter } from 'events';
import { Persona } from './types';
import { llmService } from './llmService';
import store from './store';
import { app } from 'electron';
import path from 'path';

const INTENSITY_DELAYS = {
  low:    { min: 8000,  max: 15000 },
  medium: { min: 3000,  max: 7000  },
  high:   { min: 1000,  max: 3000  }
};

const INTENSITY_SCROLL = {
  low:    { pauseMin: 800,  pauseMax: 2000, stopChance: 0.4 },
  medium: { pauseMin: 500,  pauseMax: 1500, stopChance: 0.2 },
  high:   { pauseMin: 200,  pauseMax: 600,  stopChance: 0.1 }
};

// How many targets per LLM call by intensity
const INTENSITY_TARGETS = {
  low:    3,
  medium: 5,
  high:   8
};

// How deep to follow links by intensity
const INTENSITY_LINK_DEPTH = {
  low:    0.2,   // 20% chance to follow a link
  medium: 0.5,   // 50% chance
  high:   0.8    // 80% chance
};

// Fallback URLs when LLM is unavailable (rate-limited, no API key, etc.)
const FALLBACK_URLS = [
  'https://en.wikipedia.org/wiki/Special:Random',
  'https://www.bbc.com/news',
  'https://www.reuters.com/',
  'https://www.npr.org/',
  'https://www.allrecipes.com/',
  'https://www.britannica.com/',
  'https://www.howstuffworks.com/',
  'https://www.wikihow.com/',
  'https://www.pbs.org/',
  'https://www.simplyrecipes.com/',
  'https://www.seriouseats.com/',
  'https://archive.org/',
  'https://www.imdb.com/',
  'https://dev.to/',
  'https://www.budgetbytes.com/',
  'https://www.goodreads.com/',
  'https://apnews.com/',
  'https://www.cnn.com/',
  'https://medium.com/',
  'https://www.instructables.com/',
];

function calcEntropy(domainVisits: Record<string, number>): number {
  const total = Object.values(domainVisits).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return -Object.values(domainVisits).reduce((h, count) => {
    const p = count / total;
    return h + p * Math.log2(p);
  }, 0);
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function randomDelay(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class AgentRunner extends EventEmitter {
  private contexts: Map<string, BrowserContext> = new Map();
  private activePersonas: Set<string> = new Set();

  async startSession(persona: Persona) {
    if (this.activePersonas.has(persona.id)) {
      console.log(`Agent for persona ${persona.name} is already running.`);
      return;
    }

    this.activePersonas.add(persona.id);
    this.emit('activity', {
      personaId: persona.id,
      personaName: persona.name,
      type: 'start',
      details: `Session started for ${persona.name}`
    });

    try {
      const userDataDir = path.join(app.getPath('userData'), 'profiles', persona.id);
      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: { width: 1280, height: 720 }
      });

      this.contexts.set(persona.id, context);
      const page = await context.newPage();

      // Run the loop without awaiting so startSession returns immediately
      // but the loop continues in the background
      this.runLoop(persona, page).catch((err) => {
        console.error(`Loop crashed for ${persona.name}:`, err);
        this.cleanup(persona.id);
      });
    } catch (error) {
      console.error(`Error starting session for ${persona.name}:`, error);
      this.activePersonas.delete(persona.id);
    }
  }

  async stopSession(personaId: string) {
    if (!this.activePersonas.has(personaId)) return;

    this.activePersonas.delete(personaId);

    const context = this.contexts.get(personaId);
    if (context) {
      try {
        await context.close();
      } catch (e) {
        // Already closed
      }
      this.contexts.delete(personaId);
    }

    this.emit('activity', {
      personaId,
      personaName: personaId,
      type: 'stop',
      details: 'Session stopped'
    });
  }

  private cleanup(personaId: string) {
    this.activePersonas.delete(personaId);
    const context = this.contexts.get(personaId);
    if (context) {
      context.close().catch(() => {});
      this.contexts.delete(personaId);
    }
  }

  private isPageAlive(page: Page): boolean {
    try {
      return !page.isClosed();
    } catch {
      return false;
    }
  }

  private isActive(personaId: string): boolean {
    return this.activePersonas.has(personaId) && !store.get('settings.killSwitch');
  }

  private async safeSleep(page: Page, ms: number): Promise<void> {
    if (!this.isPageAlive(page)) return;
    await page.waitForTimeout(ms).catch(() => {});
  }

  private async runLoop(persona: Persona, page: Page) {
    const delays = INTENSITY_DELAYS[persona.intensity] || INTENSITY_DELAYS.medium;
    const linkChance = INTENSITY_LINK_DEPTH[persona.intensity] || INTENSITY_LINK_DEPTH.medium;
    let consecutiveFailures = 0;

    while (this.isActive(persona.id) && this.isPageAlive(page)) {
      try {
        // Try LLM-generated targets first
        let targets = await llmService.generateBrowseTargets(persona.interests);

        if (targets && targets.length > 0) {
          consecutiveFailures = 0;
        } else {
          consecutiveFailures++;
          console.log(`[${persona.name}] No LLM targets (attempt ${consecutiveFailures}), using fallback sites`);

          // Use fallback: pick random safe sites and browse them directly
          const fallbackCount = INTENSITY_TARGETS[persona.intensity] || 5;
          const shuffled = shuffleArray(FALLBACK_URLS);
          targets = shuffled.slice(0, fallbackCount).map(url => ({
            site: extractDomain(url) || 'unknown',
            url,
            topic: 'browsing'
          }));

          // Back off on LLM calls: wait longer after repeated failures
          // but keep browsing fallback sites in the meantime
          if (consecutiveFailures >= 3) {
            const backoffMs = Math.min(consecutiveFailures * 30000, 300000); // max 5 min
            console.log(`[${persona.name}] LLM backed off, next LLM attempt in ${backoffMs / 1000}s`);
          }
        }

        for (const target of targets) {
          if (!this.isActive(persona.id) || !this.isPageAlive(page)) break;

          const domain = extractDomain(target.url) || target.site;

          this.emit('activity', {
            personaId: persona.id,
            personaName: persona.name,
            type: 'search',
            details: `Looking up "${target.topic}" on ${target.site}`
          });

          try {
            console.log(`[${persona.name}] Navigating to ${target.url}`);
            await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 20000 });

            this.updateMetrics(domain);

            this.emit('activity', {
              personaId: persona.id,
              personaName: persona.name,
              type: 'visit',
              details: `Browsing ${target.site}: "${target.topic}"`
            });

            await this.simulateReading(page, persona.intensity);

            // Follow links based on intensity
            if (Math.random() < linkChance && this.isPageAlive(page)) {
              await this.clickRandomLink(page, persona, domain);
            }

          } catch (e: any) {
            if (this.isFatalBrowserError(e)) {
              console.log(`Browser closed for ${persona.name}, ending loop.`);
              this.cleanup(persona.id);
              return;
            }
            console.error(`[${persona.name}] Error visiting ${target.url}: ${e.message}`);
            // Non-fatal: continue to next target
          }

          // Delay between targets
          const delay = randomDelay(delays.min, delays.max);
          await this.safeSleep(page, delay);
        }

        // Breathing room between batches — varies by intensity
        const batchDelay = randomDelay(delays.min * 2, delays.max * 3);
        await this.safeSleep(page, batchDelay);

      } catch (error: any) {
        if (this.isFatalBrowserError(error)) {
          console.log(`Browser closed for ${persona.name}, ending loop.`);
          this.cleanup(persona.id);
          return;
        }
        console.error(`[${persona.name}] Loop error:`, error.message);
        // Wait and retry — don't exit the loop
        await this.safeSleep(page, 15000);
      }
    }

    // Loop exited naturally (kill switch or manual stop)
    console.log(`[${persona.name}] Loop ended.`);
  }

  private isFatalBrowserError(e: any): boolean {
    const msg = e?.message || '';
    return msg.includes('Target page') ||
           msg.includes('has been closed') ||
           msg.includes('Target closed') ||
           msg.includes('Browser has been closed') ||
           msg.includes('Protocol error');
  }

  private updateMetrics(domain: string) {
    const metrics = store.get('metrics');
    const domainVisits = {
      ...(metrics.domainVisits || {}),
      [domain]: ((metrics.domainVisits || {})[domain] || 0) + 1
    };
    const uniqueDomains = [...new Set([...metrics.uniqueDomains, domain])];
    const entropyScore = calcEntropy(domainVisits);
    store.set('metrics', {
      ...metrics,
      totalQueries: metrics.totalQueries + 1,
      uniqueDomains,
      entropyScore,
      domainVisits
    });
  }

  private async clickRandomLink(page: Page, persona: Persona, currentDomain: string) {
    try {
      const links = await page.$$('a[href]');
      const candidates: string[] = [];

      for (const link of links.slice(0, 30)) {
        const href = await link.getAttribute('href');
        if (!href) continue;
        const full = href.startsWith('http') ? href : null;
        if (full && !full.includes('login') && !full.includes('signup') && !full.includes('auth')) {
          const linkDomain = extractDomain(full);
          if (linkDomain && linkDomain.includes(currentDomain)) {
            candidates.push(full);
          }
        }
      }

      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        const domain = extractDomain(chosen) || currentDomain;

        this.emit('activity', {
          personaId: persona.id,
          personaName: persona.name,
          type: 'visit',
          details: `Following link on ${domain}`
        });

        await page.goto(chosen, { waitUntil: 'domcontentloaded', timeout: 20000 });
        this.updateMetrics(domain);
        await this.simulateReading(page, persona.intensity);
      }
    } catch (e) {
      // Non-critical, just skip
    }
  }

  private async simulateReading(page: Page, intensity: 'low' | 'medium' | 'high') {
    const config = INTENSITY_SCROLL[intensity] || INTENSITY_SCROLL.medium;
    try {
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      let currentScroll = 0;
      while (currentScroll < scrollHeight) {
        if (!this.isPageAlive(page)) break;
        const scrollAmount = Math.random() * 300 + 100;
        currentScroll += scrollAmount;
        await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
        await page.waitForTimeout(Math.random() * (config.pauseMax - config.pauseMin) + config.pauseMin);
        if (Math.random() < config.stopChance) break;
      }
    } catch (e) {
      // Page may have been closed during scroll
    }
  }
}

export const agentRunner = new AgentRunner();
