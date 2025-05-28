import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { ResearchProvider } from './context/ResearchContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ResearchProvider>
        <App />
      </ResearchProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
