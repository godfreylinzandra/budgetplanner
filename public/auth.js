// ===== auth.js =====

// ---- Elements ----
const loginForm = document.getElementById("loginForm");
const loginEmailEl = document.getElementById("loginEmail");
const loginPasswordEl = document.getElementById("loginPassword");

const registerForm = document.getElementById("registerForm");
const registerNameEl = document.getElementById("registerName");
const registerEmailEl = document.getElementById("registerEmail");
const registerAddressEl = document.getElementById("registerAddress");
const registerPasswordEl = document.getElementById("registerPassword");
const registerConfirmPasswordEl = document.getElementById("registerConfirmPassword");

const toRegister = document.getElementById("toRegister");
const toLogin = document.getElementById("toLogin");

// ---- Show/hide password ----
function setupShowPass(checkboxId, inputId) {
  const checkbox = document.getElementById(checkboxId);
  const input = document.getElementById(inputId);
  if (!checkbox || !input) return;
  checkbox.addEventListener("change", () => {
    input.type = checkbox.checked ? "text" : "password";
  });
}
setupShowPass("showLoginPass", "loginPassword");
setupShowPass("showRegisterPass", "registerPassword");
setupShowPass("showConfirmPass", "registerConfirmPassword");

// ---- Switch forms ----
function showRegister() {
  loginForm.classList.remove("active");
  registerForm.classList.add("active");
  localStorage.setItem("authForm", "register");
}
function showLogin() {
  registerForm.classList.remove("active");
  loginForm.classList.add("active");
  localStorage.setItem("authForm", "login");
}
toRegister.addEventListener("click", showRegister);
toLogin.addEventListener("click", showLogin);

// ---- Restore form on load ----
window.addEventListener("load", () => {
  const savedForm = localStorage.getItem("authForm") || "login";
  savedForm === "register" ? showRegister() : showLogin();
});

// ---- REGISTER ----
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // Stop actual form submission

  const name = registerNameEl.value.trim();
  const email = registerEmailEl.value.trim();
  const address = registerAddressEl.value.trim(); // ✅ Include address
  const password = registerPasswordEl.value;
  const confirmPassword = registerConfirmPasswordEl.value;

  if (!name || !email || !password || !confirmPassword) {
    alert("❌ Please fill in all required fields.");
    return;
  }
  if (password !== confirmPassword) {
    alert("❌ Passwords do not match.");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, address, password })
    });

    const data = await res.json();
    if (!res.ok) {
      alert("❌ " + (data.error || "Registration failed"));
      return;
    }

    alert("✅ Account created! You can now log in.");
    showLogin();
  } catch (err) {
    console.error(err);
    alert("❌ Registration failed. Try again later.");
  }
});

// ---- LOGIN ----
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = loginEmailEl.value.trim();
  const password = loginPasswordEl.value;

  if (!email || !password) {
    alert("❌ Please enter email and password.");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      alert("❌ " + (data.error || "Login failed"));
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "budget_plan.html";
  } catch (err) {
    console.error(err);
    alert("❌ Login failed. Try again later.");
  }
});
