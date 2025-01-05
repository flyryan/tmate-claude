import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

const init = () => {
  try {
    // Create root element
    const container = document.getElementById('root');
    if (!container) {
      throw new Error('Failed to find root element');
    }

    const root = createRoot(container);

    // Render app
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    console.log('React app mounted successfully');
  } catch (error) {
    console.error('Failed to initialize React app:', error);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
