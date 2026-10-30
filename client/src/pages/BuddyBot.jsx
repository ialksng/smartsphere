import React from 'react';
import { useLocation } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';

export default function BuddyBot() {
  const location = useLocation();
  const importedFile = location.state?.importedFile || null;
  const prefillQuery = location.state?.prefillQuery || '';

  return (
    <div className="flex flex-col h-full p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-white">AI Assistant</h1>
        <p className="text-gray-400 mt-2">
          Your workspace-aware AI assistant. Scans across all your documents, summarizes insights, and answers questions with full context.
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <ChatInterface 
          initialFile={importedFile}
          prefillQuery={prefillQuery}
          onInsightAdded={() => console.log('New insight added!')} 
        />
      </div>
    </div>
  );
}