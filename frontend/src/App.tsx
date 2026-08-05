import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Plans } from './pages/Plans'
import { Home } from './pages/Home'
import { NewAnalysis } from './pages/NewAnalysis'
import { Analysis } from './pages/Analysis'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Welcome } from './pages/Welcome'
import { History } from './pages/History'
import { BillingSuccess } from './pages/BillingSuccess'
import { BillingCancel } from './pages/BillingCancel'
import { Admin } from './pages/Admin'
import { Comparison } from './pages/Comparison'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/planos" element={<Plans />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/welcome"
              element={
                <ProtectedRoute>
                  <Welcome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analyze"
              element={
                <ProtectedRoute>
                  <NewAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis/:id"
              element={
                <ProtectedRoute>
                  <Analysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/success"
              element={
                <ProtectedRoute>
                  <BillingSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/cancel"
              element={
                <ProtectedRoute>
                  <BillingCancel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis/:id/compare"
              element={
                <ProtectedRoute>
                  <Comparison />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
