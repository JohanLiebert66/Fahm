import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './i18n';
import { ModeProvider } from './app/ModeProvider';
import { App } from './app/App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HashRouter>
      <ModeProvider>
        <App />
      </ModeProvider>
    </HashRouter>
  </React.StrictMode>
);
