// ============================================
// Configuration — UPDATE THESE VALUES
// ============================================
const CONFIG = {
  // ─── CRM Base URL ───────────────────────────────────────
  // For local development:  "http://localhost:3000"
  // For production:         "https://your-crm-app.vercel.app"  ← UPDATE THIS
  CRM_BASE_URL: "https://crm-psi-fawn-59.vercel.app",

  // API endpoint for external lead submissions
  API_ENDPOINT: "/api/leads/external",

  // ─── Authentication ─────────────────────────────────────
  // Bearer token (sent as Authorization header)
  AUTH_TOKEN: "pxoeqeHF1bPOqfr7LGDjVJ+Z0dEnem3q686nbJqMxUY=",

  // Default lead settings
  DEFAULT_SOURCE: "WEBSITE",
  DEFAULT_STAGE: "NEW",
};

// ============================================
// DOM Elements
// ============================================
const form = document.getElementById("leadForm");
const submitBtn = document.getElementById("submit-btn");
const successState = document.getElementById("success-state");
const resetBtn = document.getElementById("reset-btn");

const fields = {
  name: {
    input: document.getElementById("input-name"),
    group: document.getElementById("group-name"),
    error: document.getElementById("error-name"),
  },
  phone: {
    input: document.getElementById("input-phone"),
    group: document.getElementById("group-phone"),
    error: document.getElementById("error-phone"),
  },
  email: {
    input: document.getElementById("input-email"),
    group: document.getElementById("group-email"),
    error: document.getElementById("error-email"),
  },
  budget: {
    input: document.getElementById("input-budget"),
    group: document.getElementById("group-budget"),
    error: document.getElementById("error-budget"),
  },
  location: {
    input: document.getElementById("input-location"),
    group: document.getElementById("group-location"),
    error: document.getElementById("error-location"),
  },
};

// ============================================
// Validation
// ============================================
function validateField(name) {
  const field = fields[name];
  const value = field.input.value.trim();
  let errorMsg = "";

  switch (name) {
    case "name":
      if (!value) {
        errorMsg = "Name is required";
      } else if (value.length < 2) {
        errorMsg = "Name must be at least 2 characters";
      }
      break;

    case "email":
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errorMsg = "Please enter a valid email address";
      }
      break;

    case "phone":
      if (value) {
        // Strip all non-digit characters except leading +
        const digits = value.replace(/[^\d+]/g, "");
        if (digits.length < 7) {
          errorMsg = "Please enter a valid phone number";
        }
      }
      break;

    case "budget":
      if (value) {
        // Remove commas and spaces for validation
        const cleaned = value.replace(/[\s,]/g, "");
        if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
          errorMsg = "Budget must be a valid number";
        }
      }
      break;

    case "location":
      // Optional — no validation needed
      break;
  }

  if (errorMsg) {
    field.group.classList.add("has-error");
    field.error.textContent = errorMsg;
    return false;
  } else {
    field.group.classList.remove("has-error");
    field.error.textContent = "";
    return true;
  }
}

function validateAll() {
  let isValid = true;
  for (const name of Object.keys(fields)) {
    if (!validateField(name)) {
      isValid = false;
    }
  }
  return isValid;
}

// ============================================
// Budget Input Formatting
// ============================================
fields.budget.input.addEventListener("input", function (e) {
  let value = e.target.value;

  // Remove anything that isn't a digit, comma, or period
  value = value.replace(/[^\d.,]/g, "");

  e.target.value = value;
});

// Prevent non-numeric keystrokes (except navigation keys)
fields.budget.input.addEventListener("keypress", function (e) {
  const allowed = /[\d.,]/;
  if (!allowed.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
    e.preventDefault();
  }
});

// ============================================
// Real-time Validation on Blur
// ============================================
for (const [name, field] of Object.entries(fields)) {
  field.input.addEventListener("blur", () => validateField(name));

  // Clear error on input
  field.input.addEventListener("input", () => {
    if (field.group.classList.contains("has-error")) {
      field.group.classList.remove("has-error");
      field.error.textContent = "";
    }
  });
}

// ============================================
// Form Submission
// ============================================
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!validateAll()) {
    // Focus the first field with error
    const firstError = document.querySelector(".form-group.has-error .form-input");
    if (firstError) firstError.focus();
    return;
  }

  // Prepare payload matching the CRM schema
  const budgetRaw = fields.budget.input.value.trim().replace(/[\s,]/g, "");
  const payload = {
    name: fields.name.input.value.trim(),
    phone: fields.phone.input.value.trim() || null,
    email: fields.email.input.value.trim() || null,
    budget: budgetRaw ? parseFloat(budgetRaw) : null,
    location: fields.location.input.value.trim() || null,
    source: CONFIG.DEFAULT_SOURCE,
    stage: CONFIG.DEFAULT_STAGE,
  };

  // Set loading state
  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    // Add authentication header (Bearer token)
    headers["Authorization"] = `Bearer ${CONFIG.AUTH_TOKEN}`;

    const response = await fetch(
      `${CONFIG.CRM_BASE_URL}${CONFIG.API_ENDPOINT}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Lead created successfully:", result);

    // Show success state
    showSuccess();
  } catch (error) {
    console.error("Submission failed:", error);
    showSubmitError(error.message || "Something went wrong. Please try again.");
  } finally {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
});

// ============================================
// Success / Error UI
// ============================================
function showSuccess() {
  form.style.display = "none";
  successState.classList.remove("hidden");
}

function showSubmitError(message) {
  // Create a temporary toast notification
  let toast = document.getElementById("error-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "error-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      padding: 14px 24px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      color: #f87171;
      font-family: var(--font-sans);
      font-size: 0.9rem;
      backdrop-filter: blur(16px);
      z-index: 1000;
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      max-width: 90vw;
      text-align: center;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });

  // Auto-dismiss after 5s
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
    setTimeout(() => toast.remove(), 400);
  }, 5000);
}

// ============================================
// Reset
// ============================================
resetBtn.addEventListener("click", function () {
  form.reset();
  form.style.display = "";
  successState.classList.add("hidden");

  // Clear any lingering errors
  for (const field of Object.values(fields)) {
    field.group.classList.remove("has-error");
    field.error.textContent = "";
  }

  // Re-animate form groups
  const groups = form.querySelectorAll(".form-group, .submit-btn");
  groups.forEach((el) => {
    el.style.animation = "none";
    // Trigger reflow
    void el.offsetHeight;
    el.style.animation = "";
  });

  fields.name.input.focus();
});
