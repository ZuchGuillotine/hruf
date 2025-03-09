
import { useState } from "react";
import { useDebugSse } from "@/hooks/use-debug";
import { Button } from "@/components/ui/button";

export default function DebugSsePage() {
  const { 
    testConnection, 
    checkConnectionInfo,
    closeConnection,
    messages, 
    isConnected, 
    error 
  } = useDebugSse();
  
  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">SSE Connection Debugger</h1>
      
      <div className="mb-4 flex space-x-2">
        <Button onClick={testConnection} variant="default">
          Test SSE Connection
        </Button>
        <Button onClick={checkConnectionInfo} variant="outline">
          Check Connection Info
        </Button>
        <Button onClick={closeConnection} variant="destructive" disabled={!isConnected}>
          Close Connection
        </Button>
      </div>
      
      <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded">
        <p>
          Connection Status: 
          <span className={`ml-2 font-bold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="border rounded-lg p-4 h-[60vh] overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-2">Debug Log</h2>
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet. Start a test to see results.</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="mb-2 p-2 bg-white dark:bg-gray-800 rounded shadow-sm">
              <div className="text-xs text-gray-500 mb-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
              <pre className="whitespace-pre-wrap text-sm">{msg.content}</pre>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>This page helps diagnose Server-Sent Events (SSE) connectivity issues.</p>
      </div>
    </div>
  );
}
