import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { store } from './store/store'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary'
import ToastHost from './components/common/Toast'
import './index.css'
import './styles/design-system.css'
import './styles/orders.css'
import './styles/customer-redesign.css'
import './styles/returns-luxury.css'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
        <BrowserRouter>
          <Elements stripe={stripePromise}>
            <App />
            <ToastHost />
          </Elements>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </Provider>
  </ErrorBoundary>
)