/**
 * StockWise — Dashboard Page Logic (Phase 1 placeholder)
 * dashboard/js/dashboard.js
 *
 * Responsibilities (Phase 1 only):
 *  1. Read "loggedInOwnerName" and "loggedInBusinessName" from
 *     localStorage (written there by signup.js on successful sign-up).
 *  2. If both values are present → show the welcome section with the
 *     real name and business name.
 *  3. If either is missing → show the no-session fallback section and
 *     hide the welcome section, so the page never shows "undefined".
 *  4. Populate the navbar user label with a short greeting.
 *
 * NOTE: localStorage is accessed directly here as a TEMPORARY
 * stand-in for a real auth/session system.  In Phase 2 this file
 * will be updated to read from the backend session token instead.
 * This is the ONLY place in dashboard.js that touches localStorage —
 * all inventory/sales data goes through Storage (storage.js) when
 * Phase 2 is built.
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------------
     localStorage keys (temporary Phase-1 session stand-in)
     ---------------------------------------------------------------- */
  var KEY_OWNER_NAME  = 'loggedInOwnerName';
  var KEY_BIZ_NAME    = 'loggedInBusinessName';

  /* ----------------------------------------------------------------
     DOM references
     ---------------------------------------------------------------- */
  var welcomeSection   = document.getElementById('welcome-section');
  var noSessionSection = document.getElementById('no-session-section');
  var welcomeHeading   = document.getElementById('welcome-heading');
  var welcomeBiz       = document.getElementById('welcome-biz');
  var navbarUserLabel  = document.getElementById('navbar-user-label');

  /* ----------------------------------------------------------------
     Read session values
     ---------------------------------------------------------------- */
  var ownerName = '';
  var bizName   = '';

  try {
    ownerName = localStorage.getItem(KEY_OWNER_NAME) || '';
    bizName   = localStorage.getItem(KEY_BIZ_NAME)   || '';
  } catch (err) {
    /* localStorage unavailable in some restricted environments */
    console.warn('[StockWise:dashboard] Could not read from localStorage.', err);
  }

  /* ----------------------------------------------------------------
     Render: session found
     ---------------------------------------------------------------- */
  if (ownerName && bizName) {

    /* Welcome heading — "Welcome back, JOHN DOE" */
    welcomeHeading.textContent = 'Welcome back, ' + ownerName;

    /* Business name sub-line */
    welcomeBiz.textContent = bizName + ' — Dashboard';

    /* Navbar pill label — show truncated name */
    navbarUserLabel.textContent = ownerName;

    /* Show the welcome section, hide the no-session fallback */
    welcomeSection.classList.add('visible');
    noSessionSection.classList.remove('visible');

  /* ----------------------------------------------------------------
     Render: no session / missing data
     ---------------------------------------------------------------- */
  } else {

    /* Hide welcome, reveal the "please log in" message */
    welcomeSection.classList.remove('visible');
    noSessionSection.classList.add('visible');

    /* Blank the navbar label */
    navbarUserLabel.textContent = '';

  }

  /* ----------------------------------------------------------------
     Log Out handler
     The <a> element already points to ../login/index.html, so
     navigation happens naturally.  We hook it here only to clear
     the temporary session keys so the dashboard won't show stale
     data if someone navigates back without logging in again.
     ---------------------------------------------------------------- */
  var btnLogout = document.getElementById('btn-logout');

  if (btnLogout) {
    btnLogout.addEventListener('click', function () {
      try {
        localStorage.removeItem(KEY_OWNER_NAME);
        localStorage.removeItem(KEY_BIZ_NAME);
      } catch (err) {
        console.warn('[StockWise:dashboard] Could not clear session from localStorage.', err);
      }
      /* The href on the <a> tag handles navigation — no need to
         call window.location here; letting the default link work
         means it functions correctly over file:// too. */
    });
  }

})();
