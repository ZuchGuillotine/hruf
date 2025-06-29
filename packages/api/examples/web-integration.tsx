/**
 * Example: Integrating @hruf/api with a React web application
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createWebApi, HrufApiProvider, ConvenienceHooks } from '@hruf/api';

// Create API instance for web
const api = createWebApi({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  sessionConfig: {
    cookieName: 'stacktracker.sid',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

// Login component
function LoginForm() {
  const { mutateAsync: login, isPending } = ConvenienceHooks.useLogin();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await login({
        username: formData.get('username') as string,
        password: formData.get('password') as string
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" placeholder="Username" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// Dashboard component
function Dashboard() {
  const { data: user } = ConvenienceHooks.useCurrentUser();
  const { data: supplements } = ConvenienceHooks.useSupplements(user?.id);
  const { mutateAsync: createSupplement } = ConvenienceHooks.useCreateSupplement();

  const handleAddSupplement = async () => {
    await createSupplement({
      name: 'Vitamin D',
      dosage: '2000 IU',
      frequency: 'daily'
    });
  };

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      
      <section>
        <h2>Your Supplements</h2>
        <button onClick={handleAddSupplement}>Add Vitamin D</button>
        <ul>
          {supplements?.map(supplement => (
            <li key={supplement.id}>
              {supplement.name} - {supplement.dosage} ({supplement.frequency})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// Chat component with streaming
function ChatComponent() {
  const [messages, setMessages] = React.useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [input, setInput] = React.useState('');
  const [response, setResponse] = React.useState('');
  
  const { streamChat, isLoading } = ConvenienceHooks.useStreamingChat();

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput('');
    setResponse('');

    try {
      await streamChat(newMessages, (chunk) => {
        if (chunk.response) {
          setResponse(prev => prev + chunk.response);
        }
      });
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  React.useEffect(() => {
    if (response && !isLoading) {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setResponse('');
    }
  }, [response, isLoading]);

  return (
    <div>
      <div style={{ height: '300px', overflow: 'auto', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '10px' }}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
        {response && (
          <div style={{ marginBottom: '10px' }}>
            <strong>assistant:</strong> {response}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your health..."
          disabled={isLoading}
          style={{ width: '300px', marginRight: '10px' }}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

// Main app
function App() {
  return (
    <HrufApiProvider api={api}>
      <div style={{ padding: '20px' }}>
        <Dashboard />
        <hr style={{ margin: '40px 0' }} />
        <h2>AI Chat</h2>
        <ChatComponent />
      </div>
    </HrufApiProvider>
  );
}

// Render app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;