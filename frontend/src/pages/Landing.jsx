import { Link } from "react-router-dom";

const features = [
  { title: "Finance Tracking", desc: "See balance, income, and monthly trends in one place." },
  { title: "Expense Intelligence", desc: "Category breakdowns and month-over-month spending changes." },
  { title: "Stock Market Data", desc: "Search symbols, view quotes, history, and fundamentals." },
  { title: "Portfolio Management", desc: "Holdings, allocation, and profit/loss calculated for you." },
  { title: "Performance Comparison", desc: "Compare holdings and periods side by side." },
  { title: "AI Financial Assistant", desc: "Optional AI-generated summaries of your own data." },
];

const steps = [
  { title: "Create an account", desc: "Sign up in under a minute." },
  { title: "Add your data", desc: "Log income, expenses, and simulated investments." },
  { title: "Track the market", desc: "Search stocks and build a watchlist." },
  { title: "Review insights", desc: "See portfolio and spending analytics update automatically." },
];

export default function Landing() {
  return (
    <div>
      <nav className="landing-nav">
        <div className="flex items-center gap-2">
          <div className="sidebar-brand-mark">L</div>
          <span className="sidebar-brand-name">Ledger</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#analytics">Analytics</a>
          <Link to="/login">Log in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">
            Get started
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <h1>Understand your money. Track your investments.</h1>
        <p>
          Ledger brings your income, expenses, budgets, and simulated investment portfolio into one
          clear, calm view - with market data and optional AI summaries layered on top.
        </p>
        <div className="flex items-center justify-between" style={{ justifyContent: "center", gap: 12 }}>
          <Link to="/signup" className="btn btn-primary">
            Get started free
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Log in
          </Link>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="landing-section-heading">
          <h2>Everything in one dashboard</h2>
          <p>Finance, expenses, markets, and portfolio analytics - without the clutter.</p>
        </div>
        <div className="grid grid-3">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="icon">$</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="how-it-works">
        <div className="landing-section-heading">
          <h2>How it works</h2>
          <p>Four steps from signup to insight.</p>
        </div>
        <div className="steps-row">
          {steps.map((s, i) => (
            <div className="step-item" key={s.title}>
              <div className="step-number">{i + 1}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="analytics">
        <div className="landing-cta">
          <h2>Start tracking in minutes</h2>
          <p>Free to use. No credit card required. Stock purchases run in Razorpay test mode only.</p>
          <Link to="/signup" className="btn btn-primary">
            Create your account
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>Ledger</span>
        <span>Personal finance and simulated investment tracking</span>
      </footer>
    </div>
  );
}
