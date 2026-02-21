import { chromium, BrowserContext, Page } from 'playwright';
import { Persona } from './types';
import { llmService } from './llmService';
import store from './store';
import { app } from 'electron';
import path from 'path';

export class AgentRunner {
  private contexts: Map<string, BrowserContext> = new Map();
  private activePersonas: Set<string> = new Set();

  async startSession(persona: Persona) {
    if (this.activePersonas.has(persona.id)) {
      console.log(`Agent for persona ${persona.name} is already running.`);
      return;
    }

    this.activePersonas.add(persona.id);
    console.log(`Starting session for ${persona.name}`);

    try {
      const userDataDir = path.join(app.getPath('userData'), 'profiles', persona.id);
      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false, // For demo purposes, show the browser
        viewport: { width: 1280, height: 720 }
      });

      this.contexts.set(persona.id, context);
      const page = await context.newPage();

      // Start the loop
      this.runLoop(persona, page);
    } catch (error) {
      console.error(`Error starting session for ${persona.name}:`, error);
      this.activePersonas.delete(persona.id);
    }
  }

  async stopSession(personaId: string) {
    if (!this.activePersonas.has(personaId)) return;

    console.log(`Stopping session for persona ${personaId}`);
    this.activePersonas.delete(personaId);
    
    const context = this.contexts.get(personaId);
    if (context) {
      await context.close();
      this.contexts.delete(personaId);
    }
  }

  private async runLoop(persona: Persona, page: Page) {
    while (this.activePersonas.has(persona.id)) {
      try {
        // Check kill switch
        if (store.get('settings.killSwitch')) {
          console.log('Kill switch active, stopping agent.');
          await this.stopSession(persona.id);
          break;
        }

        // Generate search queries
        console.log(`Generating queries for ${persona.name}...`);
        const queries = await llmService.generateSearchQueries(persona.interests);
        
        if (!queries || queries.length === 0) {
          console.log('No queries generated, sleeping...');
          await page.waitForTimeout(5000);
          continue;
        }

        for (const query of queries) {
          if (!this.activePersonas.has(persona.id)) break;

          console.log(`Searching for: ${query}`);
          try {
            await page.goto('https://www.google.com');
            // Try different selectors for search box
            const searchBox = await page.$('textarea[name="q"]') || await page.$('input[name="q"]');
            if (searchBox) {
              await searchBox.fill(query);
              await searchBox.press('Enter');
              await page.waitForTimeout(3000); // Wait for results

              // Pick a result
              const links = await page.$$('div.g a');
              if (links.length > 0) {
                // Pick a random link from first 5
                const randomLink = links[Math.floor(Math.random() * Math.min(links.length, 5))];
                const href = await randomLink.getAttribute('href');
                if (href && !href.includes('google.com')) {
                  console.log(`Navigating to: ${href}`);
                  await page.goto(href);
                  await this.simulateReading(page);
                }
              }
            }
          } catch (e) {
            console.error(`Error during search/navigation: ${e}`);
          }

          // Sleep between searches
          await page.waitForTimeout(Math.random() * 5000 + 2000);
        }

      } catch (error) {
        console.error(`Error in agent loop for ${persona.name}:`, error);
        await page.waitForTimeout(5000); // Wait before retrying
      }
    }
  }

  private async simulateReading(page: Page) {
    try {
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      let currentScroll = 0;
      while (currentScroll < scrollHeight) {
        const scrollAmount = Math.random() * 300 + 100;
        currentScroll += scrollAmount;
        await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
        await page.waitForTimeout(Math.random() * 1000 + 500);
        if (Math.random() > 0.8) break; // Stop scrolling randomly
      }
    } catch (e) {
      console.error(`Error simulating reading: ${e}`);
    }
  }
}

export const agentRunner = new AgentRunner();
