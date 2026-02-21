export interface Persona {
  id: string;
  name: string;
  avatar: string;
  interests: string[];
  schedule: {
    start: string; // HH:mm
    end: string;   // HH:mm
    days: string[]; // ['Mon', 'Tue', ...]
  };
  intensity: 'low' | 'medium' | 'high';
  isActive: boolean;
}

export interface Settings {
  apiKey: string;
  safeList: string[];
  killSwitch: boolean;
}

export interface Metrics {
  totalQueries: number;
  uniqueDomains: string[];
  entropyScore: number;
}
