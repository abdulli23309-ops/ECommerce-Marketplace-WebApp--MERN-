import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { setCredentials } from "../../store/authSlice";
import { fetchPermissions } from "../../store/permissionsSlice";

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors }, setError } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const result = await loginUser(data.email, data.password);
      if (!result.accessToken) {
        setError("root", { message: result.message || "Login failed" });
        return;
      }

      // MERN response already contains user with roles and permissions
      const { user, accessToken, refreshToken } = result;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      dispatch(fetchPermissions());
      // Role-based redirect
      if (user.roles.includes("Admin")) {
        navigate("/admin/dashboard");
      } else if (user.roles.includes("Seller")) {
        navigate("/seller/products");
      } else {
        navigate("/"); // Customer home
      }
    } catch (err) {
      setError("root", { message: "Network error. Please try again." });
    }
  };

  return (
    <div>
      <h1 className="auth-title">Sign in</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            {...register("email", { required: true })}
            className="form-input"
            placeholder="name@example.com"
          />
          {errors.email && <p className="error-text">Email is required</p>}
        </div>
        
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            {...register("password", { required: true })}
            className="form-input"
            placeholder="••••••••"
          />
          {errors.password && <p className="error-text">Password is required</p>}
        </div>
        
        {errors.root && <p className="error-text">{errors.root.message}</p>}
        
        <button type="submit" className="btn-primary">
          Sign In
        </button>
      </form>
      
      <p className="auth-footer">
        Don't have an account?{" "}
        <Link to="/register" className="auth-link">
          Create one
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;