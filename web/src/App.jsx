import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import VisitForm from './components/VisitForm';
import CustomersPage from './components/CustomersPage';
import PermissionsPage from './components/PermissionsPage';
import VisitDetail from './components/VisitDetail';
import VisitPrint from './components/VisitPrint';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
axios.defaults.withCredentials = true;
console.log(axios.defaults.baseURL)
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/v1/oauth/check');
      if (response.data.authenticated) {
        setUser(response.data.data.user);
        setAuthenticated(true);
      }
    } catch (error) {
      console.log('Not authenticated');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/oauth/logout');
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              authenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <LoginPage />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              authenticated ? 
              <Layout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
              </Layout> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route
            path="/visits/new"
            element={
              authenticated ?
              <Layout user={user} onLogout={handleLogout}>
                <VisitForm />
              </Layout> :
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/visits/:id"
            element={
              authenticated ?
              <Layout user={user} onLogout={handleLogout}>
                <VisitDetail user={user} />
              </Layout> :
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/visits/:id/print"
            element={
              authenticated ?
              // No Layout for clean print view
              <VisitPrint /> :
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/visits/:id/edit"
            element={
              authenticated ?
              <Layout user={user} onLogout={handleLogout}>
                <VisitForm />
              </Layout> :
              <Navigate to="/login" replace />
            }
          />
          <Route 
            path="/" 
            element={
              <Navigate to={authenticated ? "/dashboard" : "/login"} replace />
            } 
          />
          <Route
            path="/customers"
            element={
              authenticated ?
              <Layout user={user} onLogout={handleLogout}>
                <CustomersPage />
              </Layout> :
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/admin/permissions"
            element={
              authenticated && user?.role === 'admin' ?
              <Layout user={user} onLogout={handleLogout}>
                <PermissionsPage />
              </Layout> :
              <Navigate to={authenticated ? "/dashboard" : "/login"} replace />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
