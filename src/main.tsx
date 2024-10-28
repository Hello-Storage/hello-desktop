import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "./assets/styles/index.scss";
import { Provider } from 'react-redux'
import ModalProvider from './components/modal/Context.tsx'
import state from './state/index.ts';
import GoogleOAuth from './providers/GoogleOAuthProvider.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={state}>
      <GoogleOAuth>
        <ModalProvider>
          <button
            onClick={() => window.electron.startMining()}
            className="text-black text-4xl font-bold select-none relative cursor-pointer rounded-b-lg pb-1"
          >
            Start Mining
          </button>

          <button
            onClick={() => window.electron.stopMining()}
            className="text-black text-4xl font-bold select-none relative cursor-pointer rounded-b-lg pb-1"
          >
            Stop Mining
          </button>
          <App />
        </ModalProvider>
      </GoogleOAuth>
    </Provider>
  </React.StrictMode>,
)