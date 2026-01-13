
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("Marmoraria Control: Inicializando aplicação v1.0.6...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Elemento #root não encontrado.");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
