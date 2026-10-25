/**
 * StockWise — Sign-Up Page Logic
 * signup/js/signup.js
 *
 * All DOM interaction is wired via addEventListener.
 * No inline handlers. Works with file:// protocol (no ES modules needed).
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------------
     DOM References
     ---------------------------------------------------------------- */
  var form          = document.getElementById('signup-form');
  var fullNameInput = document.getElementById('full-name');
  var emailInput    = document.getElementById('work-email');
  var bizNameInput  = document.getElementById('business-name');
  var roleSelect    = document.getElementById('role');
  var passwordInput = document.getElementById('password');

  var passwordToggleBtn  = document.getElementById('password-toggle');
  var passwordToggleIcon = document.getElementById('password-toggle-icon');

  var strengthBarRow = document.getElementById('strength-bar-row');
  var strengthLabel  = document.getElementById('strength-label');

  var bizTooltipTrigger = document.getElementById('biz-tooltip-trigger');

  var submitBtn = document.getElementById('btn-request-access');

  var toast     = document.getElementById('toast');
  var toastIcon = document.getElementById('toast-icon');
  var toastMsg  = document.getElementById('toast-msg');

  /* ----------------------------------------------------------------
     Utility: show / hide field errors
     ---------------------------------------------------------------- */
  function setError(inputEl, errorId, message, isHtml) {
    var errorEl = document.getElementById(errorId);
    if (!errorEl) return;
    if (isHtml) {
      errorEl.innerHTML = message;
    } else {
      errorEl.textContent = message;
    }
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
    inputEl.classList.remove('is-invalid');
  }

  function markValid(inputEl) {
    inputEl.classList.add('is-valid');
    inputEl.classList.remove('is-invalid');
  }

  /* ----------------------------------------------------------------
     Validation helpers
     ---------------------------------------------------------------- */
  function validateFullName() {
    var val = fullNameInput.value.trim();
    if (!val) {
      setError(fullNameInput, 'full-name-error', 'Full name is required.');
      return false;
    }
    if (val.length < 2) {
      setError(fullNameInput, 'full-name-error', 'Name must be at least 2 characters.');
      return false;
    }
    clearError(fullNameInput, 'full-name-error');
    markValid(fullNameInput);
    return true;
  }

  function validateEmail() {
    var val = emailInput.value.trim();
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      setError(emailInput, 'work-email-error', 'Work email is required.');
      return false;
    }
    if (!emailPattern.test(val)) {
      setError(emailInput, 'work-email-error', 'Enter a valid email address.');
      return false;
    }
    clearError(emailInput, 'work-email-error');
    markValid(emailInput);
    return true;
  }

  function validateBizName() {
    var val = bizNameInput.value.trim();
    if (!val) {
      setError(bizNameInput, 'business-name-error', 'Business name is required.');
      return false;
    }
    clearError(bizNameInput, 'business-name-error');
    markValid(bizNameInput);
    return true;
  }

  function validateRole() {
    var val = roleSelect.value;
    if (!val) {
      setError(roleSelect, 'role-error', 'Please select your role.');
      return false;
    }
    clearError(roleSelect, 'role-error');
    markValid(roleSelect);
    return true;
  }

  function validatePassword() {
    var val = passwordInput.value;
    if (!val) {
      setError(passwordInput, 'password-error', 'Password is required.');
      return false;
    }
    if (val.length < 8) {
      setError(passwordInput, 'password-error', 'Password must be at least 8 characters.');
      return false;
    }
    clearError(passwordInput, 'password-error');
    markValid(passwordInput);
    return true;
  }

  /* ----------------------------------------------------------------
     Password strength meter
     ---------------------------------------------------------------- */
  var strengthTexts = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  function scorePassword(pw) {
    if (!pw) return 0;
    var score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    /* clamp to 1-4 */
    if (score === 0) return 0;
    if (score === 1) return 1;
    if (score === 2) return 2;
    if (score === 3) return 3;
    return 4;
  }

  function updateStrengthMeter(pw) {
    var level = scorePassword(pw);
    if (!pw) {
      strengthBarRow.classList.remove('visible');
      strengthBarRow.removeAttribute('data-strength');
      strengthLabel.textContent = '';
      strengthLabel.removeAttribute('data-level');
      return;
    }
    strengthBarRow.classList.add('visible');
    strengthBarRow.setAttribute('data-strength', level);
    strengthLabel.textContent = strengthTexts[level];
    strengthLabel.setAttribute('data-level', level);
  }

  /* ----------------------------------------------------------------
     Password visibility toggle
     ---------------------------------------------------------------- */
  function handlePasswordToggle() {
    var isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    passwordToggleIcon.textContent = isPassword ? 'visibility' : 'visibility_off';
    passwordToggleBtn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
    /* keep focus on the input for usability */
    passwordInput.focus();
  }

  /* ----------------------------------------------------------------
     Tooltip keyboard/click toggle (for Business Name info icon)
     ---------------------------------------------------------------- */
  function handleTooltipKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      bizTooltipTrigger.classList.toggle('tooltip-open');
    }
    if (event.key === 'Escape') {
      bizTooltipTrigger.classList.remove('tooltip-open');
    }
  }

  /* ----------------------------------------------------------------
     Toast notification
     ---------------------------------------------------------------- */
  var toastTimeout = null;

  function showToast(message, type) {
    /* type: 'success' | 'error' */
    if (toastTimeout) clearTimeout(toastTimeout);

    toast.classList.remove('toast--success', 'toast--error', 'toast--visible');
    toastIcon.textContent = type === 'success' ? 'check_circle' : 'error';
    toastMsg.textContent = message;
    toast.classList.add('toast--' + type);

    /* Force reflow so animation re-triggers */
    void toast.offsetWidth;
    toast.classList.add('toast--visible');

    toastTimeout = setTimeout(function () {
      toast.classList.remove('toast--visible');
    }, 4000);
  }

  /* ----------------------------------------------------------------
     Live validation (on blur / input)
     ---------------------------------------------------------------- */
  fullNameInput.addEventListener('blur', validateFullName);
  emailInput.addEventListener('blur', validateEmail);
  bizNameInput.addEventListener('blur', validateBizName);
  roleSelect.addEventListener('change', validateRole);

  passwordInput.addEventListener('input', function () {
    updateStrengthMeter(passwordInput.value);
    /* Only live-validate password if user has already blurred it once */
    if (passwordInput.dataset.touched) {
      validatePassword();
    }
  });

  passwordInput.addEventListener('blur', function () {
    passwordInput.dataset.touched = 'true';
    validatePassword();
  });

  /* Remove "invalid" indicator while user is actively editing */
  fullNameInput.addEventListener('input', function () {
    if (fullNameInput.classList.contains('is-invalid')) validateFullName();
  });
  emailInput.addEventListener('input', function () {
    if (emailInput.classList.contains('is-invalid')) validateEmail();
  });
  bizNameInput.addEventListener('input', function () {
    if (bizNameInput.classList.contains('is-invalid')) validateBizName();
  });

  /* ----------------------------------------------------------------
     Password toggle
     ---------------------------------------------------------------- */
  passwordToggleBtn.addEventListener('click', handlePasswordToggle);

  /* ----------------------------------------------------------------
     Tooltip
     ---------------------------------------------------------------- */
  bizTooltipTrigger.addEventListener('keydown', handleTooltipKeydown);
  /* Close tooltip when focus leaves the anchor */
  bizTooltipTrigger.addEventListener('blur', function () {
    bizTooltipTrigger.classList.remove('tooltip-open');
  });

  /* ----------------------------------------------------------------
     Form submission
     ---------------------------------------------------------------- */
  form.addEventListener('submit', function (event) {
    event.preventDefault();

    /* Run all validators */
    var nameOk  = validateFullName();
    var emailOk = validateEmail();
    var bizOk   = validateBizName();
    var roleOk  = validateRole();
    passwordInput.dataset.touched = 'true';
    var pwOk    = validatePassword();

    if (!nameOk || !emailOk || !bizOk || !roleOk || !pwOk) {
      /* Focus first invalid field */
      var firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      showToast('Please fix the errors above.', 'error');
      return;
    }

    var emailVal = emailInput.value.trim();
    if (window.Storage && Storage.findUserByEmail(emailVal)) {
      var loginUrl = '../login/?email=' + encodeURIComponent(emailVal);
      setError(
        emailInput,
        'work-email-error',
        'An account with this email already exists. <a href="' + loginUrl + '" style="text-decoration: underline; color: inherit;">Log In Instead</a>',
        true
      );
      emailInput.focus();
      return;
    }

    /* Simulate async submission */
    submitBtn.classList.add('loading');
    submitBtn.setAttribute('disabled', 'true');

    setTimeout(function () {
      submitBtn.classList.remove('loading');
      submitBtn.removeAttribute('disabled');

      /* ── Temporary Phase-1 session stand-in ────────────────────── */
      if (window.Storage) {
        Storage.addUser({
          fullName: fullNameInput.value.trim(),
          businessName: bizNameInput.value.trim(),
          email: emailVal,
          password: passwordInput.value
        });
      }

      try {
        localStorage.setItem('loggedInOwnerName',    fullNameInput.value.trim());
        localStorage.setItem('loggedInBusinessName', bizNameInput.value.trim());
      } catch (lsErr) {
        console.warn('[StockWise:signup] Could not write session to localStorage.', lsErr);
      }

      /* In a real app this would POST to the server.
         For now, show success and redirect. */
      showToast('Access request submitted! Redirecting...', 'success');
      
      setTimeout(function() {
        window.location.href = '../dashboard/';
      }, 1200);

      form.reset();

      /* Clear valid indicators */
      var allInputs = form.querySelectorAll('.field-input');
      allInputs.forEach(function (el) {
        el.classList.remove('is-valid', 'is-invalid');
        delete el.dataset.touched;
      });

      /* Reset strength meter */
      updateStrengthMeter('');
    }, 1400);
  });

  /* ----------------------------------------------------------------
     Input uppercase transform for Full Name and Business Name
     (mirrors the placeholder style — optional UX nicety)
     ---------------------------------------------------------------- */
  function toUpperOnType(inputEl) {
    inputEl.addEventListener('input', function () {
      var pos = inputEl.selectionStart;
      inputEl.value = inputEl.value.toUpperCase();
      inputEl.setSelectionRange(pos, pos);
    });
  }

  toUpperOnType(fullNameInput);
  toUpperOnType(bizNameInput);

})();
