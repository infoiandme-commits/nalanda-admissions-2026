/* =========================================================
   Nalanda Vidya Niketan — Admissions 2026 Landing Page
   ========================================================= */

// -------------------------------------------------------
// IMPORTANT: Paste your deployed Google Apps Script Web App
// URL here after following README.md → "Google Sheet setup".
// It looks like: https://script.google.com/macros/s/XXXXXXXX/exec
// -------------------------------------------------------
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwKzVVXUjSeYHrqswnpNE_o8-w1xrbF_qFNW3V-QLTotIFhno-0ViSvZILKVNO2M7EDJg/exec";

document.addEventListener("DOMContentLoaded", function () {
  initHeaderScroll();
  initMobileNav();
  initFaqAccordion();
  populateTrackingFields();
  initEnquiryForm();
  initScrollReveal();
  initCounters();
});

/* ---------- Sticky header background on scroll ---------- */
function initHeaderScroll() {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  const toggle = () => {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  toggle();
  window.addEventListener("scroll", toggle, { passive: true });
}

/* ---------- Mobile nav toggle ---------- */
function initMobileNav() {
  const btn = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- FAQ accordion ---------- */
function initFaqAccordion() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    q.addEventListener("click", () => {
      const isOpen = q.getAttribute("aria-expanded") === "true";
      // close all
      document.querySelectorAll(".faq-q").forEach((otherQ) => {
        otherQ.setAttribute("aria-expanded", "false");
        otherQ.closest(".faq-item").querySelector(".faq-a").style.maxHeight = null;
      });
      if (!isOpen) {
        q.setAttribute("aria-expanded", "true");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });
}

/* ---------- Capture UTM parameters + page context ---------- */
function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_term: params.get("utm_term") || "",
    utm_content: params.get("utm_content") || "",
  };
}

function populateTrackingFields() {
  const utm = getUtmParams();
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };
  setVal("pageUrl", window.location.href);
  setVal("referrer", document.referrer || "direct");
  setVal("utm_source", utm.utm_source);
  setVal("utm_medium", utm.utm_medium);
  setVal("utm_campaign", utm.utm_campaign);
  setVal("utm_term", utm.utm_term);
  setVal("utm_content", utm.utm_content);

  // Persist UTM across the session in case the person browses before enquiring
  try {
    const stored = JSON.parse(sessionStorage.getItem("nvn_utm") || "{}");
    const merged = { ...stored, ...Object.fromEntries(Object.entries(utm).filter(([, v]) => v)) };
    sessionStorage.setItem("nvn_utm", JSON.stringify(merged));
    Object.entries(merged).forEach(([key, val]) => setVal(key, val));
  } catch (e) {
    /* sessionStorage unavailable — safe to ignore */
  }
}

/* ---------- Enquiry form submission → Google Sheet ---------- */
function initEnquiryForm() {
  const form = document.getElementById("enquiryForm");
  const note = document.getElementById("formNote");
  const submitBtn = document.getElementById("submitBtn");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.indexOf("PASTE_YOUR") === 0) {
      note.textContent = "Form is not connected to Google Sheets yet — see README.md.";
      note.className = "form-note error";
      console.warn("GOOGLE_SCRIPT_URL is not set in js/script.js");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    note.textContent = "";
    note.className = "form-note";

    const formData = new FormData(form);
    const params = new URLSearchParams();
    formData.forEach((value, key) => params.append(key, value));
    params.append("submittedAt", new Date().toISOString());

    // Apps Script Web Apps don't return CORS headers, so the response body
    // can't be read from the browser. We send with mode:no-cors (a "simple
    // request", no pre-flight) and treat a completed fetch as success.
    fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })
      .then(() => {
        note.textContent = "Thank you! Our admissions team will contact you shortly.";
        note.className = "form-note success";
        form.reset();
        populateTrackingFields();
        if (window.gtag) {
          window.gtag("event", "generate_lead", { form_id: "enquiryForm" });
        }
      })
      .catch((err) => {
        console.error("Enquiry submission failed:", err);
        note.textContent = "Something went wrong. Please call us directly at +91 98765 67888.";
        note.className = "form-note error";
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Enquiry";
      });
  });
}

/* ---------- Scroll-reveal animation ---------- */
function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  // Stagger cards that share a parent grid/list, in DOM order.
  const groups = new Map();
  items.forEach((el) => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });
  groups.forEach((siblings) => {
    siblings.forEach((el, i) => {
      el.style.transitionDelay = Math.min(i * 0.08, 0.48) + "s";
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  items.forEach((el) => observer.observe(el));
}

/* ---------- Animated number counters ---------- */
function initCounters() {
  const counters = document.querySelectorAll("[data-count-to]");
  if (!counters.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute("data-count-to"), 10) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    if (prefersReduced) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((el) => observer.observe(el));
}
