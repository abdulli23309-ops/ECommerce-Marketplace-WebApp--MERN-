import { Outlet } from "react-router-dom";
import BrandLogo from "../components/common/BrandLogo"; // Adjust path if needed
import Footer from "../components/common/Footer"; // Adjust path if needed

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-frame">
        <div className="auth-branding">
          {/* Use the new "combine" variant here */}
          <BrandLogo 
            variant="combine" 
            className="auth-logo" 
            maxWidth="200px" 
          />
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