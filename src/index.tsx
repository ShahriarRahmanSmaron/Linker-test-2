import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App';

// Clerk publishable key from environment variables
const rawPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const PUBLISHABLE_KEY = typeof rawPublishableKey === 'string' ? rawPublishableKey.trim() : '';

if (!PUBLISHABLE_KEY || !PUBLISHABLE_KEY.startsWith('pk_')) {
  throw new Error('Missing or invalid VITE_CLERK_PUBLISHABLE_KEY environment variable');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);