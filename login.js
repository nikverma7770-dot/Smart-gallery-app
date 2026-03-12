const form = document.getElementById("login-form");
const errorEl = document.getElementById("login-error");

const showError = (message) => {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.classList.add("hidden");

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showError(data.error || "Unable to sign in.");
      return;
    }

    window.location.href = "/index.html";
  } catch (error) {
    showError("Network error. Please try again.");
  }
});
