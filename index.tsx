/**
 * ATENTIE: Acest fisier exista din motive de compatibilitate cu mediul de dezvoltare.
 * NU il sterge daca sistemul nu permite, dar te rog sa NU il editezi.
 * 
 * Codul sursa activ al aplicatiei se afla in folderul 'src/'.
 * - Modificari logica: src/App.tsx
 * - Modificari baza de date: src/services/db.ts
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);