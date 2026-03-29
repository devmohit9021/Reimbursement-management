import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './layouts/AppShell';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Shared Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ExpensesListPage from './pages/expenses/ExpensesListPage';
import SubmitExpensePage from './pages/expenses/SubmitExpensePage';
import ExpenseDetailPage from './pages/expenses/ExpenseDetailPage';
import ApprovalsPage from './pages/approvals/ApprovalsPage';

// Admin Pages
import UserManagementPage from './pages/admin/UserManagementPage';
import WorkflowsPage from './pages/admin/WorkflowsPage';
import RulesPage from './pages/admin/RulesPage';
import SettingsPage from './pages/admin/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function AuthLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: { borderRadius: '12px', fontSize: '14px' },
                success: { iconTheme: { primary: '#4F46E5', secondary: '#fff' } },
              }}
            />
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected — All roles */}
              <Route path="/dashboard" element={<AuthLayout><DashboardPage /></AuthLayout>} />
              <Route path="/expenses" element={<AuthLayout><ExpensesListPage /></AuthLayout>} />
              <Route path="/expenses/new" element={<AuthLayout><ProtectedRoute roles={['EMPLOYEE', 'ADMIN']}><SubmitExpensePage /></ProtectedRoute></AuthLayout>} />
              <Route path="/expenses/:id" element={<AuthLayout><ExpenseDetailPage /></AuthLayout>} />

              {/* Manager + Admin */}
              <Route path="/approvals" element={<AuthLayout><ProtectedRoute roles={['MANAGER', 'ADMIN']}><ApprovalsPage /></ProtectedRoute></AuthLayout>} />

              {/* Admin only */}
              <Route path="/admin/users" element={<AuthLayout><ProtectedRoute roles={['ADMIN']}><UserManagementPage /></ProtectedRoute></AuthLayout>} />
              <Route path="/admin/workflows" element={<AuthLayout><ProtectedRoute roles={['ADMIN']}><WorkflowsPage /></ProtectedRoute></AuthLayout>} />
              <Route path="/admin/rules" element={<AuthLayout><ProtectedRoute roles={['ADMIN']}><RulesPage /></ProtectedRoute></AuthLayout>} />
              <Route path="/admin/settings" element={<AuthLayout><ProtectedRoute roles={['ADMIN']}><SettingsPage /></ProtectedRoute></AuthLayout>} />

              {/* Fallback */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
