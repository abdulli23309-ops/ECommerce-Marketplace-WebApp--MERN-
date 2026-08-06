import { Outlet } from "react-router-dom";
import BrandLogo from "../components/common/BrandLogo";
import Footer from "../components/common/Footer";

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-frame">
        <div className="auth-branding">
          <BrandLogo variant="wordmark" className="auth-logo" />
        </div>
        <div className="auth-card">
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AuthLayout;