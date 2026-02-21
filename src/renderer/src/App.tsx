import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import PersonaCreator from './components/PersonaCreator';
import { Persona } from './types';

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'edit'>('dashboard');
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

  return (
    <div className="bg-gray-900 text-white min-h-screen">
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
    </div>
  );
}

export default App;
