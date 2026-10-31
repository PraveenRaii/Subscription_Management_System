import React, { lazy, Suspense } from 'react';
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
const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const SubscriptionManagerPage = lazy(() => import('./pages/admin/SubscriptionManagerPage').then((module) => ({ default: module.SubscriptionManagerPage })));
const InvoiceManagerPage = lazy(() => import('./pages/admin/InvoiceManagerPage').then((module) => ({ default: module.InvoiceManagerPage })));
const PaymentManagerPage = lazy(() => import('./pages/admin/PaymentManagerPage').then((module) => ({ default: module.PaymentManagerPage })));
const ProductPlanManagerPage = lazy(() => import('./pages/admin/ProductPlanManagerPage').then((module) => ({ default: module.ProductPlanManagerPage })));
const AiIntelligencePage = lazy(() => import('./pages/admin/AiIntelligencePage').then((module) => ({ default: module.AiIntelligencePage })));
const CustomerManagerPage = lazy(() => import('./pages/admin/CustomerManagerPage').then((module) => ({ default: module.CustomerManagerPage })));
const QuotationManagerPage = lazy(() => import('./pages/admin/QuotationManagerPage').then((module) => ({ default: module.QuotationManagerPage })));
const CouponManagerPage = lazy(() => import('./pages/admin/CouponManagerPage').then((module) => ({ default: module.CouponManagerPage })));
const RenewalCalendarPage = lazy(() => import('./pages/admin/RenewalCalendarPage').then((module) => ({ default: module.RenewalCalendarPage })));
const StaffManagerPage = lazy(() => import('./pages/admin/StaffManagerPage').then((module) => ({ default: module.StaffManagerPage })));
const AuditLogPage = lazy(() => import('./pages/admin/AuditLogPage').then((module) => ({ default: module.AuditLogPage })));
const WebhookManagerPage = lazy(() => import('./pages/admin/WebhookManagerPage').then((module) => ({ default: module.WebhookManagerPage })));

// Portal Pages
const CustomerSubscriptionsPage = lazy(() => import('./pages/portal/CustomerSubscriptionsPage').then((module) => ({ default: module.CustomerSubscriptionsPage })));
const CustomerInvoicesPage = lazy(() => import('./pages/portal/CustomerInvoicesPage').then((module) => ({ default: module.CustomerInvoicesPage })));
const CustomerUsagePage = lazy(() => import('./pages/portal/CustomerUsagePage').then((module) => ({ default: module.CustomerUsagePage })));
const CustomerTeamPage = lazy(() => import('./pages/portal/CustomerTeamPage').then((module) => ({ default: module.CustomerTeamPage })));
const CustomerAiAssistantPage = lazy(() => import('./pages/portal/CustomerAiAssistantPage').then((module) => ({ default: module.CustomerAiAssistantPage })));
const CustomerReferralPage = lazy(() => import('./pages/portal/CustomerReferralPage').then((module) => ({ default: module.CustomerReferralPage })));
const CustomerSettingsPage = lazy(() => import('./pages/portal/CustomerSettingsPage').then((module) => ({ default: module.CustomerSettingsPage })));

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
                <Suspense fallback={<div className="min-h-[40vh] p-8 text-center text-xs text-zinc-500">Loading page…</div>}>
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
                </Suspense>

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
