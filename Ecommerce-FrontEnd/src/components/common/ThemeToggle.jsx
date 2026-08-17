import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../../store/themeSlice";

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const ThemeToggle = ({ className = "" }) => {
  const dispatch = useDispatch();
  const isDark = useSelector((state) => state.theme.mode === "dark");

  return (
    <button type="button" onClick={() => dispatch(toggleTheme())} className={`theme-toggle-btn ${className}`} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span className="theme-toggle-label">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
};

export default ThemeToggle;
