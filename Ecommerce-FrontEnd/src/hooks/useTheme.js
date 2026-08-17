import { useEffect } from "react";
import { useSelector } from "react-redux";

export const useTheme = () => {
  const mode = useSelector((state) => state.theme.mode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  return mode;
};

export default useTheme;
