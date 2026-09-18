import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Toaster
        position="top-right"
        closeButton
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid #E5E1DA',
            borderRadius: '8px',
            color: '#1A1A1C',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.875rem',
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
)
