
import { createRoot } from 'react-dom/client'
import { BrowserRouter, BrowserRouter as Router } from 'react-router-dom'
import AppContextProvider from './context/AppContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <AppContextProvider>
    <App />
    </AppContextProvider>
    </BrowserRouter>
)
