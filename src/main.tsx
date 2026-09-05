import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@carbon/styles/css/styles.css'
import './index.css'
import App from './App.tsx'
import { ANALYTICS_EVENTS, capture, initAnalytics } from './utils/analytics'

initAnalytics()
capture(ANALYTICS_EVENTS.APP_OPENED)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
