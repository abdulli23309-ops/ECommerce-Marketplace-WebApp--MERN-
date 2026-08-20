import { Link } from "react-router-dom";

const MetricCard = ({ to, children, highlight = false, onClick }) => {
  const className = `metric-card ${highlight ? "metric-card-highlight" : ""}`;

  if (to) {
    return (
      <Link to={to} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
};

export default MetricCard;