
import { useState, useCallback, useRef, useEffect } from 'react';

type DebugMessage = {
  content: string;
  timestamp: string;
};

export function useDebugSse() {
  const [messages, setMessages] = useState<DebugMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const testConnection = useCallback(() => {
    setMessages([]);
    setError(null);
    
    try {
      // Log debug info
      console.log('Testing SSE connection...');
      setMessages(prev => [...prev, { 
        content: 'Attempting to connect...', 
        timestamp: new Date().toISOString() 
      }]);
      
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Create new EventSource
      const url = `/api/debug/sse?t=${Date.now()}`;
      eventSourceRef.current = new EventSource(url);
      
      // Connection opened
      eventSourceRef.current.onopen = () => {
        console.log('Debug SSE connection opened');
        setIsConnected(true);
        setMessages(prev => [...prev, { 
          content: 'Connection established', 
          timestamp: new Date().toISOString() 
        }]);
      };
      
      // Message received
      eventSourceRef.current.onmessage = (event) => {
        console.log('Debug SSE message received:', event.data);
        
        try {
          if (event.data === '[DONE]') {
            setMessages(prev => [...prev, { 
              content: 'Connection closed by server (DONE)', 
              timestamp: new Date().toISOString() 
            }]);
            setIsConnected(false);
            eventSourceRef.current?.close();
            eventSourceRef.current = null;
            return;
          }
          
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, { 
            content: data.content || JSON.stringify(data), 
            timestamp: new Date().toISOString() 
          }]);
        } catch (err) {
          console.error('Error parsing debug message:', err, event.data);
          setMessages(prev => [...prev, { 
            content: `Error parsing: ${event.data}`, 
            timestamp: new Date().toISOString() 
          }]);
        }
      };
      
      // Error handling
      eventSourceRef.current.onerror = (err) => {
        console.error('Debug SSE error:', err);
        
        const errDetails = {
          type: err.type,
          target: err.target,
          eventPhase: err.eventPhase,
          timeStamp: err.timeStamp,
          readyState: eventSourceRef.current?.readyState,
          url
        };
        
        console.error('Debug SSE detailed error:', errDetails);
        
        setError(`Connection error: ${err.type || 'Unknown'}`);
        setIsConnected(false);
        
        setMessages(prev => [...prev, { 
          content: `Connection error: ${JSON.stringify(errDetails)}`, 
          timestamp: new Date().toISOString() 
        }]);
        
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
      };
    } catch (err) {
      console.error('Error setting up debug SSE:', err);
      setError(`Setup error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }, []);
  
  const checkConnectionInfo = useCallback(async () => {
    try {
      setMessages(prev => [...prev, { 
        content: 'Fetching connection info...', 
        timestamp: new Date().toISOString() 
      }]);
      
      const response = await fetch('/api/debug/connection');
      const data = await response.json();
      
      console.log('Connection info:', data);
      
      setMessages(prev => [...prev, { 
        content: `Connection info: ${JSON.stringify(data, null, 2)}`, 
        timestamp: new Date().toISOString() 
      }]);
    } catch (err) {
      console.error('Error fetching connection info:', err);
      setError(`Connection info error: ${err instanceof Error ? err.message : 'Unknown'}`);
      
      setMessages(prev => [...prev, { 
        content: `Connection info error: ${err instanceof Error ? err.message : 'Unknown'}`, 
        timestamp: new Date().toISOString() 
      }]);
    }
  }, []);
  
  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      setMessages(prev => [...prev, { 
        content: 'Manually closing connection', 
        timestamp: new Date().toISOString() 
      }]);
      
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  return { 
    testConnection,
    checkConnectionInfo,
    closeConnection,
    messages, 
    isConnected, 
    error 
  };
}
