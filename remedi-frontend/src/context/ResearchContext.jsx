import React, { createContext, useContext, useState } from 'react';

const ResearchContext = createContext();

export const ResearchProvider = ({ children }) => {
  const [researchName, setResearchName] = useState('');
  const [researchStep, setResearchStep] = useState('name'); // name, query, results
  const [researchMode, setResearchMode] = useState('knowledge'); // knowledge, deep

  return (
    <ResearchContext.Provider value={{
      researchName,
      setResearchName,
      researchStep,
      setResearchStep,
      researchMode,
      setResearchMode
    }}>
      {children}
    </ResearchContext.Provider>
  );
};

export const useResearch = () => {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used within a ResearchProvider');
  }
  return context;
}; 