import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/**
 * Page d'accueil premium de GeneaIA (style Geneamap)
 */
const HomePage = () => {
  const { token } = useAuthStore();
  const isLoggedIn = !!token;

  return (
    <div className="geneamap-landing">
      {/* Polices Google Fonts importées localement */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        /* Variables et styles de base pour la landing page */
        .geneamap-landing {
          --bg: #fafaf9;
          --surface: #ffffff;
          --surface-2: #f5f5f4;
          --surface-hover: #f0efed;
          --border: rgba(0,0,0,0.07);
          --border-strong: rgba(0,0,0,0.14);
          --border-focus: #1c1c1c;
          --text: #1c1c1c;
          --text-2: #525252;
          --text-3: #8a8a8a;
          --text-on-accent: #fafaf9;
          --accent: #1c1c1c;
          --accent-soft: #e9e7e4;
          --positive: #2e7d4f;
          --warning: #b65a17;

          --shadow-1: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.04);
          --shadow-2: 0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
          --shadow-3: 0 24px 60px -20px rgba(0,0,0,0.25), 0 8px 24px -12px rgba(0,0,0,0.12);
          --shadow-card: 0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
          --shadow-card-hover: 0 8px 24px -8px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.08);

          --radius-sm: 6px;
          --radius: 10px;
          --radius-lg: 16px;
          --radius-card: 12px;

          /* Tones */
          --tone-stone-bg: #eeece8; --tone-stone-fg: #4a4641; --tone-stone-ring: #d2cdc4;
          --tone-rose-bg:  #f6e8e4; --tone-rose-fg:  #8a4f47; --tone-rose-ring:  #e4c7c0;
          --tone-ocean-bg: #e3ebf2; --tone-ocean-fg: #3a5a74; --tone-ocean-ring: #c7d6e3;
          --tone-sage-bg:  #e6ebe2; --tone-sage-fg:  #4d6243; --tone-sage-ring:  #c8d2c1;
          --tone-amber-bg: #f3ead7; --tone-amber-fg: #7c6326; --tone-amber-ring: #e1d2a8;
          --tone-plum-bg:  #ece5ed; --tone-plum-fg:  #5d4863; --tone-plum-ring:  #d6c7d8;

          --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', monospace;

          background: var(--bg);
          color: var(--text);
          font-family: var(--font-sans);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .geneamap-landing .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(250, 250, 249, 0.85);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
        }

        .geneamap-landing .nav-inner {
          max-width: 1180px;
          margin: 0 auto;
          height: 64px;
          padding: 0 28px;
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .geneamap-landing .brand-lg {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: -0.02em;
          color: var(--text);
        }

        .geneamap-landing .brand-lg .logo {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: var(--accent);
          position: relative;
        }

        .geneamap-landing .brand-lg .logo::after {
          content: "";
          position: absolute;
          inset: 5px;
          background:
            radial-gradient(circle at 50% 26%, var(--text-on-accent) 0 2px, transparent 2.5px),
            radial-gradient(circle at 30% 72%, var(--text-on-accent) 0 1.6px, transparent 2.2px),
            radial-gradient(circle at 70% 72%, var(--text-on-accent) 0 1.6px, transparent 2.2px),
            linear-gradient(to bottom, transparent 49.5%, var(--text-on-accent) 49.5%, var(--text-on-accent) 50.5%, transparent 50.5%);
          background-size: 100% 100%, 100% 100%, 100% 100%, 100% 50%;
          background-repeat: no-repeat;
          background-position: top, top, top, bottom;
        }

        .geneamap-landing .nav-links {
          display: flex;
          gap: 4px;
          flex: 1;
          margin-left: 20px;
        }

        .geneamap-landing .nav-links a {
          color: var(--text-2);
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          padding: 7px 12px;
          border-radius: 6px;
          transition: background 120ms ease;
        }

        .geneamap-landing .nav-links a:hover {
          background: var(--surface-2);
          color: var(--text);
        }

        .geneamap-landing .nav-right {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        /* Hero */
        .geneamap-landing .hero {
          max-width: 1180px;
          margin: 0 auto;
          padding: 80px 28px 60px;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 48px;
          align-items: center;
        }

        @media (max-width: 991px) {
          .geneamap-landing .hero {
            grid-template-columns: 1fr;
            padding: 40px 20px;
            gap: 40px;
          }
        }

        .geneamap-landing .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-2);
          background: var(--surface);
          border: 1px solid var(--border-strong);
          border-radius: 999px;
          padding: 5px 12px;
        }

        .geneamap-landing .eyebrow .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2e7d4f;
          box-shadow: 0 0 0 4px rgba(46,125,79,0.15);
        }

        .geneamap-landing .hero h1 {
          margin: 22px 0 16px;
          font-size: 56px;
          line-height: 1.05;
          letter-spacing: -0.03em;
          font-weight: 700;
          color: var(--text);
        }

        @media (max-width: 640px) {
          .geneamap-landing .hero h1 {
            font-size: 40px;
          }
        }

        .geneamap-landing .hero h1 em {
          font-family: 'Newsreader', serif;
          font-style: italic;
          font-weight: 400;
        }

        .geneamap-landing .hero .lede {
          font-size: 18px;
          line-height: 1.55;
          color: var(--text-2);
          max-width: 520px;
          letter-spacing: -0.005em;
        }

        .geneamap-landing .hero .cta-row {
          display: flex;
          gap: 12px;
          margin-top: 28px;
          align-items: center;
          flex-wrap: wrap;
        }

        .geneamap-landing .hero .trust {
          margin-top: 36px;
          font-size: 12px;
          color: var(--text-3);
          display: flex;
          gap: 18px;
          align-items: center;
        }

        .geneamap-landing .hero .trust .avas {
          display: flex;
        }

        .geneamap-landing .hero .trust .avas span {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid var(--bg);
          margin-left: -6px;
          display: grid;
          place-items: center;
          font-size: 9px;
          font-weight: 600;
        }

        .geneamap-landing .hero .trust .avas span:nth-child(1) { background: var(--tone-rose-bg); color: var(--tone-rose-fg); margin-left: 0; }
        .geneamap-landing .hero .trust .avas span:nth-child(2) { background: var(--tone-sage-bg); color: var(--tone-sage-fg); }
        .geneamap-landing .hero .trust .avas span:nth-child(3) { background: var(--tone-amber-bg); color: var(--tone-amber-fg); }
        .geneamap-landing .hero .trust .avas span:nth-child(4) { background: var(--tone-ocean-bg); color: var(--tone-ocean-fg); }
        .geneamap-landing .hero .trust .avas span:nth-child(5) { background: var(--surface); border: 1px solid var(--border-strong); color: var(--text-3); font-size: 9px; }

        /* Buttons */
        .geneamap-landing .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 32px;
          padding: 0 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-strong);
          background: var(--surface);
          color: var(--text);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: -0.005em;
          transition: background 120ms ease, border-color 120ms ease;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
        }

        .geneamap-landing .btn:hover {
          background: var(--surface-hover);
        }

        .geneamap-landing .btn.primary {
          background: var(--accent);
          color: var(--text-on-accent);
          border-color: var(--accent);
        }

        .geneamap-landing .btn.primary:hover {
          filter: brightness(1.15);
        }

        .geneamap-landing .btn.ghost {
          border-color: transparent;
          background: transparent;
        }

        .geneamap-landing .btn.ghost:hover {
          background: var(--surface-2);
        }

        .geneamap-landing .btn.sm {
          height: 26px;
          font-size: 12px;
          padding: 0 8px;
        }

        .geneamap-landing .btn.lg {
          height: 44px;
          font-size: 14.5px;
          padding: 0 18px;
          border-radius: var(--radius);
        }

        /* Hero illustration — mini tree */
        .geneamap-landing .hero-art {
          position: relative;
          aspect-ratio: 5 / 4.4;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow-3);
          overflow: hidden;
          background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0);
          background-size: 20px 20px;
        }

        .geneamap-landing .hero-art .frame-chrome {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 32px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          gap: 6px;
          border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(8px);
          z-index: 5;
        }

        .geneamap-landing .hero-art .frame-chrome .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--border-strong);
        }

        .geneamap-landing .hero-art .frame-chrome .url {
          margin-left: 12px;
          font-size: 11px;
          color: var(--text-3);
          font-family: var(--font-mono);
        }

        .geneamap-landing .hero-art .frame-chrome .url b {
          color: var(--text);
          font-weight: 500;
        }

        .geneamap-landing .hero-art .stage {
          position: absolute;
          top: 32px;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }

        /* Mini cards on the hero */
        .geneamap-landing .mini-card {
          position: absolute;
          width: 120px;
          background: var(--surface);
          border: 1px solid var(--border-strong);
          border-radius: 10px;
          box-shadow: var(--shadow-card);
          overflow: hidden;
          transition: transform 400ms ease, box-shadow 300ms ease;
        }

        .geneamap-landing .mini-card:hover {
          box-shadow: var(--shadow-card-hover);
        }

        .geneamap-landing .mini-card .ph {
          height: 80px;
          display: grid;
          place-items: center;
          background: var(--tone-bg);
          font-size: 22px;
          font-weight: 600;
          color: var(--tone-fg);
          position: relative;
        }

        .geneamap-landing .mini-card .ph::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4), transparent 55%);
          mix-blend-mode: overlay;
        }

        .geneamap-landing .mini-card .meta {
          padding: 7px 9px 8px;
        }

        .geneamap-landing .mini-card .meta .n {
          font-size: 11px;
          font-weight: 600;
        }

        .geneamap-landing .mini-card .meta .d {
          font-size: 9.5px;
          color: var(--text-3);
          font-variant-numeric: tabular-nums;
          margin-top: 1px;
        }

        /* Sections */
        .geneamap-landing .section {
          max-width: 1180px;
          margin: 0 auto;
          padding: 80px 28px;
        }

        @media (max-width: 640px) {
          .geneamap-landing .section {
            padding: 40px 20px;
          }
        }

        .geneamap-landing .section-head {
          text-align: center;
          margin-bottom: 56px;
        }

        .geneamap-landing .section-head .kicker {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text-3);
          text-transform: uppercase;
        }

        .geneamap-landing .section-head h2 {
          margin: 12px 0 14px;
          font-size: 40px;
          line-height: 1.12;
          letter-spacing: -0.025em;
          font-weight: 700;
        }

        .geneamap-landing .section-head h2 em {
          font-family: 'Newsreader', serif;
          font-style: italic;
          font-weight: 400;
        }

        .geneamap-landing .section-head .sub {
          color: var(--text-2);
          font-size: 16px;
          max-width: 560px;
          margin: 0 auto;
        }

        /* Feature grid */
        .geneamap-landing .feat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 991px) {
          .geneamap-landing .feat-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .geneamap-landing .feat-grid {
            grid-template-columns: 1fr;
          }
        }

        .geneamap-landing .feat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 240px;
        }

        .geneamap-landing .feat-card .head {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .geneamap-landing .feat-card .ic {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: var(--tone-bg);
          color: var(--tone-fg);
          display: grid;
          place-items: center;
        }

        .geneamap-landing .feat-card h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .geneamap-landing .feat-card p {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--text-2);
        }

        .geneamap-landing .feat-card .visual {
          flex: 1;
          min-height: 100px;
          margin-top: 6px;
          border-radius: 10px;
          background: var(--surface-2);
          position: relative;
          overflow: hidden;
        }

        /* Match section */
        .geneamap-landing .match-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }

        @media (max-width: 991px) {
          .geneamap-landing .match-row {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }

        .geneamap-landing .match-mock {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--shadow-2);
        }

        .geneamap-landing .match-mock .heading {
          font-size: 12px;
          color: var(--text-3);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .geneamap-landing .match-pill {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 10px;
          margin-bottom: 8px;
          background: var(--surface);
        }

        .geneamap-landing .match-pill .seal {
          width: 32px;
          height: 32px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          font-weight: 600;
          font-size: 12px;
        }

        .geneamap-landing .match-pill .info {
          flex: 1;
          min-width: 0;
        }

        .geneamap-landing .match-pill .info .tt {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .geneamap-landing .match-pill .info .ss {
          font-size: 11.5px;
          color: var(--text-3);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .geneamap-landing .match-pill .pct {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        /* Use-cases */
        .geneamap-landing .three-up {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .geneamap-landing .three-up {
            grid-template-columns: 1fr;
          }
        }

        .geneamap-landing .three-up .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 24px;
        }

        .geneamap-landing .three-up .card .num {
          font-family: 'Newsreader', serif;
          font-style: italic;
          font-size: 32px;
          font-weight: 500;
          color: var(--text-3);
        }

        .geneamap-landing .three-up .card h3 {
          margin: 8px 0;
          font-size: 16px;
          letter-spacing: -0.01em;
        }

        .geneamap-landing .three-up .card p {
          margin: 0;
          font-size: 13.5px;
          color: var(--text-2);
          line-height: 1.55;
        }

        /* Pricing */
        .geneamap-landing .price-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 991px) {
          .geneamap-landing .price-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        .geneamap-landing .price {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .geneamap-landing .price.featured {
          border: 1px solid var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }

        .geneamap-landing .price .tag {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-3);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .geneamap-landing .price .amt {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .geneamap-landing .price .amt .v {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.025em;
          font-variant-numeric: tabular-nums;
        }

        .geneamap-landing .price .amt .u {
          color: var(--text-3);
          font-size: 13px;
        }

        .geneamap-landing .price ul {
          padding: 0;
          margin: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 13px;
        }

        .geneamap-landing .price ul li {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .geneamap-landing .price ul li::before {
          content: "";
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent-soft);
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><path d='M2 5l2 2 4-4' stroke='%231c1c1c' fill='none' stroke-width='1.6' stroke-linecap='round'/></svg>");
          background-position: center;
          background-repeat: no-repeat;
          flex: 0 0 14px;
          margin-top: 2px;
        }

        /* Quote */
        .geneamap-landing .quote-wrap {
          max-width: 760px;
          margin: 0 auto;
          text-align: center;
          padding: 30px 0;
        }

        .geneamap-landing .quote-wrap .q {
          font-family: 'Newsreader', serif;
          font-style: italic;
          font-size: 28px;
          line-height: 1.4;
          color: var(--text);
          letter-spacing: -0.015em;
        }

        .geneamap-landing .quote-wrap .a {
          margin-top: 18px;
          font-size: 13px;
          color: var(--text-3);
        }

        .geneamap-landing .quote-wrap .a b {
          color: var(--text);
          font-weight: 600;
        }

        /* Footer */
        .geneamap-landing .footer {
          border-top: 1px solid var(--border);
          margin-top: 60px;
          padding: 48px 28px 32px;
          background: var(--surface);
        }

        .geneamap-landing .footer-inner {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 36px;
        }

        @media (max-width: 768px) {
          .geneamap-landing .footer-inner {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        .geneamap-landing .footer h4 {
          font-size: 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-3);
          margin: 0 0 12px;
          font-weight: 600;
        }

        .geneamap-landing .footer ul {
          padding: 0;
          margin: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .geneamap-landing .footer a {
          color: var(--text-2);
          text-decoration: none;
          font-size: 13px;
          transition: color 100ms;
        }

        .geneamap-landing .footer a:hover {
          color: var(--text);
        }

        .geneamap-landing .footer .legal {
          max-width: 1180px;
          margin: 32px auto 0;
          padding-top: 20px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-3);
          flex-wrap: wrap;
          gap: 10px;
        }

        /* Final CTA */
        .geneamap-landing .final-cta {
          max-width: 1180px;
          margin: 40px auto;
          padding: 56px 48px;
          background: var(--accent);
          color: var(--text-on-accent);
          border-radius: 18px;
          text-align: center;
        }

        @media (max-width: 640px) {
          .geneamap-landing .final-cta {
            padding: 36px 20px;
          }
        }

        .geneamap-landing .final-cta h2 {
          margin: 0 0 12px;
          font-size: 40px;
          letter-spacing: -0.025em;
          line-height: 1.1;
          font-weight: 700;
        }

        .geneamap-landing .final-cta h2 em {
          font-family: 'Newsreader', serif;
          font-style: italic;
          font-weight: 400;
        }

        .geneamap-landing .final-cta p {
          color: rgba(250,250,249,0.7);
          font-size: 15px;
          max-width: 480px;
          margin: 0 auto 24px;
        }

        .geneamap-landing .final-cta .btn.lg {
          background: var(--bg);
          color: var(--text);
          border-color: var(--bg);
        }

        .geneamap-landing .final-cta .btn.lg:hover {
          background: var(--surface);
        }

        /* Animated match line */
        .geneamap-landing .match-line {
          stroke-dasharray: 5 4;
          animation: dash 14s linear infinite;
        }

        @keyframes dash {
          to { stroke-dashoffset: -200; }
        }

        /* Chip types */
        .geneamap-landing .chip.private .dot { background: var(--text-3); }
        .geneamap-landing .chip.shared .dot { background: #d97757; }
        .geneamap-landing .chip.public .dot { background: #2e7d4f; }
      `}</style>

      {/* NAVIGATION BAR */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="brand-lg">
            <div className="logo" />
            GeneaIA
          </div>
          <div className="nav-links">
            <a href="#produit">Produit</a>
            <a href="#match">Correspondances</a>
            <a href="#cas">Cas d'usage</a>
            <a href="#prix">Tarifs</a>
          </div>
          <div className="nav-right">
            {isLoggedIn ? (
              <Link className="btn primary" to="/dashboard">
                Tableau de bord →
              </Link>
            ) : (
              <>
                <Link className="btn ghost sm" to="/login">
                  Connexion
                </Link>
                <Link className="btn primary" to="/register">
                  Essayer gratuitement →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div>
          <div className="eyebrow">
            <span className="dot" />
            Maintenant en bêta publique — gratuit
          </div>
          <h1>
            Cartographier <em>les liens</em>
            <br />
            qui vous précèdent.
          </h1>
          <p className="lede">
            GeneaIA est un canvas vivant pour vos arbres généalogiques. Glissez les cartes, dessinez les
            liens, retrouvez les cousins éloignés grâce au matching public.
          </p>
          <div className="cta-row">
            <Link className="btn primary lg" to={isLoggedIn ? "/dashboard" : "/register"}>
              {isLoggedIn ? "Ouvrir l'application →" : "Commencer gratuitement →"}
            </Link>
            <Link className="btn lg" to={isLoggedIn ? "/dashboard" : "/login"}>
              {isLoggedIn ? "Aller sur mon profil" : "Se connecter"}
            </Link>
          </div>
          <div className="trust">
            <div className="avas">
              <span>M</span>
              <span>S</span>
              <span>A</span>
              <span>N</span>
              <span>+9k</span>
            </div>
            <span>9 200 familles déjà cartographiées · Privé par défaut</span>
          </div>
        </div>

        {/* Hero Illustration: Interactive Mini Tree */}
        <div className="hero-art">
          <div className="frame-chrome">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="url">
              geneaia.app/<b>branche-henri-margot</b>
            </span>
          </div>

          <svg className="hero-svg" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: '32px 0 0 0', pointerEvents: 'none' }}>
            {/* spouse line */}
            <line x1="160" y1="100" x2="280" y2="100" stroke="#d97757" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="380" y1="100" x2="500" y2="100" stroke="#d97757" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* parent → child elbow */}
            <path d="M220 130 L220 175 L160 175 L160 220" stroke="rgba(28,28,28,0.32)" fill="none" strokeWidth="1.5" />
            <path d="M220 130 L220 175 L300 175 L300 220" stroke="rgba(28,28,28,0.32)" fill="none" strokeWidth="1.5" />
            <path d="M440 130 L440 175 L440 220" stroke="rgba(28,28,28,0.32)" fill="none" strokeWidth="1.5" />
            {/* gen 3 → 4 */}
            <path d="M230 270 L230 310 L200 310 L200 340" stroke="rgba(28,28,28,0.32)" fill="none" strokeWidth="1.5" />
            <path d="M230 270 L230 310 L260 310 L260 340" stroke="rgba(28,28,28,0.32)" fill="none" strokeWidth="1.5" />
          </svg>

          <div className="stage">
            {/* Gen 1 */}
            <div className="mini-card" style={{ left: '7%', top: '12%', ['--tone-bg']: 'var(--tone-stone-bg)', ['--tone-fg']: 'var(--tone-stone-fg)' } /* eslint-disable-line no-useless-computed-key */}>
              <div className="ph" style={{ backgroundColor: 'var(--tone-stone-bg)', color: 'var(--tone-stone-fg)' }}>H</div>
              <div className="meta">
                <div className="n">Henri</div>
                <div className="d">1928–2009 · Lyon</div>
              </div>
            </div>
            <div className="mini-card" style={{ left: '30%', top: '12%', ['--tone-bg']: 'var(--tone-rose-bg)', ['--tone-fg']: 'var(--tone-rose-fg)' }}>
              <div className="ph" style={{ backgroundColor: 'var(--tone-rose-bg)', color: 'var(--tone-rose-fg)' }}>M</div>
              <div className="meta">
                <div className="n">Margot</div>
                <div className="d">1931–2014</div>
              </div>
            </div>
            <div className="mini-card" style={{ left: '60%', top: '12%', ['--tone-bg']: 'var(--tone-ocean-bg)', ['--tone-fg']: 'var(--tone-ocean-fg)' }}>
              <div className="ph" style={{ backgroundColor: 'var(--tone-ocean-bg)', color: 'var(--tone-ocean-fg)' }}>A</div>
              <div className="meta">
                <div className="n">Auguste</div>
                <div className="d">1930–2017</div>
              </div>
            </div>
            <div className="mini-card" style={{ left: '82%', top: '12%', ['--tone-bg']: 'var(--tone-sage-bg)', ['--tone-fg']: 'var(--tone-sage-fg)' }}>
              <div className="ph" style={{ backgroundColor: 'var(--tone-sage-bg)', color: 'var(--tone-sage-fg)' }}>Y</div>
              <div className="meta">
                <div className="n">Yvonne</div>
                <div className="d">1934–2020</div>
              </div>
            </div>

            {/* Gen 2 */}
            <div className="mini-card" style={{ left: '7%', top: '52%', ['--tone-bg']: 'var(--tone-stone-bg)', ['--tone-fg']: 'var(--tone-stone-fg)' }}>
              <div className="ph" style={{ backgroundColor: 'var(--tone-stone-bg)', color: 'var(--tone-stone-fg)' }}>L</div>
              <div className="meta">
                <div className="n">Lucien</div>
                <div className="d">1958</div>
              </div>
            </div>
            <div className="mini-card" style={{ left: '30%', top: '52%', ['--tone-bg']: 'var(--tone-amber-bg)', ['--tone-fg']: 'var(--tone-amber-fg)' }}>
              <div className="ph" style={{ backgroundColor: 'var(--tone-amber-bg)', color: 'var(--tone-amber-fg)' }}>C</div>
              <div className="meta">
                <div className="n">Camille</div>
                <div className="d">1960</div>
              </div>
            </div>
            <div className="mini-card" style={{ left: '60%', top: '52%', ['--tone-bg']: 'var(--tone-ocean-bg)', ['--tone-fg']: 'var(--tone-ocean-fg)' }}>
              <div className="ph" style={{ backgroundColor: 'var(--tone-ocean-bg)', color: 'var(--tone-ocean-fg)' }}>T</div>
              <div className="meta">
                <div className="n">Théo</div>
                <div className="d">1957</div>
              </div>
            </div>

            {/* Gen 3 */}
            <div className="mini-card" style={{ left: '18%', top: '80%', ['--tone-bg']: 'var(--tone-plum-bg)', ['--tone-fg']: 'var(--tone-plum-fg)', transform: 'rotate(-1.5deg)' }}>
              <div className="ph" style={{ backgroundColor: 'var(--tone-plum-bg)', color: 'var(--tone-plum-fg)' }}>J</div>
              <div className="meta">
                <div className="n">Jules</div>
                <div className="d">1988</div>
              </div>
            </div>
            <div className="mini-card" style={{ left: '40%', top: '80%', ['--tone-bg']: 'var(--tone-rose-bg)', ['--tone-fg']: 'var(--tone-rose-fg)', transform: 'rotate(1deg)' }}>
              <div className="ph" style={{ backgroundColor: 'var(--tone-rose-bg)', color: 'var(--tone-rose-fg)' }}>S</div>
              <div className="meta">
                <div className="n">Sara</div>
                <div className="d">1989</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="section" id="produit">
        <div className="section-head">
          <div className="kicker">Ce que vous pouvez faire</div>
          <h2>
            Un canvas conçu pour <em>les vraies familles</em>
          </h2>
          <div className="sub">
            Glissez, reliez, fouillez. GeneaIA traite votre arbre comme un objet vivant, pas comme un formulaire à remplir.
          </div>
        </div>

        <div className="feat-grid">
          <div className="feat-card">
            <div className="head">
              <div className="ic" style={{ backgroundColor: 'var(--tone-amber-bg)', color: 'var(--tone-amber-fg)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4l5-3 5 3v6l-5 3-5-3V4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Canvas infini, drag &amp; drop</h3>
            </div>
            <p>Pan, zoom, glissez les cartes. Vos positions sont conservées. Les connexions se redessinent en temps réel.</p>
            <div className="visual" style={{ background: 'linear-gradient(135deg, #f4f0e8, #ece5d3)', display: 'grid', placeItems: 'center' }}>
              <svg width="120" height="80" viewBox="0 0 120 80">
                <rect x="10" y="14" width="32" height="22" rx="3" fill="#fff" stroke="#999" />
                <rect x="78" y="14" width="32" height="22" rx="3" fill="#fff" stroke="#999" />
                <rect x="44" y="44" width="32" height="22" rx="3" fill="#fff" stroke="#1c1c1c" strokeWidth="1.5" />
                <path d="M26 36 L26 50 L60 50 L60 44" stroke="#999" fill="none" />
                <path d="M94 36 L94 50 L60 50" stroke="#999" fill="none" />
              </svg>
            </div>
          </div>

          <div className="feat-card">
            <div className="head">
              <div className="ic" style={{ backgroundColor: 'var(--tone-rose-bg)', color: 'var(--tone-rose-fg)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 12s-5-3-5-7a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 4-5 7-5 7Z" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </div>
              <h3>Correspondances publiques</h3>
            </div>
            <p>Rendez votre arbre matchable. GeneaIA croise dates, lieux et noms pour suggérer des cousins éloignés — avec consentement réciproque.</p>
            <div className="visual" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--tone-ocean-bg)', color: 'var(--tone-ocean-fg)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: '13px' }}>A</div>
              <svg width="32" height="20">
                <path d="M2 10 L30 10" stroke="#d97757" strokeDasharray="4 3" className="match-line" strokeWidth="1.5" />
              </svg>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--tone-amber-bg)', color: 'var(--tone-amber-fg)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: '13px' }}>B</div>
            </div>
          </div>

          <div className="feat-card">
            <div className="head">
              <div className="ic" style={{ backgroundColor: 'var(--tone-sage-bg)', color: 'var(--tone-sage-fg)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M2 7v-2M2 7v2M5 7v-3M8 7v2M11 7v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Chronologie &amp; recherche</h3>
            </div>
            <p>Naviguez par génération, par année ou par lieu. Filtrez sur une branche pour faire surgir uniquement ce qui compte.</p>
            <div className="visual" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-3)' }}>1928</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: 'var(--tone-stone-fg)' }} />
                <span>Henri</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-3)' }}>1960</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: 'var(--tone-amber-fg)' }} />
                <span>Camille</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-3)' }}>1988</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: 'var(--tone-plum-fg)' }} />
                <span>Jules</span>
              </div>
            </div>
          </div>

          <div className="feat-card">
            <div className="head">
              <div className="ic" style={{ backgroundColor: 'var(--tone-plum-bg)', color: 'var(--tone-plum-fg)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2.5 12c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.3" fill="none" />
                </svg>
              </div>
              <h3>Cartes riches, photos vivantes</h3>
            </div>
            <p>Chaque personne a sa carte : photo/initiale, dates, lieux, biographie courte. Ouvrez le profil détaillé d'un clic.</p>
            <div className="visual" style={{ display: 'grid', placeItems: 'center' }}>
              <div className="mini-card" style={{ position: 'static', width: '110px' }}>
                <div className="ph" style={{ backgroundColor: 'var(--tone-rose-bg)', color: 'var(--tone-rose-fg)', height: '60px' }}>M</div>
                <div className="meta">
                  <div className="n">Margot</div>
                  <div className="d">1931–2014 · Lyon</div>
                </div>
              </div>
            </div>
          </div>

          <div className="feat-card">
            <div className="head">
              <div className="ic" style={{ backgroundColor: 'var(--tone-ocean-bg)', color: 'var(--tone-ocean-fg)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 11h10M4 11V4M7 11V2M10 11V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Plusieurs vues, une vérité</h3>
            </div>
            <p>Vertical, horizontal, chronologique. Choisissez la perspective qui raconte le mieux votre histoire.</p>
            <div className="visual" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '14px' }}>
              <svg width="38" height="38" viewBox="0 0 38 38">
                <rect x="14" y="3" width="10" height="6" fill="var(--text-3)" />
                <rect x="4" y="16" width="10" height="6" fill="var(--text-3)" />
                <rect x="24" y="16" width="10" height="6" fill="var(--text-3)" />
                <rect x="14" y="29" width="10" height="6" fill="var(--text-3)" />
                <path d="M19 9 L9 16 M19 9 L29 16 M19 22 L19 29" stroke="var(--text-3)" strokeWidth="0.8" />
              </svg>
              <svg width="38" height="38" viewBox="0 0 38 38">
                <circle cx="19" cy="19" r="3" fill="var(--text-3)" />
                <circle cx="19" cy="19" r="9" stroke="var(--text-3)" fill="none" strokeWidth="0.8" />
                <circle cx="19" cy="19" r="15" stroke="var(--text-3)" fill="none" strokeWidth="0.8" />
              </svg>
              <svg width="38" height="38" viewBox="0 0 38 38">
                <rect x="3" y="14" width="9" height="10" fill="var(--text-3)" />
                <rect x="14" y="14" width="9" height="10" fill="var(--text-3)" />
                <rect x="25" y="14" width="9" height="10" fill="var(--text-3)" />
                <path d="M12 19 L14 19 M23 19 L25 19" stroke="var(--text-3)" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          <div className="feat-card">
            <div className="head">
              <div className="ic" style={{ backgroundColor: 'var(--tone-stone-bg)', color: 'var(--tone-stone-fg)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M5 7l1.5 1.5L9 5.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Privé par défaut.</h3>
            </div>
            <p>Trois niveaux de visibilité : privé, partagé par invitation, public matchable. Vous gardez la main sur vos données.</p>
            <div className="visual" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
              <div className="chip private">
                <span className="dot" />
                Privé
              </div>
              <div className="chip shared">
                <span className="dot" />
                Partagé
              </div>
              <div className="chip public">
                <span className="dot" />
                Public &amp; matchable
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MATCH SECTION */}
      <section className="section" id="match" style={{ backgroundColor: 'var(--surface-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', maxWidth: 'none' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 28px' }}>
          <div className="match-row">
            <div>
              <div className="kicker">★ Fonctionnalité phare</div>
              <h2 style={{ fontSize: '38px', lineHeight: '1.1', letterSpacing: '-0.025em', margin: '12px 0 16px', fontWeight: 700 }}>
                Et si <em>votre cousin</em>
                <br />
                ne savait pas non plus qu'il existait ?
              </h2>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--text-2)', maxWidth: '480px' }}>
                Les grandes familles débordent vite des albums de famille. Avec un arbre public, GeneaIA repère les
                recoupements : un grand-père, un village, une date. Vous décidez ensuite si vous échangez.
              </p>
              <ul style={{ marginTop: '22px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                <li>👋 &nbsp; Notification quand un arbre croise plusieurs des vôtres</li>
                <li>🔍 &nbsp; Comparaison côte à côte avant tout échange</li>
                <li>🔒 &nbsp; Aucune donnée partagée tant que vous n'avez pas accepté</li>
              </ul>
            </div>

            <div className="match-mock">
              <div className="heading">3 correspondances trouvées</div>
              <div className="match-pill">
                <div className="seal" style={{ backgroundColor: 'var(--tone-sage-bg)', color: 'var(--tone-sage-fg)' }}>LB</div>
                <div className="info">
                  <div className="tt">Lignée Beaumont</div>
                  <div className="ss">C. Beaumont · Bordeaux · 3 personnes communes</div>
                </div>
                <div className="pct" style={{ color: 'var(--positive)' }}>86%</div>
              </div>
              <div className="match-pill">
                <div className="seal" style={{ backgroundColor: 'var(--tone-amber-bg)', color: 'var(--tone-amber-fg)' }}>ML</div>
                <div className="info">
                  <div className="tt">Maison Lorient</div>
                  <div className="ss">P. Le Goff · Bretagne · 2 personnes communes</div>
                </div>
                <div className="pct" style={{ color: '#9a7a1c' }}>71%</div>
              </div>
              <div className="match-pill">
                <div className="seal" style={{ backgroundColor: 'var(--tone-stone-bg)', color: 'var(--tone-stone-fg)' }}>BV</div>
                <div className="info">
                  <div className="tt">Branche Vidal</div>
                  <div className="ss">M. Vidal · Toulouse · 1 personne commune</div>
                </div>
                <div className="pct" style={{ color: 'var(--text-3)' }}>54%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="section" id="cas">
        <div className="section-head">
          <div className="kicker">Pour qui</div>
          <h2>Trois façons de l'utiliser</h2>
        </div>
        <div className="three-up">
          <div className="card">
            <div className="num">01</div>
            <h3>Les familles qui s'étendent</h3>
            <p>200, 500 ou 1000 personnes : invitez chaque branche à compléter sa partie de l'arbre. GeneaIA gère l'unification.</p>
          </div>
          <div className="card">
            <div className="num">02</div>
            <h3>Les chercheurs en herbe</h3>
            <p>Croisez registres et témoignages dans un canvas vivant — fini les fichiers GEDCOM illisibles ou les tableurs complexes.</p>
          </div>
          <div className="card">
            <div className="num">03</div>
            <h3>Les retrouvailles</h3>
            <p>Adoption, diaspora, longues séparations. Un arbre public permet aux histoires de se rejoindre au bon moment.</p>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="quote-wrap">
          <div className="q">
            « On a découvert qu'une cousine de Lille travaillait dans le même immeuble que ma sœur. Trois mois après, on dînait tous ensemble. »
          </div>
          <div className="a">
            <b>Marin C.</b> · Branche Atlantique · 67 personnes
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="prix">
        <div className="section-head">
          <div className="kicker">Tarifs</div>
          <h2>Gratuit pour commencer.</h2>
          <div className="sub">Pas de carte bancaire requise. Vos données vous appartiennent, exportables à tout moment.</div>
        </div>
        <div className="price-grid">
          <div className="price">
            <div className="tag">Solo</div>
            <div className="amt">
              <span className="v">0</span>
              <span className="u">€ / pour toujours</span>
            </div>
            <ul>
              <li>1 arbre, jusqu'à 30 personnes</li>
              <li>Vue canvas complète et interactive</li>
              <li>Partage en privé par invitation</li>
            </ul>
            <Link className="btn lg" to={isLoggedIn ? "/dashboard" : "/register"} style={{ marginTop: 'auto' }}>
              Commencer
            </Link>
          </div>
          <div className="price featured">
            <div className="tag" style={{ color: 'var(--accent)' }}>★ Famille</div>
            <div className="amt">
              <span className="v">5</span>
              <span className="u">€ / mois — facturé annuellement</span>
            </div>
            <ul>
              <li>Arbres illimités, jusqu'à 1000 personnes</li>
              <li>Correspondances publiques activées</li>
              <li>Invitations co-éditeur illimitées</li>
              <li>Export GEDCOM &amp; PDF</li>
            </ul>
            <Link className="btn primary lg" to={isLoggedIn ? "/dashboard" : "/register"} style={{ marginTop: 'auto' }}>
              Essayer 14 jours
            </Link>
          </div>
          <div className="price">
            <div className="tag">Patrimoine</div>
            <div className="amt">
              <span className="v">12</span>
              <span className="u">€ / mois</span>
            </div>
            <ul>
              <li>Personnes illimitées</li>
              <li>Importations multi-formats (Heredis, etc.)</li>
              <li>Historique et versioning complet</li>
              <li>Support prioritaire</li>
            </ul>
            <Link className="btn lg" to={isLoggedIn ? "/dashboard" : "/register"} style={{ marginTop: 'auto' }}>
              Choisir
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <div className="final-cta">
        <h2>Et si vous commenciez par <em>une seule branche</em> ?</h2>
        <p>Un arbre prend cinq minutes à amorcer. GeneaIA garde la suite vivante pour vous.</p>
        <Link className="btn lg" to={isLoggedIn ? "/dashboard" : "/register"}>
          Ouvrir l'application →
        </Link>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="brand-lg">
              <div className="logo" />
              GeneaIA
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '12px 0 0', maxWidth: '320px' }}>
              Plateforme web de cartographie généalogique. Conçue à Paris, hébergée en France, vos données vous appartiennent.
            </p>
          </div>
          <div>
            <h4>Produit</h4>
            <ul>
              <li>
                <Link to={isLoggedIn ? "/dashboard" : "/register"}>Application</Link>
              </li>
              <li>
                <a href="#prix">Tarifs</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Ressources</h4>
            <ul>
              <li>
                <a href="#produit">Guide de démarrage</a>
              </li>
              <li>
                <a href="#match">Aide</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Société</h4>
            <ul>
              <li>
                <a href="#produit">À propos</a>
              </li>
              <li>
                <a href="#produit">Confidentialité</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <div>© 2026 GeneaIA SAS — Paris, France</div>
          <div>v1.0 · Bêta publique</div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;