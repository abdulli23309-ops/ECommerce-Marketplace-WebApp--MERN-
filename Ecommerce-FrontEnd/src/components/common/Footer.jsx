import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-column footer-branding">
          <BrandLogo variant="wordmark" className="footer-logo" />
          <p>VendorVerse connects customers with trusted independent sellers through a secure marketplace built for modern shopping.</p>
        </div>

        <div className="footer-column">
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <a href="#">Careers</a>
          <a href="#">Contact</a>
          <a href="#">Blog</a>
        </div>

        <div className="footer-column">
          <h4>Customer Service</h4>
          <a href="#">Help Center</a>
          <a href="#">Shipping</a>
          <a href="#">Returns</a>
          <a href="#">FAQs</a>
        </div>

        <div className="footer-column">
          <h4>Sellers</h4>
          <Link to="/seller/register">Become a Seller</Link>
          <Link to="/seller/dashboard">Seller Dashboard</Link>
          <a href="#">Seller Guidelines</a>
        </div>

        <div className="footer-column">
          <h4>Legal</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms & Conditions</a>
          <a href="#">Cookies Policy</a>
        </div>

        <div className="footer-column footer-contact">
          <h4>Contact</h4>
          <a href="mailto:support@vendorverse.com">support@vendorverse.com</a>
          <a href="tel:+1234567890">+1 (234) 567-890</a>
          <p>123 Vendor Street, Commerce City, USA</p>
          <div className="footer-social">
            <a href="#" aria-label="Facebook">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54v-2.89h2.54V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.63.773-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm8 2.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-5 1A5 5 0 1110 17a5 5 0 01-1-9.5z"/></svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5A2.48 2.48 0 002.5 6v12A2.48 2.48 0 004.98 20.5h14.04A2.48 2.48 0 0021.5 18V6a2.48 2.48 0 00-2.48-2.5H4.98zM8.34 18H5.67V9.75h2.67V18zm-1.34-9.72a1.55 1.55 0 110-3.1 1.55 1.55 0 010 3.1zm11.66 9.72h-2.67v-4.5c0-1.08-.39-1.8-1.36-1.8-.74 0-1.18.5-1.37.98-.07.18-.09.43-.09.68v4.64H11.3s.04-7.53 0-8.31h2.66v1.18c.35-.55.98-1.33 2.38-1.33 1.74 0 3.05 1.14 3.05 3.6V18z"/></svg>
            </a>
            <a href="#" aria-label="Twitter">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 5.92c-.8.35-1.66.59-2.57.7a4.46 4.46 0 001.96-2.47 8.88 8.88 0 01-2.82 1.08 4.44 4.44 0 00-7.57 4.05A12.61 12.61 0 013 4.81a4.44 4.44 0 001.37 5.92 4.4 4.4 0 01-2.01-.55v.06a4.44 4.44 0 003.56 4.35 4.44 4.44 0 01-2 .08 4.44 4.44 0 004.15 3.08A8.9 8.9 0 012 19.54a12.54 12.54 0 006.8 1.99c8.16 0 12.62-6.76 12.62-12.62 0-.19 0-.39-.01-.58A9.05 9.05 0 0022 5.92z"/></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-newsletter">
        <h4>Subscribe to our newsletter</h4>
        <form onSubmit={(e) => e.preventDefault()} className="newsletter-form">
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input id="newsletter-email" type="email" placeholder="Enter your email" />
          <button type="submit" className="btn-primary">Subscribe</button>
        </form>
      </div>

      <div className="footer-bottom">
        <p>© 2026 VendorVerse. All rights reserved.</p>
        <p>Built with React + Express + MongoDB.</p>
      </div>
    </footer>
  );
};

export default Footer;
