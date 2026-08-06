import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../services/authService";

const RegisterPage = () => {
  const { register, handleSubmit, formState: { errors }, setError } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const result = await registerUser(data.fullName, data.email, data.password, data.confirmPassword);
      if (!result.accessToken) {
        setError("root", { message: result.message || "Registration failed" });
        return;
      }
      navigate("/login");
    } catch (err) {
      setError("root", { message: "Network error. Please try again." });
    }
  };

  return (
    <div>
      <h1 className="auth-title">Create your account</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            {...register("fullName", { required: true })}
            className="form-input"
            placeholder="John Doe"
          />
          {errors.fullName && <p className="error-text">Required</p>}
        </div>
        
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            {...register("email", { required: true })}
            className="form-input"
            placeholder="name@example.com"
          />
          {errors.email && <p className="error-text">Required</p>}
        </div>
        
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            {...register("password", { required: true, minLength: 6 })}
            className="form-input"
            placeholder="••••••••"
          />
          {errors.password && <p className="error-text">Min 6 characters</p>}
        </div>
        
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            {...register("confirmPassword", { required: true })}
            className="form-input"
            placeholder="••••••••"
          />
          {errors.confirmPassword && <p className="error-text">Required</p>}
        </div>
        
        {errors.root && <p className="error-text">{errors.root.message}</p>}
        
        <button type="submit" className="btn-primary">
          Register
        </button>
      </form>
      
      <p className="auth-footer">
        Already have an account?{" "}
        <Link to="/login" className="auth-link">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;