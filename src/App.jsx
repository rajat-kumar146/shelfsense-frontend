/**
 * App.jsx - Main routing component
 * Uses nested routes so Layout renders <Outlet /> for page content.
 */
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout/Layout";
import Loader from "./components/UI/Loader";

// Pages
import Login           from "./pages/Login";
import Signup          from "./pages/Signup";
import Dashboard       from "./pages/Dashboard";
import AddProduct      from "./pages/AddProduct";
import ProductList     from "./pages/ProductList";
import ScannerPage     from "./pages/Scanner";
import Reports         from "./pages/Reports";
import ReminderSettings from "./pages/ReminderSettings";
import AccountSettings from "./pages/AccountSettings";

// ─── Auth guards ──────────────────────────────────────────────────────────────
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  return <Layout />;   // Layout renders <Outlet /> for child pages
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
};

// ─── Routes ───────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    {/* Public */}
    <Route path="/login"  element={<PublicRoute><Login  /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

    {/* Protected — all nested under Layout */}
    <Route element={<ProtectedLayout />}>
      <Route path="/dashboard"          element={<Dashboard />} />
      <Route path="/products"           element={<ProductList />} />
      <Route path="/products/add"       element={<AddProduct />} />
      <Route path="/products/edit/:id"  element={<AddProduct />} />
      <Route path="/scanner"            element={<ScannerPage />} />
      <Route path="/reports"            element={<Reports />} />
      <Route path="/reminders"          element={<ReminderSettings />} />
      <Route path="/account"            element={<AccountSettings />} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}