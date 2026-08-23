/**
 * StockWise — Login Page Logic
 * login/js/login.js
 *
 * All DOM interaction wired via addEventListener.
 * No inline handlers. Works with file:// protocol (no ES modules).
 *
 * Features:
 *  - Email + password required validation with inline error messages
 *  - Email format validation (regex)
 *  - Password show/hide toggle
 *  - "Remember this device" checkbox state tracked on submit
 *  - On successful validation: prevents default, logs data, shows
 *    on-page success message (no real auth / navigation yet)
 *  - "Continue with Google" logs a placeholder message
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------------
     DOM References
     ---------------------------------------------------------------- */
  var form          = document.getElementById('login-form');
  var emailInput    = document.getElementById('email');
  var passwordInput = document.getElementById('password');
  var rememberBox   = document.getElementById('remember');

  var passwordToggleBtn = document.getElementById('password-toggle');
  var eyeIcon           = document.getElementById('eye-icon');

  var submitBtn     = document.getElementById('btn-clock-in');
  var googleBtn     = document.getElementById('btn-google');
  var loginMessage  = document.getElementById('login-message');

  /* ----------------------------------------------------------------
     Utility: show / hide field errors
     ---------------------------------------------------------------- */
  function setError(inputEl, errorId, message) {
    var errorEl = document.getElementById(errorId);
    if (!errorEl) return;
    errorEl.textContent = message;
    if (message) {
      errorEl.classList.add('visible');
      inputEl.classList.add('is-invalid');
      inputEl.classList.remove('is-valid');
    } else {
      errorEl.classList.remove('visible');
      inputEl.classList.remove('is-invalid');
    }
  }

  function clearError(inputEl, errorId) {
    setError(inputEl, errorId, '');
  }

  function markValid(inputEl) {
    inputEl.classList.add('is-valid');
    inputEl.classList.remove('is-invalid');
  }

  /* ----------------------------------------------------------------
     Utility: show / hide the inline login message
     ---------------------------------------------------------------- */
  function showMessage(text, type) {
    /* type: 'success' | 'error' */
    loginMessage.textContent = text;
    loginMessage.className = 'login-message visible msg--' + type;
  }

  function hideMessage() {
    loginMessage.className = 'login-message';
    loginMessage.textContent = '';
  }

  /* ----------------------------------------------------------------
     Validation helpers
     ---------------------------------------------------------------- */
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateEmail() {
    var val = emailInput.value.trim();
    if (!val) {
      setError(emailInput, 'email-error', 'Work email is required.');
      return false;
    }
    if (!EMAIL_PATTERN.test(val)) {
      setError(emailInput, 'email-error', 'Enter a valid email address.');
      return false;
    }
    clearError(emailInput, 'email-error');
    markValid(emailInput);
    return true;
  }

  function validatePassword() {
    var val = passwordInput.value;
    if (!val) {
      setError(passwordInput, 'password-error', 'Password is required.');
      return false;
    }
    clearError(passwordInput, 'password-error');
    markValid(passwordInput);
    return true;
  }

  /* ----------------------------------------------------------------
     Password show / hide toggle
     ---------------------------------------------------------------- */
  function handlePasswordToggle() {
    var isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    eyeIcon.textContent = isHidden ? 'visibility_off' : 'visibility';
    passwordToggleBtn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
    /* Return focus to password field for usability */
    passwordInput.focus();
  }

  passwordToggleBtn.addEventListener('click', handlePasswordToggle);

  /* ----------------------------------------------------------------
     Live-validation: clear errors while user edits
     ---------------------------------------------------------------- */
  emailInput.addEventListener('blur', validateEmail);
  emailInput.addEventListener('input', function () {
    if (emailInput.classList.contains('is-invalid')) validateEmail();
    hideMessage();
  });

  passwordInput.addEventListener('blur', validatePassword);
  passwordInput.addEventListener('input', function () {
    if (passwordInput.classList.contains('is-invalid')) validatePassword();
    hideMessage();
  });

  /* ----------------------------------------------------------------
     Form submission
     ---------------------------------------------------------------- */
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    hideMessage();

    var emailOk = validateEmail();
    var pwOk    = validatePassword();

    if (!emailOk || !pwOk) {
      /* Focus the first broken field */
      var firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    /* Gather form data */
    var formData = {
      email:    emailInput.value.trim(),
      password: passwordInput.value,   /* never log real passwords in prod */
      remember: rememberBox.checked
    };

    console.log('[StockWise] Login form submitted:', {
      email:    formData.email,
      remember: formData.remember,
      /* password intentionally omitted from log */
    });

    /* Simulate async check */
    submitBtn.classList.add('loading');
    submitBtn.setAttribute('disabled', 'true');

    setTimeout(function () {
      submitBtn.classList.remove('loading');
      submitBtn.removeAttribute('disabled');

      console.log('[StockWise] Remember this device:', formData.remember);

      showMessage('Clock in successful. Redirecting...', 'success');
      setTimeout(function() {
        window.location.href = '../dashboard/index.html';
      }, 800);
    }, 900);
  });

  /* ----------------------------------------------------------------
     "Continue with Google" placeholder
     ---------------------------------------------------------------- */
  googleBtn.addEventListener('click', function () {
    console.log('[StockWise] Google OAuth flow triggered (not yet wired — add real OAuth here).');
    showMessage('Google sign-in not yet connected.', 'error');
  });

})();
