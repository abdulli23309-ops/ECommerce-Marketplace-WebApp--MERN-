import { useSelector } from "react-redux";
import {
  vendorverseMark,
  vendorverseWordmark,
  vendorverseWordMarkcombine,
} from "../../assets/branding";

const BrandLogo = ({
  variant = "wordmark",
  className = "",
  forceTheme = null,
  maxWidth = null,
  ...props
}) => {
  const mode = useSelector((state) => state.theme.mode);
  const resolvedTheme = forceTheme || mode;

  let assets;
  if (variant === "mark" || variant === "icon") {
    assets = vendorverseMark;
  } else if (variant === "combine") {
    assets = vendorverseWordMarkcombine;
  } else {
    assets = vendorverseWordmark;
  }

  const src = resolvedTheme === "dark" ? assets.dark : assets.light;

  return (
    <img
      src={src}
      alt="VendorVerse"
      className={`brand-image ${className}`.trim()}
      style={{
        width: maxWidth ? "100%" : "auto",
        maxWidth: maxWidth || "none",
        height: "auto",
        objectFit: "contain",
        display: "block",
        background: "transparent",
      }}
      {...props}
    />
  );
};

export default BrandLogo;