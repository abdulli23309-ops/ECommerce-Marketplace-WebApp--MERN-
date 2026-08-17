import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchPermissions } from "./store/permissionsSlice";
import AuthLayout from "./layouts/AuthLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import SellerLayout from "./layouts/SellerLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/customer/HomePage";
import AboutPage from "./pages/customer/AboutPage";
import CartPage from "./pages/customer/CartPage";
import OrderHistoryPage from "./pages/customer/OrderHistoryPage";
import ProfilePage from "./pages/customer/ProfilePage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import SellerProductsPage from "./pages/seller/SellerProductsPage";
import ProductForm from "./pages/seller/ProductForm";
import SellerOrdersPage from "./pages/seller/SellerOrdersPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import SellerApprovalPage from "./pages/admin/SellerApprovalPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminBrandsPage from "./pages/admin/AdminBrandsPage";
import ProductModerationPage from "./pages/admin/ProductModerationPage";
import ReturnsManagementPage from "./pages/admin/ReturnsManagementPage";
import RefundManagementPage from "./pages/admin/RefundManagementPage";
import ProductDetailPage from "./pages/customer/ProductDetailPage";
import SellerPendingPage from "./pages/seller/SellerPendingPage";
import SellerRegisterPage from "./pages/seller/SellerRegisterPage";
import RolePermissionGroupsPage from "./pages/admin/RolePermissionGroupsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AddressBookPage from "./pages/customer/AddressBookPage";
import ProductListingPage from "./pages/customer/ProductListingPage";
import StoreSettingsPage from "./pages/seller/StoreSettingsPage";
import StorePage from "./pages/customer/StorePage";
import OrderDetailPage from "./pages/customer/OrderDetailPage";
import SellerReviewsPage from "./pages/seller/SellerReviewsPage";
import SellerDashboardPage from "./pages/seller/SellerDashboardPage";
import ShipmentManagementPage from "./pages/seller/ShipmentManagementPage";
import ReviewPage from "./pages/customer/ReviewPage";
import MyReviewsPage from "./pages/customer/MyReviewsPage";
import ReviewDetailPage from "./pages/customer/ReviewDetailPage";
import PermissionGroupsPage from "./pages/admin/PermissionGroupsPage";
import RequestReturnPage from "./pages/customer/RequestReturnPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminShipmentsPage from "./pages/admin/AdminShipmentsPage";
import ProductGrid from "./pages/seller/ProductGrid";
import OrderConfirmationPage from "./pages/customer/OrderConfirmationPage";
import CustomerReturnsPage from "./pages/customer/CustomerReturnsPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import SellerReturnsPage from "./pages/seller/SellerReturnsPage";
import WishlistPage from "./pages/customer/WishlistPage"; // <-- add this import
import { useTheme } from "./hooks/useTheme";

const App = () => {
  useTheme();
  const dispatch = useDispatch();
  const { accessToken } = useSelector(state => state.auth);
  const { codes } = useSelector(state => state.permissions);

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchPermissions());
    }
  }, [accessToken, dispatch]);

  return (
    <Routes>
      {/* Public auth pages – NOT protected */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* PUBLIC storefront routes — NOT behind ProtectedRoute */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/products" element={<ProductListingPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/store/:storeId" element={<StorePage />} />
      </Route>

      {/* Customer routes that legitimately require an account – protected, allowed roles: Customer */}
     <Route element={<ProtectedRoute />}>
        <Route element={<CustomerLayout />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} /> {/* <-- add this route */}
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
        </Route>
      </Route>

      {/* Authenticated-only routes (any role) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<CustomerLayout />}>
          <Route path="/seller/register" element={<SellerRegisterPage />} />
          <Route path="/seller/pending" element={<SellerPendingPage />} />
        </Route>
      </Route>

      {/* Seller routes */}
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
        </Route>
      </Route>

      {/* Admin routes – protected, allowed roles: Admin */}
      <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/sellers" element={<SellerApprovalPage />} />
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
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
