// Replace this URL with your deployed Google Apps Script Web App URL.
// Example: "https://script.google.com/macros/s/AKfycb.../exec"
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzVGPiyUcR9kedu1RmTGxF_G68THGZMj5Hcoh5kKpIqSmSSJDG4P3QvpHp99FKbqVUK/exec";

const pageStartedAt = Date.now();
const visitId = generateVisitId();
let formSubmitted = false;

const menuToggle = document.getElementById("menuToggle");
const siteMenu = document.getElementById("siteMenu");

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
  siteMenu.hidden = isOpen;
});

siteMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    siteMenu.hidden = true;
  });
});

const emailForm = document.getElementById("emailForm");
const emailInput = document.getElementById("email");
const formStatus = emailForm.querySelector(".form-status");
const submitButton = emailForm.querySelector(".submit-button");

// Record the visit immediately so every ad click has a row in Google Sheets,
// even if the browser cannot send a final leave record on unload.
postRecord(buildPayload("", "page_view", 0)).catch(() => {});

emailForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  if (!isValidEmail(email)) {
    setFormStatus("Please enter a valid email address.", "error");
    emailInput.focus();
    return;
  }

  if (!isConfigured(GOOGLE_SCRIPT_URL)) {
    setFormStatus("Something went wrong. Please try again.", "error");
    return;
  }

  formSubmitted = true;
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  setFormStatus("", "");

  try {
    await postRecord(buildPayload(email, "form_submit"));
    emailInput.value = "";
    setFormStatus("Thank you. We'll keep you updated.", "success");
  } catch (error) {
    setFormStatus("Something went wrong. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit";
  }
});

// Update the same visit row with the final time on page when the visitor leaves.
window.addEventListener("pagehide", () => {
  if (formSubmitted || !isConfigured(GOOGLE_SCRIPT_URL)) return;

  const body = JSON.stringify(buildPayload("", "page_leave"));
  try {
    navigator.sendBeacon(
      GOOGLE_SCRIPT_URL,
      new Blob([body], { type: "text/plain;charset=utf-8" })
    );
  } catch (error) {
    // Ignore browsers that do not support sendBeacon.
  }

  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    keepalive: true,
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body
  }).catch(() => {});
});

function buildPayload(email, source, timeOnPage = getTimeOnPage()) {
  return {
    visitId,
    source,
    email,
    group: getGroup(),
    timeOnPage,
    deviceType: getDeviceType(),
    region: getRegion(),
    language: getLanguage()
  };
}

function generateVisitId() {
  const random = Math.random().toString(36).slice(2, 10);
  return Date.now().toString(36) + "-" + random;
}

async function postRecord(payload) {
  if (!isConfigured(GOOGLE_SCRIPT_URL)) {
    throw new Error("Google Apps Script URL is not configured.");
  }

  await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });
}

function getGroup() {
  const params = new URLSearchParams(window.location.search);
  const keys = ["group", "variant", "ad", "utm_campaign", "utm_source", "utm_medium"];
  for (const key of keys) {
    const value = params.get(key);
    if (value && value.trim()) {
      return value.trim().slice(0, 200);
    }
  }
  return "direct";
}

function getTimeOnPage() {
  return Math.max(0, Math.round((Date.now() - pageStartedAt) / 1000));
}

function getDeviceType() {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    return "tablet";
  }
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

function getRegion() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  } catch (error) {
    return "unknown";
  }
}

function getLanguage() {
  const value =
    navigator.language ||
    (navigator.languages && navigator.languages[0]) ||
    "unknown";
  return value.slice(0, 50);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isConfigured(url) {
  return /^https:\/\/script\.google\.com\/macros\/s\/.+/.test(url);
}

function setFormStatus(message, type) {
  formStatus.textContent = message;
  formStatus.dataset.type = type;
}
