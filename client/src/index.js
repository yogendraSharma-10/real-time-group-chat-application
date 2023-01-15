import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/main.css'; // Import global styles

/**
 * This is the entry point of the React application.
 * It renders the main App component into the DOM.
 */
ReactDOM.render(
  // React.StrictMode is a tool for highlighting potential problems in an application.
  // It activates additional checks and warnings for its descendants.
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  // The App component is rendered into the HTML element with the ID 'root'
  // which is typically found in client/public/index.html.
  document.getElementById('root')
);