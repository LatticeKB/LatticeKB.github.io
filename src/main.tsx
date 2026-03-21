import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@mantine/core/styles.css';
import '@blocknote/mantine/style.css';
import './shared/styles/globals.css';
import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>,
);
