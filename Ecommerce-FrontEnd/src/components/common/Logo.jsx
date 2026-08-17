import { useSelector } from "react-redux";
import { vendorverseMark, vendorverseWordmark } from "../../assets/branding";

const Logo = ({
  variant = "full",
  className = "",
  themeOverride = null,
  ...props
}) => {
  const currentTheme = useSelector((state) => state.theme.mode);
  const resolvedTheme = themeOverride || currentTheme;

  const assetGroup =
    variant === "icon" || variant === "mark"
      ? vendorverseMark
      : vendorverseWordmark;

  const src = resolvedTheme === "dark" ? assetGroup.dark : assetGroup.light;

  return (
    <img
      src={src}
      alt="VendorVerse"
      className={`brand-image ${className}`.trim()}
      {...props}
    />
  );
};

export default Logo;