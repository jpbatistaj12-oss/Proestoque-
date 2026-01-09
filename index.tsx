
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("Marmoraria Control: Inicializando aplicação v1.0.1...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Erro crítico: Elemento #root não encontrado.");
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
