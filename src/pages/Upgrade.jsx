import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Upgrade.css';

function Upgrade() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  
  const [isDark, setIsDark] = useState(() => {
    const theme = localStorage.getItem('theme');
    if (theme) return theme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const plans = [
    {
      name: 'Starter',
      price: 0,
      description: 'Perfect for testing out AeroDrive capabilities',
      features: [
        '5 GB secure cloud storage',
        'Standard Personal Vault (max 3 files)',
        'Basic sharing controls',
        'Standard upload speeds',
        'Web & Mobile access'
      ],
      ctaText: 'Current Plan',
      isCurrent: true,
      popular: false
    },
    {
      name: 'Pro',
      price: billingCycle === 'monthly' ? 9.99 : 7.99,
      description: 'Our most popular plan for individuals & power users',
      features: [
        '2 TB high-speed cloud storage',
        'Unlimited Personal Vault protection',
        'Advanced security & Link passwords',
        'Priority file syncing & 10Gbps uploads',
        '30-day file recovery history',
        'Priority email support'
      ],
      ctaText: 'Upgrade to Pro',
      isCurrent: false,
      popular: true
    },
    {
      name: 'Business Max',
      price: billingCycle === 'monthly' ? 19.99 : 15.99,
      description: 'Advanced workspace security for teams & professionals',
      features: [
        '10 TB cloud storage per user',
        'Zero-knowledge encryption & AES-256',
        'Full team access management',
        'Custom sharing branding & subdomains',
        '180-day file recovery history',
        '24/7 VIP Phone & chat support'
      ],
      ctaText: 'Contact Sales',
      isCurrent: false,
      popular: false
    }
  ];

  return (
    <div className="upgrade-root">
      {/* Background decoration */}
      <div className="decor-orb orb-1"></div>
      <div className="decor-orb orb-2"></div>

      <header className="upgrade-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Dashboard
        </button>

        <button 
          className="theme-toggle-btn" 
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </header>

      <main className="upgrade-content">
        <section className="upgrade-hero">
          <span className="badge">UPGRADE YOUR SPACE</span>
          <h1 className="hero-title">Choose the perfect plan</h1>
          <p className="hero-subtitle">Get more room to store, create, and safeguard your digital assets with advanced security.</p>
          
          <div className="billing-cycle-selector">
            <button 
              className={`cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Billed Monthly
            </button>
            <button 
              className={`cycle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('yearly')}
            >
              Billed Annually
              <span className="save-tag">Save 20%</span>
            </button>
          </div>
        </section>

        <section className="plans-grid">
          {plans.map((plan, idx) => (
            <div key={idx} className={`plan-card ${plan.popular ? 'popular' : ''} ${plan.isCurrent ? 'current' : ''}`}>
              {plan.popular && <span className="popular-badge">RECOMMENDED</span>}
              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-desc">{plan.description}</p>
                <div className="plan-price">
                  <span className="currency">$</span>
                  <span className="amount">{plan.price.toFixed(2)}</span>
                  <span className="period">/mo</span>
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <p className="billing-note">Billed annually (${(plan.price * 12).toFixed(2)}/yr)</p>
                )}
              </div>

              <div className="plan-divider"></div>

              <ul className="plan-features">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="feature-item">
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`plan-cta ${plan.popular ? 'cta-gradient' : 'cta-outline'} ${plan.isCurrent ? 'disabled' : ''}`}
                disabled={plan.isCurrent}
                onClick={() => {
                  if (!plan.isCurrent) {
                    alert(`Purchase flow initiated for AeroDrive ${plan.name} (${billingCycle})!`);
                  }
                }}
              >
                {plan.ctaText}
              </button>
            </div>
          ))}
        </section>

        <section className="upgrade-faq">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-card">
              <h4>Can I cancel my subscription anytime?</h4>
              <p>Yes, absolutely. You can cancel your plan in your settings page whenever you want. You will continue to have access to your premium features until the end of your billing cycle.</p>
            </div>
            <div className="faq-card">
              <h4>What is the Personal Vault?</h4>
              <p>Personal Vault is a secured directory within AeroDrive requiring two-step verification (PIN, biometrics, or authentication codes) to unlock. Perfect for sensitive documents.</p>
            </div>
            <div className="faq-card">
              <h4>What happens to my files if I downgrade?</h4>
              <p>If you downgrade, your files remain safe, but you cannot upload new files if you exceed the new storage limits. You'll need to clean up space or upgrade again.</p>
            </div>
            <div className="faq-card">
              <h4>Are my files encrypted?</h4>
              <p>Yes, all files stored on AeroDrive are encrypted in transit and at rest. Business Max users get full zero-knowledge local client-side encryption.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Upgrade;
