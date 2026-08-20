import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { setCredentials } from "../../store/authSlice";

const GoogleAuthButton = () => {
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
        width="100%"
      />
    </div>
  );
};

const GoogleAuthButtonWrapper = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <GoogleAuthButton />
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthButtonWrapper;