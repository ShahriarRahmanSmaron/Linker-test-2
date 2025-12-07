import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ValuePropSection } from './components/ValuePropSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { FabricPreviewSection } from './components/FabricPreviewSection';
import { MoodboardSection } from './components/MoodboardSection';
import { PricingSection } from './components/PricingSection';
import { ComparisonSection } from './components/ComparisonSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FAQSection } from './components/FAQSection';
import { FinalCTASection } from './components/FinalCTASection';
import { Footer } from './components/Footer';
import { SearchPage } from './components/SearchPage';
import { ManufacturerDashboard } from './components/manufacturer/ManufacturerDashboard';
import { BuyerDashboard } from './components/buyer/BuyerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { ApprovalPending } from './components/ApprovalPending';

import { LoginPage } from './components/LoginPage';
import { AuthProvider } from './components/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { LightModeWrapper } from './components/LightModeWrapper';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary-100 dark:selection:bg-primary-900 selection:text-primary-900 dark:selection:text-primary-100 bg-white dark:bg-neutral-900 transition-colors">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <ValuePropSection />
        <HowItWorksSection />
        <FabricPreviewSection />
        <MoodboardSection />
        <PricingSection />
        <ComparisonSection />
        <TestimonialsSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
};

// Wrapper to use useNavigate inside AuthProvider
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LightModeWrapper><LoginPage /></LightModeWrapper>} />
      
      {/* Admin Login - Legacy auth (separate from Clerk) */}
      <Route path="/admin-login" element={<LightModeWrapper><AdminLoginPage /></LightModeWrapper>} />

      {/* Manufacturer Approval Pending Page */}
      <Route path="/approval-pending" element={<LightModeWrapper><ApprovalPending /></LightModeWrapper>} />

      {/* Search - Allow both verified buyers and general users */}
      <Route
        path="/search"
        element={
          <ProtectedRoute allowedRoles={['buyer', 'general_user']}>
            <LightModeWrapper>
              <SearchPage />
            </LightModeWrapper>
          </ProtectedRoute>
        }
      />

      {/* Manufacturer Dashboard - Requires approval */}
      <Route
        path="/manufacturer-dashboard"
        element={
          <ProtectedRoute allowedRole="manufacturer" requireApproval>
            <LightModeWrapper>
              <ManufacturerDashboard />
            </LightModeWrapper>
          </ProtectedRoute>
        }
      />

      {/* Admin Dashboard - Legacy JWT auth only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <LightModeWrapper>
              <AdminDashboard />
            </LightModeWrapper>
          </ProtectedRoute>
        }
      />

      {/* Buyer Dashboard - Allow both verified buyers and general users */}
      <Route
        path="/buyer-dashboard"
        element={
          <ProtectedRoute allowedRoles={['buyer', 'general_user']}>
            <LightModeWrapper>
              <BuyerDashboard />
            </LightModeWrapper>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};



export default App;
