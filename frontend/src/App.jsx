import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@store/auth.store';
import { useSocketStore } from '@store/socket.store';
import { useNotificationStore } from '@store/notification.store';
import { AuthProvider } from '@contexts/AuthContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import { SocketProvider } from '@contexts/SocketContext';

// Layouts
import AuthLayout from '@layouts/AuthLayout';
import DashboardLayout from '@layouts/DashboardLayout';
import AdminLayout from '@layouts/AdminLayout';

// Pages publiques
import Login from '@pages/auth/Login';
import ForgotPassword from '@pages/auth/ForgotPassword';
import ResetPassword from '@pages/auth/ResetPassword';
import VerifyEmail from '@pages/auth/VerifyEmail';
import Register from '@pages/auth/Register';

// Pages Dashboard (Commun)
import Dashboard from '@pages/dashboard/Dashboard';
import Profile from '@pages/profile/Profile';
import Settings from '@pages/settings/Settings';
import Messages from '@pages/messages/Messages';
import MessageDetail from '@pages/messages/MessageDetail';
import Meetings from '@pages/meetings/Meetings';
import MeetingRoom from '@pages/meetings/MeetingRoom';
import Documents from '@pages/documents/Documents';
import DocumentView from '@pages/documents/DocumentView';
import Notifications from '@pages/notifications/Notifications';
import Tasks from '@pages/tasks/Tasks';
import TaskDetail from '@pages/tasks/TaskDetail';
import NewTask from '@pages/tasks/NewTask';

// Pages Admin Système
import AdminCompanies from '@pages/admin/AdminCompanies';
import AdminCompanyDetail from '@pages/admin/AdminCompanyDetail';
import AdminCreateCompany from '@pages/admin/AdminCreateCompany';
import AdminSubscriptions from '@pages/admin/AdminSubscriptions';
import AdminUsers from '@pages/admin/AdminUsers';
// ✅ AJOUT : Import du composant NewUser
import NewUser from '@pages/admin/NewUser';
import AdminAudit from '@pages/admin/AdminAudit';
import AdminSettings from '@pages/admin/AdminSettings';
import AdminDashboard from '@pages/admin/AdminDashboard';

// Pages Admin Entreprise
import CompanyUsers from '@pages/company/CompanyUsers';
import CompanyRoles from '@pages/company/CompanyRoles';
import CompanySettings from '@pages/company/CompanySettings';

// Pages Logistique
import LogisticsDashboard from '@pages/logistics/LogisticsDashboard';
import Warehouses from '@pages/logistics/Warehouses';
import Inventory from '@pages/logistics/Inventory';
import PurchaseOrders from '@pages/logistics/PurchaseOrders';
import Shipments from '@pages/logistics/Shipments';
import NewWarehouse from '@pages/logistics/NewWarehouse';
import NewInventoryMovement from '@pages/logistics/NewInventoryMovement';
import NewPurchaseOrder from '@pages/logistics/NewPurchaseOrder';
import NewShipment from '@pages/logistics/NewShipment';

// Pages Comptabilité
import AccountingDashboard from '@pages/accounting/AccountingDashboard';
import ChartOfAccounts from '@pages/accounting/ChartOfAccounts';
import JournalEntries from '@pages/accounting/JournalEntries';
import Invoices from '@pages/accounting/Invoices';
import Payments from '@pages/accounting/Payments';
import Reports from '@pages/accounting/Reports';
import NewJournalEntry from '@pages/accounting/NewJournalEntry';
import NewInvoice from '@pages/accounting/NewInvoice';
import NewPayment from '@pages/accounting/NewPayment';

// Guard
import PrivateRoute from '@components/guards/PrivateRoute';
import AdminRoute from '@components/guards/AdminRoute';
import SystemAdminRoute from '@components/guards/SystemAdminRoute';

// Styles
import "./styles/globals.css";
import 'react-datepicker/dist/react-datepicker.css';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000
    }
  }
});

function AppContent() {
  const { user, checkAuth, isAuthenticated } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const { fetchNotifications, subscribeToNotifications } = useNotificationStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connect(user.id);
      fetchNotifications();
      subscribeToNotifications();
    }
    
    return () => {
      disconnect();
    };
  }, [isAuthenticated, user?.id, connect, disconnect, fetchNotifications, subscribeToNotifications]);

  return (
    <Routes>
      {/* Routes publiques */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
      </Route>

      {/* Routes protégées - Dashboard principal */}
      <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:messageId" element={<MessageDetail />} />
        
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/meetings/:meetingId" element={<MeetingRoom />} />
        
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:documentId" element={<DocumentView />} />
        
        <Route path="/notifications" element={<Notifications />} />
        
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/new" element={<NewTask />} />
        <Route path="/tasks/:taskId" element={<TaskDetail />} />

        <Route path="/company">
          <Route path="users" element={<AdminRoute requireCompanyAdmin><CompanyUsers /></AdminRoute>} />
          <Route path="roles" element={<AdminRoute requireCompanyAdmin><CompanyRoles /></AdminRoute>} />
          <Route path="settings" element={<AdminRoute requireCompanyAdmin><CompanySettings /></AdminRoute>} />
        </Route>

        <Route path="/logistics">
          <Route path="dashboard" element={<PrivateRoute requireModules={['LOGISTICS']}><LogisticsDashboard /></PrivateRoute>} />
          <Route path="warehouses" element={<PrivateRoute requireModules={['LOGISTICS']}><Warehouses /></PrivateRoute>} />
          <Route path="warehouses/new" element={<PrivateRoute requireModules={['LOGISTICS']}><NewWarehouse /></PrivateRoute>} />
          <Route path="inventory" element={<PrivateRoute requireModules={['LOGISTICS']}><Inventory /></PrivateRoute>} />
          <Route path="inventory/movement/new" element={<PrivateRoute requireModules={['LOGISTICS']}><NewInventoryMovement /></PrivateRoute>} />
          <Route path="purchase-orders" element={<PrivateRoute requireModules={['LOGISTICS']}><PurchaseOrders /></PrivateRoute>} />
          <Route path="purchase-orders/new" element={<PrivateRoute requireModules={['LOGISTICS']}><NewPurchaseOrder /></PrivateRoute>} />
          <Route path="shipments" element={<PrivateRoute requireModules={['LOGISTICS']}><Shipments /></PrivateRoute>} />
          <Route path="shipments/new" element={<PrivateRoute requireModules={['LOGISTICS']}><NewShipment /></PrivateRoute>} />
        </Route>

        <Route path="/accounting">
          <Route path="dashboard" element={<PrivateRoute requireModules={['ACCOUNTING']}><AccountingDashboard /></PrivateRoute>} />
          <Route path="chart-of-accounts" element={<PrivateRoute requireModules={['ACCOUNTING']}><ChartOfAccounts /></PrivateRoute>} />
          <Route path="journal-entries" element={<PrivateRoute requireModules={['ACCOUNTING']}><JournalEntries /></PrivateRoute>} />
          <Route path="journal-entries/new" element={<PrivateRoute requireModules={['ACCOUNTING']}><NewJournalEntry /></PrivateRoute>} />
          <Route path="journal-entries/:id" element={<PrivateRoute requireModules={['ACCOUNTING']}><JournalEntries /></PrivateRoute>} />
          <Route path="invoices" element={<PrivateRoute requireModules={['ACCOUNTING']}><Invoices /></PrivateRoute>} />
          <Route path="invoices/new" element={<PrivateRoute requireModules={['ACCOUNTING']}><NewInvoice /></PrivateRoute>} />
          <Route path="invoices/:id" element={<PrivateRoute requireModules={['ACCOUNTING']}><Invoices /></PrivateRoute>} />
          <Route path="payments" element={<PrivateRoute requireModules={['ACCOUNTING']}><Payments /></PrivateRoute>} />
          <Route path="payments/new" element={<PrivateRoute requireModules={['ACCOUNTING']}><NewPayment /></PrivateRoute>} />
          <Route path="reports" element={<PrivateRoute requireModules={['ACCOUNTING']}><Reports /></PrivateRoute>} />
        </Route>
      </Route>

      {/* Routes Admin Système */}
      <Route element={<SystemAdminRoute><AdminLayout /></SystemAdminRoute>}>
        <Route path="/admin">
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="companies/create" element={<AdminCreateCompany />} />
          <Route path="companies/:id" element={<AdminCompanyDetail />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="users" element={<AdminUsers />} />
          {/* ✅ AJOUT : Route pour créer un nouvel utilisateur */}
          <Route path="users/new" element={<NewUser />} />
          <Route path="users/:id" element={<AdminUsers />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          <ThemeProvider>
            <SocketProvider>
              <AppContent />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 5000,
                  style: {
                    background: '#fff',
                    color: '#1e293b',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  },
                  success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                  error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
                }}
              />
            </SocketProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;