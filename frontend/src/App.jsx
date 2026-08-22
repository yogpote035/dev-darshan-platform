import React from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdProvider } from './context/AdContext';

// Pages
import Home from './pages/Home';
import Live from './pages/Live';
import VideoDetails from './pages/VideoDetails';
import Subscription from './pages/Subscription';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderDetails from './pages/OrderDetails';
import MySubscriptions from './pages/MySubscriptions';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Notifications from './pages/Notifications';
import Refer from './pages/Refer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import RefundPolicy from './pages/RefundPolicy';
import ShippingPolicy from './pages/ShippingPolicy';

// Components
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
import AdPopup from './components/AdPopup';

// Layout manager to hide navigation bars on Auth Screens (Login / Register)
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';

  return (
    <div className="flex flex-col min-h-screen bg-bgDark">
      {/* Top Brand Header (Hidden on auth views) */}
      {!isAuthPage && <Header />}

      {/* Main Content Area */}
      <main className="flex-grow max-w-lg mx-auto w-full flex flex-col justify-between">
        <div className="flex-grow">
          {children}
        </div>

        {/* Compliance Footer */}
        <footer className="mt-8 mb-24 px-4 py-6 border-t border-zinc-900 text-center text-[10px] text-gray-500">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-3">
            <Link to="/privacy-policy" className="hover:text-amber-500 transition-colors text-decoration-none">Privacy Policy</Link>
            <Link to="/terms-conditions" className="hover:text-amber-500 transition-colors text-decoration-none">Terms & Conditions</Link>
            <Link to="/refund-policy" className="hover:text-amber-500 transition-colors text-decoration-none">Refund Policy</Link>
            <Link to="/shipping-policy" className="hover:text-amber-500 transition-colors text-decoration-none">Shipping & Delivery</Link>
          </div>
          <div>© {new Date().getFullYear()} Dev Darshan Live. All rights reserved.</div>
        </footer>
      </main>

      {/* Bottom Sticky Tabs */}
      <BottomNavigation />

      {/* Full screen Interstitial Ad Overlay */}
      <AdPopup />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AdProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/live" element={<Live />} />
            <Route path="/video/:id" element={<VideoDetails />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/my-subscriptions" element={<MySubscriptions />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/refer" element={<Refer />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
          </Routes>
        </AppLayout>
      </AdProvider>
    </AuthProvider>
  );
}

export default App;
