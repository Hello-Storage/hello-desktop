import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "./assets/styles/index.scss";
import { Provider } from 'react-redux'
import { store } from './stores/store.ts'
import ModalProvider from './components/modal/Context.tsx'
import state from './state/index.ts';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={state}>
      <Provider store={store}>
        <ModalProvider>
          <App />
        </ModalProvider>
      </Provider>
    </Provider>
  </React.StrictMode>,
)