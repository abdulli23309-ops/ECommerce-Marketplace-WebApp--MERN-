import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveDashboard } from "../../store/dashboardContextSlice";

const DashboardSwitcher = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { actualRole, activeDashboard } = useSelector((state) => state.dashboardContext);

  const handleSwitch = (dashboard) => {
    dispatch(setActiveDashboard(dashboard));

    if (dashboard === "admin") navigate("/admin/dashboard");
    if (dashboard === "seller") navigate("/seller/dashboard");
    if (dashboard === "customer") navigate("/");
  };

  const handleReturnToActual = () => {
    const actual = actualRole;

    if (actual === "Admin") handleSwitch("admin");
    else if (actual === "Seller") handleSwitch("seller");
    else handleSwitch("customer");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {activeDashboard !== "customer" && (
        <button
          className="btn-logout"
          onClick={() => handleSwitch("customer")}
        >
          🛍️ Switch to Customer
        </button>
      )}

      {actualRole === "Admin" && activeDashboard === "customer" && (
        <button
          className="btn-logout"
          onClick={() => handleSwitch("admin")}
        >
          ⚙️ Return to Admin Dashboard
        </button>
      )}

      {actualRole === "Seller" && activeDashboard === "customer" && (
        <button
          className="btn-logout"
          onClick={() => handleSwitch("seller")}
        >
          🏪 Return to Seller Dashboard
        </button>
      )}

      {actualRole === "Admin" && activeDashboard === "seller" && (
        <button
          className="btn-logout"
          onClick={() => handleSwitch("admin")}
        >
          ⚙️ Return to Admin Dashboard
        </button>
      )}
    </div>
  );
};

export default DashboardSwitcher;