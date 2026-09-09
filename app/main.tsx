import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './page';
import { DiscordProvider } from './discord-context';
import './globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root.');
createRoot(root).render(
  <StrictMode>
    <DiscordProvider>
      <Home />
    </DiscordProvider>
  </StrictMode>,
);
