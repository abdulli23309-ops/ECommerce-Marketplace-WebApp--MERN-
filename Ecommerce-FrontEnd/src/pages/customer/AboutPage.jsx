import { Link } from "react-router-dom";
import BrandLogo from "../../components/common/BrandLogo";

const faqs = [
  {
    question: "What is VendorVerse?",
    answer: "VendorVerse is a modern multi-vendor marketplace connecting customers with trusted independent sellers through one secure platform.",
  },
  {
    question: "Can I sell my products on VendorVerse?",
    answer: "Yes, independent sellers can register, create a store, and list products in minutes using our seller dashboard.",
  },
  {
    question: "How does VendorVerse protect my payment information?",
    answer: "VendorVerse uses secure payment processing and encrypted checkout flows to protect customer data at every step.",
  },
  {
    question: "What if I need help after I place an order?",
    answer: "Our customer support team is available to help with returns, shipping, and product questions.",
  },
];

const AboutPage = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <div className="hero-badge"><BrandLogo variant="wordmark" className="hero-wordmark" /></div>
          <h1>About VendorVerse</h1>
          <p>VendorVerse is a modern multi-vendor marketplace where customers can discover trusted sellers and quality products in one polished shopping experience.</p>
          <div className="hero-actions">
            <Link to="/products" className="btn-primary">Start Shopping</Link>
            <Link to="/seller/register" className="btn-secondary">Become a Seller</Link>
          </div>
        </div>
        <div className="about-hero-visual">
          <div className="hero-card">
            <h2>Trusted sellers. Quality products.</h2>
            <p>VendorVerse brings together independent sellers and shoppers with a clean, secure marketplace designed for discovery.</p>
          </div>
        </div>
      </section>

      <section className="about-section about-story">
        <div className="section-header">
          <p className="eyebrow">Our Story</p>
          <h2>Connecting customers and sellers through one secure platform.</h2>
        </div>
        <p>VendorVerse was created to give sellers a reliable place to grow their businesses while helping customers find authentic products from independent merchants. Our vision is a marketplace where everyone can shop confidently, discover value, and enjoy seamless service.</p>
      </section>

      <section className="about-section mission-section">
        <div className="section-header">
          <p className="eyebrow">Our Mission</p>
          <h2>Building a modern marketplace founded on quality, trust, and speed.</h2>
        </div>
        <div className="mission-grid">
          {[
            { title: "Quality", copy: "Curated products from verified sellers ensure you can shop with confidence." },
            { title: "Trust", copy: "Transparent seller ratings and customer reviews create a safe buying experience." },
            { title: "Secure Shopping", copy: "Secure checkout and protected account flows keep your data safe." },
            { title: "Fast Delivery", copy: "Reliable order processing keeps your purchases moving from checkout to doorstep." },
          ].map((item) => (
            <div key={item.title} className="info-card">
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section why-choose">
        <div className="section-header">
          <p className="eyebrow">Why Choose VendorVerse</p>
          <h2>Everything you need for a confident online shopping experience.</h2>
        </div>
        <div className="feature-grid">
          {[
            { title: "Verified Sellers", icon: "✔" },
            { title: "Secure Payments", icon: "🔒" },
            { title: "Easy Returns", icon: "↩" },
            { title: "Fast Shipping", icon: "🚚" },
            { title: "Product Reviews", icon: "⭐" },
            { title: "Customer Support", icon: "💬" },
          ].map((item) => (
            <div key={item.title} className="feature-card">
              <span className="feature-icon">{item.icon}</span>
              <h3>{item.title}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section stats-section">
        <div className="stats-grid">
          {[
            { value: "5,000+", label: "Products" },
            { value: "1,000+", label: "Sellers" },
            { value: "20,000+", label: "Customers" },
            { value: "50+", label: "Cities" },
          ].map((stat) => (
            <div key={stat.label} className="stat-pill">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section process-section">
        <div className="section-header">
          <p className="eyebrow">How VendorVerse Works</p>
        </div>
        <div className="process-steps">
          {[
            "Customer",
            "Browse Products",
            "Checkout",
            "Fast Delivery",
          ].map((step, index) => (
            <div key={step} className="process-step">
              <div className="step-index">{index + 1}</div>
              <p>{step}</p>
              {index < 3 && <span className="step-arrow">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="about-section platform-section">
        <div className="section-header">
          <p className="eyebrow">Meet Our Platform</p>
          <h2>Built for growth with proven technology.</h2>
        </div>
        <p>VendorVerse uses a modern web stack to power a fast, scalable marketplace experience. Our platform combines React, Express.js, MongoDB, and Node.js for secure shopping and smooth seller operations.</p>
        <div className="tech-grid">
          {[
            "React",
            "Express.js",
            "MongoDB",
            "Node.js",
          ].map((tech) => (
            <div key={tech} className="tech-pill">{tech}</div>
          ))}
        </div>
      </section>

      <section className="about-section faq-section">
        <div className="section-header">
          <p className="eyebrow">FAQ</p>
          <h2>Frequently asked questions</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question} className="faq-item">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <div>
          <h2>Ready to experience VendorVerse?</h2>
          <p>Join customers and sellers who are building better shopping connections every day.</p>
        </div>
        <div className="cta-actions">
          <Link to="/products" className="btn-primary">Start Shopping</Link>
          <Link to="/seller/register" className="btn-secondary">Become a Seller</Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
