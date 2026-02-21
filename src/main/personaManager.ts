import store from './store';
import { Persona } from './types';
import { v4 as uuidv4 } from 'uuid';

export class PersonaManager {
  static getAll(): Persona[] {
    return store.get('personas');
  }

  static get(id: string): Persona | undefined {
    return store.get('personas').find(p => p.id === id);
  }

  static save(persona: Partial<Persona>): Persona {
    const personas = store.get('personas');
    const existingIndex = personas.findIndex(p => p.id === persona.id);

    if (existingIndex >= 0) {
      personas[existingIndex] = { ...personas[existingIndex], ...persona };
      store.set('personas', personas);
      return personas[existingIndex];
    } else {
      const newPersona: Persona = {
        id: uuidv4(),
        name: persona.name || 'New Persona',
        avatar: persona.avatar || '',
        interests: persona.interests || [],
        schedule: persona.schedule || { start: '09:00', end: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        intensity: persona.intensity || 'medium',
        isActive: false
      };
      personas.push(newPersona);
      store.set('personas', personas);
      return newPersona;
    }
  }

  static delete(id: string): void {
    const personas = store.get('personas').filter(p => p.id !== id);
    store.set('personas', personas);
  }
}
