import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';
import { SocketProvider } from './context/SocketContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ToastContainer from './components/layout/ToastContainer';

// Pages
import LandingPage from './components/pages/LandingPage';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import ServicesPage from './components/pages/ServicesPage';
import ServiceDetailPage from './components/pages/ServiceDetailPage';
import MapPage from './components/pages/MapPage';
import TicketNewPage from './components/pages/TicketNewPage';
import HistoryPage from './components/pages/HistoryPage';
import ExchangePage from './components/pages/ExchangePage';
import ProfilePage from './components/pages/ProfilePage';
import AdminDashboardPage from './components/pages/AdminDashboardPage';
import AdminHistoryPage from './components/pages/AdminHistoryPage';
import AdminStructureInfoPage from './components/pages/AdminStructureInfoPage';
import ChatBotPage from './components/pages/ChatBotPage';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

// Layout Wrapper to conditionally show Navbar/Footer
const AppLayout = ({ children, noLayout = false }) => {
  if (noLayout) return <main>{children}</main>;
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <QueueProvider>
            <ToastContainer />
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
            <Route path="/login" element={<AppLayout noLayout><LoginPage /></AppLayout>} />
            <Route path="/register" element={<AppLayout noLayout><RegisterPage /></AppLayout>} />
            <Route path="/services" element={<AppLayout><ServicesPage /></AppLayout>} />
            <Route path="/services/:id" element={<AppLayout><ServiceDetailPage /></AppLayout>} />
            <Route path="/map" element={<AppLayout noLayout><MapPage /></AppLayout>} /> {/* MapPage handles its own top padding */}
            <Route path="/chatbot" element={<AppLayout noLayout><ChatBotPage /></AppLayout>} />

            {/* Protected Pages */}
            <Route path="/ticket/new" element={<ProtectedRoute><AppLayout><TicketNewPage /></AppLayout></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><AppLayout><HistoryPage /></AppLayout></ProtectedRoute>} />
            <Route path="/exchanges" element={<ProtectedRoute><AppLayout><ExchangePage /></AppLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
            
            {/* Admin Pages */}
            <Route path="/admin" element={<ProtectedRoute><AppLayout><AdminDashboardPage /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/history" element={<ProtectedRoute><AppLayout><AdminHistoryPage /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/info" element={<ProtectedRoute><AppLayout><AdminStructureInfoPage /></AppLayout></ProtectedRoute>} />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </QueueProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
