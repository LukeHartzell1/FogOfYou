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

      this.runLoop(persona, page);
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
      await context.close();
      this.contexts.delete(personaId);
    }

    this.emit('activity', {
      personaId,
      personaName: personaId,
      type: 'stop',
      details: 'Session stopped'
    });
  }

  private isPageAlive(page: Page): boolean {
    try {
      return !page.isClosed();
    } catch {
      return false;
    }
  }

  private async safeSleep(page: Page, ms: number): Promise<void> {
    if (!this.isPageAlive(page)) return;
    await page.waitForTimeout(ms).catch(() => {});
  }

  private async runLoop(persona: Persona, page: Page) {
    const delays = INTENSITY_DELAYS[persona.intensity] || INTENSITY_DELAYS.medium;

    while (this.activePersonas.has(persona.id) && this.isPageAlive(page)) {
      try {
        if (store.get('settings.killSwitch')) {
          console.log('Kill switch active, stopping agent.');
          await this.stopSession(persona.id);
          break;
        }

        const targets = await llmService.generateBrowseTargets(persona.interests);

        if (!targets || targets.length === 0) {
          console.log(`No targets generated for ${persona.name}, waiting...`);
          await this.safeSleep(page, 30000);
          continue;
        }

        for (const target of targets) {
          if (!this.activePersonas.has(persona.id) || !this.isPageAlive(page)) break;

          const domain = extractDomain(target.url) || target.site;

          this.emit('activity', {
            personaId: persona.id,
            personaName: persona.name,
            type: 'search',
            details: `Looking up "${target.topic}" on ${target.site}`
          });

          try {
            console.log(`[${persona.name}] Navigating to ${target.url}`);
            await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 15000 });

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

            this.emit('activity', {
              personaId: persona.id,
              personaName: persona.name,
              type: 'visit',
              details: `Browsing ${target.site}: "${target.topic}"`
            });

            await this.simulateReading(page, persona.intensity);

            // Occasionally click a link on the page to go deeper
            if (Math.random() > 0.5 && this.isPageAlive(page)) {
              await this.clickRandomLink(page, persona, domain);
            }

          } catch (e: any) {
            if (e?.message?.includes('Target page') || e?.message?.includes('has been closed')) {
              console.log(`Browser closed for ${persona.name}, ending loop.`);
              this.activePersonas.delete(persona.id);
              this.contexts.delete(persona.id);
              return;
            }
            console.error(`Error visiting ${target.url}: ${e.message}`);
          }

          const delay = Math.random() * (delays.max - delays.min) + delays.min;
          await this.safeSleep(page, delay);
        }

      } catch (error: any) {
        if (error?.message?.includes('Target page') || error?.message?.includes('has been closed')) {
          console.log(`Browser closed for ${persona.name}, ending loop.`);
          this.activePersonas.delete(persona.id);
          this.contexts.delete(persona.id);
          return;
        }
        console.error(`Error in agent loop for ${persona.name}:`, error);
        await this.safeSleep(page, 10000);
      }
    }
  }

  private async clickRandomLink(page: Page, persona: Persona, currentDomain: string) {
    try {
      const links = await page.$$('a[href]');
      const candidates: string[] = [];

      for (const link of links.slice(0, 20)) {
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

        await page.goto(chosen, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const m = store.get('metrics');
        const domainVisits = { ...(m.domainVisits || {}), [domain]: ((m.domainVisits || {})[domain] || 0) + 1 };
        const uniqueDomains = [...new Set([...m.uniqueDomains, domain])];
        store.set('metrics', { ...m, uniqueDomains, entropyScore: calcEntropy(domainVisits), domainVisits });

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
