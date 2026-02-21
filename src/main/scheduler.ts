import { PersonaManager } from './personaManager';
import { agentRunner } from './agentRunner';
import store from './store';

export class Scheduler {
  private interval: NodeJS.Timeout | null = null;

  start() {
    if (this.interval) return;
    
    console.log('Scheduler started');
    // Check every minute
    this.interval = setInterval(() => {
      this.checkSchedules();
    }, 60000);
    
    // Initial check
    this.checkSchedules();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkSchedules() {
    if (store.get('settings.killSwitch')) {
      console.log('Kill switch active, skipping schedule check.');
      return;
    }

    const personas = PersonaManager.getAll();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...

    for (const persona of personas) {
      // Check if persona should be active
      const shouldBeActive = this.isWithinSchedule(persona.schedule, currentTime, currentDay);
      
      if (shouldBeActive && !persona.isActive) {
        console.log(`Starting scheduled session for ${persona.name}`);
        try {
          await agentRunner.startSession(persona);
          PersonaManager.save({ ...persona, isActive: true });
        } catch (error) {
          console.error(`Failed to start scheduled session for ${persona.name}:`, error);
        }
      } else if (!shouldBeActive && persona.isActive) {
        console.log(`Stopping scheduled session for ${persona.name}`);
        try {
          await agentRunner.stopSession(persona.id);
          PersonaManager.save({ ...persona, isActive: false });
        } catch (error) {
          console.error(`Failed to stop scheduled session for ${persona.name}:`, error);
        }
      }
    }
  }

  private isWithinSchedule(schedule: { start: string, end: string, days: string[] }, currentTime: string, currentDay: string): boolean {
    if (!schedule.days.includes(currentDay)) return false;
    return currentTime >= schedule.start && currentTime < schedule.end;
  }
}

export const scheduler = new Scheduler();
