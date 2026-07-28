import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import './styles/scroll-animations.css';

/* ── Global Scroll-Reveal Observer ── */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          const accent = entry.target.querySelector('.section-title-accent');
          if (accent) accent.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px 50px 0px' }
  );

  const observeElements = () => {
    document
      .querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
      .forEach((el) => {
        if (!el.classList.contains('is-visible')) {
          observer.observe(el);
        }
      });
  };

  // Run on initial load
  observeElements();

  // Watch for dynamic React DOM mutations
  const mutationObserver = new MutationObserver(() => {
    observeElements();
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  // Re-run on route changes
  const origPush = history.pushState.bind(history);
  history.pushState = (...args) => { origPush(...args); setTimeout(observeElements, 50); };
  window.addEventListener('popstate', () => setTimeout(observeElements, 50));
}

/* ── Custom Cursor (desktop only) ── */
function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return; // skip touch devices

  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = -100, my = -100, rx = -100, ry = -100;
  let isMoving = false;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!isMoving) {
      isMoving = true;
      requestAnimationFrame(animCursor);
    }
  }, { passive: true });

  function animCursor() {
    dot.style.transform = `translate3d(${mx - 4}px, ${my - 4}px, 0)`;
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    ring.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0)`;
    
    if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) {
      requestAnimationFrame(animCursor);
    } else {
      isMoving = false;
    }
  }

  // Expand on interactive elements
  const expand = () => ring.classList.add('hover-expand');
  const shrink = () => ring.classList.remove('hover-expand');
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, input, select, textarea, .product-card, .service-card, .sidebar-ad-card')) expand();
    else shrink();
  }, { passive: true });
}

/* ── Scroll Progress Bar Tracker ── */
function initScrollProgress() {
  let ticking = false;
  const update = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
    document.documentElement.style.setProperty('--scroll-progress', progress);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

/* ── Boot after first paint ── */
window.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCursor();
  initScrollProgress();
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'replace_with_your_client_id';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </GoogleOAuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);