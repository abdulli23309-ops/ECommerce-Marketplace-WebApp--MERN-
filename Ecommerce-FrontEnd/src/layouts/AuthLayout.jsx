import { Outlet } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
import { setCredentials } from "../store/authSlice";
import BrandLogo from "../components/common/BrandLogo";
import Footer from "../components/common/Footer";

const GoogleAuthSection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;

      const { data } = await axiosInstance.post("/auth/google", {
        idToken,
      });

      const { user, tokens } = data.data;

      dispatch(
        setCredentials({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
          user,
        })
      );

      navigate("/");
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  return (
    <div style={{ width: "100%", marginTop: "1rem" }}>
      <GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={() => console.error("Google login error")}
  size="large"
  text="continue_with"
  shape="pill"
/>
    </div>
  );
};

const AuthLayout = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="auth-layout">
        <div className="auth-frame">
          <div className="auth-branding">
            <BrandLogo
              variant="combine"
              className="auth-logo"
              maxWidth="200px"
            />
          </div>

          <div className="auth-card">
            <Outlet />

            <div className="auth-divider">
              <span>or</span>
            </div>

            <GoogleAuthSection />
          </div>
        </div>

        <Footer />
      </div>
    </GoogleOAuthProvider>
  );
};

export default AuthLayout;