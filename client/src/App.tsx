import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import { AdminLayout } from './components/layout/AdminLayout';
import { PortalLayout } from './components/layout/PortalLayout';
import { AiAssistantWidget } from './components/common/AiAssistantWidget';

// Public & Auth Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SubscriptionManagerPage } from './pages/admin/SubscriptionManagerPage';
import { InvoiceManagerPage } from './pages/admin/InvoiceManagerPage';
import { PaymentManagerPage } from './pages/admin/PaymentManagerPage';
import { ProductPlanManagerPage } from './pages/admin/ProductPlanManagerPage';
import { AiIntelligencePage } from './pages/admin/AiIntelligencePage';
import { CustomerManagerPage } from './pages/admin/CustomerManagerPage';
import { QuotationManagerPage } from './pages/admin/QuotationManagerPage';
import { CouponManagerPage } from './pages/admin/CouponManagerPage';
import { RenewalCalendarPage } from './pages/admin/RenewalCalendarPage';
import { StaffManagerPage } from './pages/admin/StaffManagerPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { WebhookManagerPage } from './pages/admin/WebhookManagerPage';

// Portal Pages
import { CustomerSubscriptionsPage } from './pages/portal/CustomerSubscriptionsPage';
import { CustomerInvoicesPage } from './pages/portal/CustomerInvoicesPage';
import { CustomerUsagePage } from './pages/portal/CustomerUsagePage';
import { CustomerTeamPage } from './pages/portal/CustomerTeamPage';
import { CustomerAiAssistantPage } from './pages/portal/CustomerAiAssistantPage';
import { CustomerReferralPage } from './pages/portal/CustomerReferralPage';
import { CustomerSettingsPage } from './pages/portal/CustomerSettingsPage';

// Route Guards
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-xs">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'customer') return <Navigate to="/portal" replace />;
  return <>{children}</>;
};

const SuperAdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'super_admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

const PortalRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-xs">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Landing & Auth */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Super Admin & Staff Portal */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="subscriptions" element={<SubscriptionManagerPage />} />
                    <Route path="invoices" element={<InvoiceManagerPage />} />
                    <Route path="payments" element={<PaymentManagerPage />} />
                    <Route path="products" element={<ProductPlanManagerPage />} />
                    <Route path="ai" element={<AiIntelligencePage />} />
                    <Route path="customers" element={<CustomerManagerPage />} />
                    <Route path="quotations" element={<QuotationManagerPage />} />
                    <Route path="coupons" element={<CouponManagerPage />} />
                    <Route path="calendar" element={<RenewalCalendarPage />} />
                    <Route
                      path="staff"
                      element={
                        <SuperAdminOnlyRoute>
                          <StaffManagerPage />
                        </SuperAdminOnlyRoute>
                      }
                    />
                    <Route
                      path="audit-logs"
                      element={
                        <SuperAdminOnlyRoute>
                          <AuditLogPage />
                        </SuperAdminOnlyRoute>
                      }
                    />
                    <Route
                      path="webhooks"
                      element={
                        <SuperAdminOnlyRoute>
                          <WebhookManagerPage />
                        </SuperAdminOnlyRoute>
                      }
                    />
                  </Route>

                  {/* Customer Self-Service Portal */}
                  <Route
                    path="/portal"
                    element={
                      <PortalRoute>
                        <PortalLayout />
                      </PortalRoute>
                    }
                  >
                    <Route index element={<CustomerSubscriptionsPage />} />
                    <Route path="invoices" element={<CustomerInvoicesPage />} />
                    <Route path="usage" element={<CustomerUsagePage />} />
                    <Route path="team" element={<CustomerTeamPage />} />
                    <Route path="ai-assistant" element={<CustomerAiAssistantPage />} />
                    <Route path="referrals" element={<CustomerReferralPage />} />
                    <Route path="settings" element={<CustomerSettingsPage />} />
                  </Route>

                  {/* Catch-all fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                {/* Floating AI Intelligence Assistant on all screens */}
                <AiAssistantWidget />
              </BrowserRouter>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
};

export default App;
