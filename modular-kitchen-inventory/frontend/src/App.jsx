import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inward from './pages/Inward';
import Outward from './pages/Outward';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import PrintLabels from './pages/PrintLabels';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Invoice from './pages/Invoice';
import Return from './pages/Return';
import Credentials from './pages/Credentials';
import './App.css';

// Route protection wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] dark:bg-forest-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Master Admin Route protection wrapper
const ProtectedMasterRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] dark:bg-forest-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'master') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Warehouse Layout Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/inward" element={<Inward />} />
                      <Route path="/outward" element={<Outward />} />
                      <Route path="/returns" element={<Return />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/print-labels" element={<PrintLabels />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                      <Route path="/customers/:id/invoice" element={<Invoice />} />
                      <Route path="/credentials" element={
                        <ProtectedMasterRoute>
                          <Credentials />
                        </ProtectedMasterRoute>
                      } />
                      {/* Fallback to Dashboard */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
