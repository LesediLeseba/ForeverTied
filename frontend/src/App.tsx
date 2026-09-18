import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import LandingPage from '@/pages/LandingPage'
import MemorialPage from '@/pages/MemorialPage'
import SetupPage from '@/pages/SetupPage'
import NotFoundPage from '@/pages/NotFoundPage'
import AdminLayout from '@/pages/admin/AdminLayout'

// The staff console (Radix primitives + QR renderer) is split out of the
// public bundle: a visitor scanning a plate only downloads the memorial view.
const PlatesPage = lazy(() => import('@/pages/admin/PlatesPage'))
const MemorialsPage = lazy(() => import('@/pages/admin/MemorialsPage'))
const InventoryPage = lazy(() => import('@/pages/admin/InventoryPage'))

function AdminFallback() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded bg-secondary/70" />
      <div className="h-32 w-full animate-pulse rounded-lg bg-secondary/50" />
      <span className="sr-only">Loading the staff console…</span>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/memorials/:slug" element={<MemorialPage />} />
      <Route path="/setup" element={<SetupPage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/plates" replace />} />
        <Route
          path="plates"
          element={
            <Suspense fallback={<AdminFallback />}>
              <PlatesPage />
            </Suspense>
          }
        />
        <Route
          path="memorials"
          element={
            <Suspense fallback={<AdminFallback />}>
              <MemorialsPage />
            </Suspense>
          }
        />
        <Route
          path="inventory"
          element={
            <Suspense fallback={<AdminFallback />}>
              <InventoryPage />
            </Suspense>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
