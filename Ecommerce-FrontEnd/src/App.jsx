import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "./hooks/useTheme";
import { fetchPermissions } from "./store/permissionsSlice";
import {
  setActualRole,
  setActiveDashboard,
  resetDashboardContext,
} from "./store/dashboardContextSlice";

// Eager: layouts, route guards, and shell-level NotFound/Login/Register stay
// synchronous so the app shell and auth never show a loading flash.
import AuthLayout from "./layouts/AuthLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import SellerLayout from "./layouts/SellerLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/customer/VerifyEmailPage";

// UI-08: route-level code-splitting. Every page module is lazy-loaded so the
// initial bundle stays small; the shell (layouts/guards) stays eager.
const HomePage = lazy(() => import("./pages/customer/HomePage"));
const AboutPage = lazy(() => import("./pages/customer/AboutPage"));
const ProductListingPage = lazy(() => import("./pages/customer/ProductListingPage"));
const ProductDetailPage = lazy(() => import("./pages/customer/ProductDetailPage"));
const StorePage = lazy(() => import("./pages/customer/StorePage"));
const CartPage = lazy(() => import("./pages/customer/CartPage"));
const WishlistPage = lazy(() => import("./pages/customer/WishlistPage"));
const ProfilePage = lazy(() => import("./pages/customer/ProfilePage"));
const CheckoutPage = lazy(() => import("./pages/customer/CheckoutPage"));
const OrderHistoryPage = lazy(() => import("./pages/customer/OrderHistoryPage"));
const AddressBookPage = lazy(() => import("./pages/customer/AddressBookPage"));
const OrderDetailPage = lazy(() => import("./pages/customer/OrderDetailPage"));
const ReviewPage = lazy(() => import("./pages/customer/ReviewPage"));
const ReviewSuccessPage = lazy(() => import("./pages/customer/ReviewSuccessPage"));
const RequestReturnPage = lazy(() => import("./pages/customer/RequestReturnPage"));
const CustomerReturnsPage = lazy(() => import("./pages/customer/CustomerReturnsPage"));
const MyReviewsPage = lazy(() => import("./pages/customer/MyReviewsPage"));
const OrderConfirmationPage = lazy(() => import("./pages/customer/OrderConfirmationPage"));
const ReviewDetailPage = lazy(() => import("./pages/customer/ReviewDetailPage"));

const SellerRegisterPage = lazy(() => import("./pages/seller/SellerRegisterPage"));
const SellerPendingPage = lazy(() => import("./pages/seller/SellerPendingPage"));
const SellerDashboardPage = lazy(() => import("./pages/seller/SellerDashboardPage"));
const ProductGrid = lazy(() => import("./pages/seller/ProductGrid"));
const ProductForm = lazy(() => import("./pages/seller/ProductForm"));
const SellerOrdersPage = lazy(() => import("./pages/seller/SellerOrdersPage"));
const StoreSettingsPage = lazy(() => import("./pages/seller/StoreSettingsPage"));
const ShipmentManagementPage = lazy(() => import("./pages/seller/ShipmentManagementPage"));
const SellerReviewsPage = lazy(() => import("./pages/seller/SellerReviewsPage"));
const SellerReturnsPage = lazy(() => import("./pages/seller/SellerReturnsPage"));
const SellerSuspendedPage = lazy(() => import("./pages/seller/SellerSuspendedPage"));
const SellerAppealsPage = lazy(() => import("./pages/seller/SellerAppealsPage"));
const SellerAppealDetailPage = lazy(() => import("./pages/seller/SellerAppealDetailPage"));
const SellerAppealNewPage = lazy(() => import("./pages/seller/SellerAppealNewPage"));

const SellerApprovalPage = lazy(() => import("./pages/admin/SellerApprovalPage"));
const AdminSellerAppealsPage = lazy(() => import("./pages/admin/AdminSellerAppealsPage"));
const ProductModerationPage = lazy(() => import("./pages/admin/ProductModerationPage"));
const ReturnsManagementPage = lazy(() => import("./pages/admin/ReturnsManagementPage"));
const RefundManagementPage = lazy(() => import("./pages/admin/RefundManagementPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const PermissionGroupsPage = lazy(() => import("./pages/admin/PermissionGroupsPage"));
const RolePermissionGroupsPage = lazy(() => import("./pages/admin/RolePermissionGroupsPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminShipmentsPage = lazy(() => import("./pages/admin/AdminShipmentsPage"));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage"));
const AdminBrandsPage = lazy(() => import("./pages/admin/AdminBrandsPage"));
const AdminAuditLogPage = lazy(() => import("./pages/admin/AdminAuditLogPage"));
const AdminCouponsPage = lazy(() => import("./pages/admin/AdminCouponsPage"));

const App = () => {
  useTheme();
  const dispatch = useDispatch();
  const { accessToken, user } = useSelector((state) => state.auth);
  const { codes } = useSelector((state) => state.permissions);

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchPermissions());
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (accessToken && user) {
      const rawRoles = [];

      if (Array.isArray(user.roles)) {
        user.roles.forEach((role) => {
          if (typeof role === "string") {
            rawRoles.push(role);
          } else if (role && typeof role === "object" && role.name) {
            rawRoles.push(role.name);
          }
        });
      } else if (typeof user.roles === "string") {
        rawRoles.push(user.roles);
      }

      if (user.role) {
        if (typeof user.role === "string") {
          rawRoles.push(user.role);
        } else if (user.role && typeof user.role === "object" && user.role.name) {
          rawRoles.push(user.role.name);
        }
      }

      let actualRole = "Customer";

      if (rawRoles.includes("Admin") || rawRoles.includes("SuperAdmin")) {
        actualRole = "Admin";
      } else if (rawRoles.includes("Seller")) {
        actualRole = "Seller";
      }

      dispatch(setActualRole(actualRole));

      dispatch(
        setActiveDashboard(
          actualRole === "Admin"
            ? "admin"
            : actualRole === "Seller"
              ? "seller"
              : "customer"
        )
      );
    } else {
      dispatch(resetDashboardContext());
    }
  }, [user, dispatch]); // do not re-run on silent token refresh

  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        color: 'var(--text-secondary)',
      }}>
        <span className="vv-skeleton vv-skeleton--title" style={{ width: '120px' }} />
      </div>
    }>
      <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/products" element={<ProductListingPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/store/:storeId" element={<StorePage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<CustomerLayout />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/addresses" element={<AddressBookPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/review/new/:sellerOrderId" element={<ReviewPage />} />
          <Route path="/returns/new/:sellerOrderId" element={<RequestReturnPage />} />
          <Route path="/returns" element={<CustomerReturnsPage />} />
          <Route path="/reviews/my" element={<MyReviewsPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                    <Route path="/reviews/:reviewId" element={<ReviewDetailPage />} />
          <Route path="/review/success" element={<ReviewSuccessPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<CustomerLayout />}>
          <Route path="/seller/register" element={<SellerRegisterPage />} />
          <Route path="/seller/pending" element={<SellerPendingPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Seller"]} />}>
        <Route element={<SellerLayout />}>
          <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
          <Route path="/seller/products" element={<ProductGrid />} />
          <Route path="/seller/products/new" element={<ProductForm />} />
          <Route path="/seller/products/edit/:id" element={<ProductForm />} />
          <Route path="/seller/orders" element={<SellerOrdersPage />} />
          <Route path="/seller/settings" element={<StoreSettingsPage />} />
          <Route path="/seller/shipments" element={<ShipmentManagementPage />} />
          <Route path="/seller/reviews" element={<SellerReviewsPage />} />
          <Route path="/seller/returns" element={<SellerReturnsPage />} />

          {/* Suspension & Appeals (reachable while suspended via SellerLayout allowlist) */}
          <Route path="/seller/suspended" element={<SellerSuspendedPage />} />
          <Route path="/seller/appeals" element={<SellerAppealsPage />} />
          <Route path="/seller/appeals/new" element={<SellerAppealNewPage />} />
          <Route path="/seller/appeals/:id" element={<SellerAppealDetailPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/sellers" element={<SellerApprovalPage />} />
          <Route path="/admin/seller-appeals" element={<AdminSellerAppealsPage />} />
          <Route path="/admin/products" element={<ProductModerationPage />} />
          <Route path="/admin/returns" element={<ReturnsManagementPage />} />
          <Route path="/admin/refunds" element={<RefundManagementPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/permission-groups" element={<PermissionGroupsPage />} />
          <Route path="/admin/role-permission-groups" element={<RolePermissionGroupsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/shipments" element={<AdminShipmentsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/brands" element={<AdminBrandsPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogPage />} />
          <Route path="/admin/coupons" element={<AdminCouponsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default App;