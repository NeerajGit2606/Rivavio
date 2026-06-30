// src/App.js

import { useSelector } from 'react-redux';
import {
  Navigate,
  Route, RouterProvider, createBrowserRouter, createRoutesFromElements
} from "react-router-dom";
import { selectIsAuthChecked, selectLoggedInUser } from './features/auth/AuthSlice';
import { Logout } from './features/auth/components/Logout';
import { Protected } from './features/auth/components/Protected';
import { useAuthCheck } from "./hooks/useAuth/useAuthCheck";
import { useFetchLoggedInUserDetails } from "./hooks/useAuth/useFetchLoggedInUserDetails";
import {
  AddProductPage, AdminAnalyticsPage, AdminBulkUploadPage, AdminCouponsPage,
  AdminOrdersPage, CartPage, CheckoutPage, ComparePage,
  ForgotPasswordPage, HomePage, LoginPage, OrderSuccessPage,
  OtpVerificationPage, ProductDetailsPage, ProductsPage, ProductUpdatePage,
  ResetPasswordPage, SharedWishlistPage, SignupPage, UserOrdersPage, UserProfilePage,
  WishlistPage
} from './pages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TawkToWidget } from './features/support/TawkToWidget';


function App() {

  const isAuthChecked = useSelector(selectIsAuthChecked)
  const loggedInUser = useSelector(selectLoggedInUser)

  useAuthCheck();
  useFetchLoggedInUserDetails(loggedInUser);

  const routes = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* ===== PUBLIC ROUTES (Bina Login Ke) ===== */}
        <Route path='/' element={<HomePage />} />  {/* ✅ HOME PAGE PUBLIC */}
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/verify-otp' element={<OtpVerificationPage />} />
        <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/reset-password/:userId/:passwordResetToken' element={<ResetPasswordPage />} />
        
        {/* ===== PUBLIC PRODUCTS LISTING (Shop) ===== */}
        <Route path='/products' element={<ProductsPage />} />  {/* ✅ PUBLIC */}

        {/* ===== PUBLIC PRODUCT DETAILS (Bina Login Ke) ===== */}
        <Route path='/product-details/:id' element={<ProductDetailsPage />} />  {/* ✅ PUBLIC */}

        {/* ===== PUBLIC: shared wishlist + compare ===== */}
        <Route path='/wishlist/shared/:userId' element={<SharedWishlistPage />} />
        <Route path='/compare' element={<ComparePage />} />

        {/* ===== LOGOUT ===== */}
        <Route path='/logout' element={<Protected><Logout /></Protected>} />

        {/* ===== ADMIN ROUTES ===== */}
        {
          loggedInUser?.isAdmin ? (
            <>
              <Route path='/admin/dashboard' element={<Protected><AdminDashboardPage /></Protected>} />
              <Route path='/admin/product-update/:id' element={<Protected><ProductUpdatePage /></Protected>} />
              <Route path='/admin/add-product' element={<Protected><AddProductPage /></Protected>} />
              <Route path='/admin/bulk-upload' element={<Protected><AdminBulkUploadPage /></Protected>} />
              <Route path='/admin/orders' element={<Protected><AdminOrdersPage /></Protected>} />
              <Route path='/admin/analytics' element={<Protected><AdminAnalyticsPage /></Protected>} />
              <Route path='/admin/coupons' element={<Protected><AdminCouponsPage /></Protected>} />
              <Route path='*' element={<Navigate to={'/admin/dashboard'} />} />
            </>
          ) : (
            // ===== USER ROUTES (Protected) =====
            <>
              <Route path='/cart' element={<Protected><CartPage /></Protected>} />
              <Route path='/profile' element={<Protected><UserProfilePage /></Protected>} />
              <Route path='/checkout' element={<Protected><CheckoutPage /></Protected>} />
              <Route path='/order-success/:id' element={<Protected><OrderSuccessPage /></Protected>} />
              <Route path='/orders' element={<Protected><UserOrdersPage /></Protected>} />
              <Route path='/wishlist' element={<Protected><WishlistPage /></Protected>} />
            </>
          )
        }

        {/* ===== 404 NOT FOUND ===== */}
        <Route path='*' element={<NotFoundPage />} />
      </>
    )
  )

  if (!isAuthChecked) return ""

  return (
    <>
      <RouterProvider router={routes} />
      <TawkToWidget />
    </>
  )
}

export default App;