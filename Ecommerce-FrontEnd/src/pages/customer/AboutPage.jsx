import { Link } from "react-router-dom";
import BrandLogo from "../../components/common/BrandLogo";

const faqs = [
  {
    question: "What is VendorVerse?",
    answer: "VendorVerse is a next-generation multi-vendor marketplace connecting discerning customers with elite independent merchants through a secure, high-performance platform.",
  },
  {
    question: "How do I become a verified seller?",
    answer: "Simply click 'Become a Seller', complete your store profile in minutes using our intuitive onboarding wizard, and submit your products for review.",
  },
  {
    question: "Is my payment and personal data secure?",
    answer: "Yes. We employ bank-grade encryption, secure tokenized payment gateways, and strict privacy protocols to safeguard every transaction.",
  },
  {
    question: "What support is available after placing an order?",
    answer: "Our dedicated concierge and customer support team operate around the clock to assist with tracking, returns, and product inquiries.",
  },
];

const AboutPage = () => {
  return (
    <div className="about-page-modern" style={{ overflowX: "hidden" }}>
      {/* Hero Section */}
      <section className="about-hero-elite" style={{ padding: "80px 5%", display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "40px", alignItems: "center" }}>
        <div className="about-hero-copy">
          <div className="hero-badge-wrapper" style={{ marginBottom: "20px" }}>
            <BrandLogo variant="combine" className="hero-wordmark" maxWidth="260px" />
          </div>
          <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", fontWeight: "700", opacity: "0.7" }}>
            The Future of E-Commerce
          </span>
          <h1 style={{ fontSize: "3rem", fontWeight: "800", lineHeight: "1.2", margin: "15px 0 20px" }}>
            Architecting Trust in Every Transaction.
          </h1>
          <p style={{ fontSize: "1.1rem", lineHeight: "1.6", opacity: "0.85", marginBottom: "30px" }}>
            VendorVerse bridges the gap between ambitious independent creators and modern shoppers, delivering a seamless, secure, and luxurious marketplace experience.
          </p>
          <div className="hero-actions" style={{ display: "flex", gap: "16px" }}>
            <Link to="/products" className="btn-primary" style={{ padding: "12px 28px", borderRadius: "8px", fontWeight: "600", textDecoration: "none" }}>Start Shopping</Link>
            <Link to="/seller/register" className="btn-secondary" style={{ padding: "12px 28px", borderRadius: "8px", fontWeight: "600", textDecoration: "none", border: "1px solid currentColor" }}>Become a Seller</Link>
          </div>
        </div>
        <div className="about-hero-visual" style={{ position: "relative" }}>
          <div className="hero-glass-card" style={{ padding: "40px", borderRadius: "20px", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", background: "var(--card-bg, rgba(var(--foreground-rgb), 0.03))", boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "15px" }}>✨</span>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "12px" }}>Curated Excellence</h3>
            <p style={{ lineHeight: "1.6", opacity: "0.8" }}>
              Every vendor on VendorVerse is hand-vetted to ensure top-tier craftsmanship, authentic quality, and prompt fulfillment.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Ribbon */}
      <section className="stats-ribbon" style={{ padding: "40px 5%", borderTop: "1px solid rgba(128,128,128,0.2)", borderBottom: "1px solid rgba(128,128,128,0.2)", background: "rgba(128,128,128,0.02)" }}>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "30px", textAlign: "center" }}>
          {[
            { value: "5,000+", label: "Verified Products" },
            { value: "1,000+", label: "Independent Sellers" },
            { value: "20,000+", label: "Happy Shoppers" },
            { value: "99.8%", label: "Satisfaction Rate" },
          ].map((stat) => (
            <div key={stat.label} className="stat-item">
              <strong style={{ fontSize: "2.2rem", fontWeight: "800", display: "block", color: "var(--primary-color)" }}>{stat.value}</strong>
              <span style={{ fontSize: "0.95rem", opacity: "0.7", fontWeight: "500" }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story Section */}
      <section className="about-section about-story" style={{ padding: "90px 5%", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <p className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", fontWeight: "700", color: "var(--primary-color)", marginBottom: "10px" }}>Our Origin Story</p>
        <h2 style={{ fontSize: "2.4rem", fontWeight: "800", lineHeight: "1.3", marginBottom: "25px" }}>Empowering independent commerce through flawless technology.</h2>
        <p style={{ fontSize: "1.1rem", lineHeight: "1.8", opacity: "0.85" }}>
          VendorVerse was born out of a simple conviction: shopping online should feel personal again. We designed a pristine ecosystem where high-quality independent businesses get the spotlight they deserve, and customers enjoy uncompromising security, transparency, and speed.
        </p>
      </section>

      {/* Mission & Core Pillars */}
      <section className="about-section mission-section" style={{ padding: "80px 5%", background: "rgba(128,128,128,0.015)" }}>
        <div className="section-header" style={{ textAlign: "center", marginBottom: "50px" }}>
          <p className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", fontWeight: "700", color: "var(--primary-color)", marginBottom: "8px" }}>Core Principles</p>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "800" }}>Built on trust, quality, and lightning speed.</h2>
        </div>
        <div className="mission-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "25px" }}>
          {[
            { title: "Uncompromising Quality", copy: "Rigorous standards for every item listed by our verified merchant network." },
            { title: "Absolute Trust", copy: "Verified customer reviews and transparent vendor ratings ensure zero guesswork." },
            { title: "Secure Checkout", copy: "State-of-the-art encryption protocols protecting your financial and personal data." },
            { title: "Swift Fulfillment", copy: "Optimized logistics pipeline moving items from checkout to doorstep rapidly." },
          ].map((item) => (
            <div key={item.title} className="info-card" style={{ padding: "30px", borderRadius: "16px", border: "1px solid rgba(128,128,128,0.15)", background: "var(--card-bg)" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "12px" }}>{item.title}</h3>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", opacity: "0.8" }}>{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose VendorVerse */}
      <section className="about-section why-choose" style={{ padding: "90px 5%" }}>
        <div className="section-header" style={{ textAlign: "center", marginBottom: "50px" }}>
          <p className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", fontWeight: "700", color: "var(--primary-color)", marginBottom: "8px" }}>Why Choose Us</p>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "800" }}>Designed for a superior shopping journey.</h2>
        </div>
        <div className="feature-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {[
            { title: "Verified Elite Sellers", icon: "🛡️", desc: "Hand-picked merchants with proven track records." },
            { title: "Encrypted Payments", icon: "⚡", desc: "Lightning fast checkouts protected by advanced security." },
            { title: "Hassle-Free Returns", icon: "🔄", desc: "Customer-first policies ensuring absolute peace of mind." },
            { title: "Expedited Shipping", icon: "📦", desc: "Real-time tracking from warehouse to front door." },
            { title: "Authentic Reviews", icon: "⭐", desc: "Real feedback from genuine verified buyers." },
            { title: "24/7 Concierge Support", icon: "💬", desc: "Dedicated assistance whenever you need help." },
          ].map((item) => (
            <div key={item.title} className="feature-card" style={{ display: "flex", alignItems: "center", gap: "20px", padding: "24px", borderRadius: "14px", border: "1px solid rgba(128,128,128,0.15)" }}>
              <span style={{ fontSize: "2rem" }}>{item.icon}</span>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "4px" }}>{item.title}</h3>
                <p style={{ fontSize: "0.85rem", opacity: "0.75" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="about-section platform-section" style={{ padding: "80px 5%", background: "rgba(128,128,128,0.015)", textAlign: "center" }}>
        <div className="section-header" style={{ marginBottom: "30px" }}>
          <p className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", fontWeight: "700", color: "var(--primary-color)", marginBottom: "8px" }}>World-Class Architecture</p>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "800" }}>Powered by modern, robust technology.</h2>
        </div>
        <p style={{ maxWidth: "700px", margin: "0 auto 40px", fontSize: "1rem", lineHeight: "1.7", opacity: "0.85" }}>
          Our platform relies on a lightning-fast modern web stack, combining React, Node.js, Express, and MongoDB to guarantee zero latency and flawless scalability.
        </p>
        <div className="tech-grid" style={{ display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap" }}>
          {["React.js", "Node.js", "Express.js", "MongoDB", "Redux Toolkit", "REST APIs"].map((tech) => (
            <div key={tech} className="tech-pill" style={{ padding: "10px 24px", borderRadius: "30px", border: "1px solid rgba(128,128,128,0.2)", fontWeight: "600", fontSize: "0.9rem" }}>
              {tech}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="about-section faq-section" style={{ padding: "90px 5%", maxWidth: "800px", margin: "0 auto" }}>
        <div className="section-header" style={{ textAlign: "center", marginBottom: "40px" }}>
          <p className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", fontWeight: "700", color: "var(--primary-color)", marginBottom: "8px" }}>FAQ</p>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "800" }}>Frequently Asked Questions</h2>
        </div>
        <div className="faq-list" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {faqs.map((faq) => (
            <details key={faq.question} className="faq-item" style={{ padding: "20px", borderRadius: "12px", border: "1px solid rgba(128,128,128,0.2)", background: "var(--card-bg)" }}>
              <summary style={{ fontWeight: "700", cursor: "pointer", fontSize: "1.05rem" }}>{faq.question}</summary>
              <p style={{ marginTop: "12px", opacity: "0.85", lineHeight: "1.6", fontSize: "0.95rem" }}>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="about-cta" style={{ margin: "60px 5% 90px", padding: "60px 40px", borderRadius: "24px", background: "linear-gradient(135deg, var(--primary-color, #111), #222)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "30px" }}>
        <div>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "800", marginBottom: "10px" }}>Ready to experience VendorVerse?</h2>
          <p style={{ opacity: "0.85", fontSize: "1.05rem" }}>Join thousands of satisfied shoppers and thriving sellers today.</p>
        </div>
        <div className="cta-actions" style={{ display: "flex", gap: "15px" }}>
          <Link to="/products" className="btn-primary" style={{ padding: "12px 28px", borderRadius: "8px", fontWeight: "600", textDecoration: "none", background: "#fff", color: "#000" }}>Start Shopping</Link>
          <Link to="/seller/register" className="btn-secondary" style={{ padding: "12px 28px", borderRadius: "8px", fontWeight: "600", textDecoration: "none", border: "1px solid #fff", color: "#fff" }}>Become a Seller</Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;