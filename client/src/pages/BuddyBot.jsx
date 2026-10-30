import React from 'react';
import { useLocation } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';

export default function BuddyBot() {
  const location = useLocation();
  const importedFile = location.state?.importedFile || null;

  return (
    <div className="flex flex-col h-full p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-white">BuddyBot</h1>
        <p className="text-gray-400 mt-2">
          Your AI assistant for documents and insights. Upload files and ask questions to get started.
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <ChatInterface 
          initialFile={importedFile} 
          onInsightAdded={() => console.log('New insight added!')} 
        />
      </div>
    </div>
  );
}