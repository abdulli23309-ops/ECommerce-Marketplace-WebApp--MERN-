import { vendorverseMark, vendorverseWordmark } from "../../assets/branding";

const BrandLogo = ({ variant = "wordmark", className = "", ...props }) => {
  const src = variant === "mark" ? vendorverseMark : vendorverseWordmark;

  return (
    <img
      src={src}
      alt="VendorVerse"
      className={`brand-image ${className}`.trim()}
      {...props}
    />
  );
};

export default BrandLogo;
