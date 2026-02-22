import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import PersonaCreator from './components/PersonaCreator';
import Settings from './components/Settings';
import { Persona } from './types';
import { Settings as SettingsIcon } from 'lucide-react';

type View = 'dashboard' | 'create' | 'edit' | 'settings';

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const handleEditPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setCurrentView('edit');
  };

  const handleCreatePersona = () => {
    setSelectedPersona(null);
    setCurrentView('create');
  };

  const handleSavePersona = async (persona: Partial<Persona>) => {
    await window.api.savePersona(persona);
    setCurrentView('dashboard');
  };

  const showNav = currentView === 'dashboard';

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {showNav && (
        <header className="flex justify-end px-6 pt-4">
          <button
            onClick={() => setCurrentView('settings')}
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm"
          >
            <SettingsIcon size={16} /> Settings
          </button>
        </header>
      )}

      {currentView === 'dashboard' && (
        <Dashboard
          onEditPersona={handleEditPersona}
          onCreatePersona={handleCreatePersona}
        />
      )}
      {(currentView === 'create' || currentView === 'edit') && (
        <PersonaCreator
          initialPersona={selectedPersona}
          onSave={handleSavePersona}
          onCancel={() => setCurrentView('dashboard')}
        />
      )}
      {currentView === 'settings' && (
        <Settings onBack={() => setCurrentView('dashboard')} />
      )}
    </div>
  );
}

export default App;
