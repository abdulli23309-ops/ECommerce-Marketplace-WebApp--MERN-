import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-column footer-branding">
          {/* Removed forceTheme="dark" so it uses the clean/transparent asset */}
          <BrandLogo
            variant="combine"
            className="footer-logo"
            maxWidth="240px"
          />
          <p>VendorVerse connects customers with trusted independent sellers through a secure marketplace built for modern shopping.</p>
        </div>
        {/* Rest of your footer links... */}
      </div>
    </footer>
  );
};

export default Footer;