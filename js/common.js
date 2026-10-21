/**
 * CareTrack - Modern Healthcare Management System
 * Shared Dashboard & UI Utilities (common.js)
 * v2 — Fixed theme toggle persistence, FOUC prevention, and mobile sidebar
 */

const Common = (function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  THEME SYSTEM                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Read the saved theme from:
   *   1. Current user's settings (per-user preference)
   *   2. Fallback: global caretrack_theme localStorage key
   *   3. Final fallback: 'light'
   */
  function getStoredTheme() {
    try {
      // Check if we have an active session and user settings
      const sessionRaw = localStorage.getItem('caretrack_session');
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session && session.userId) {
          const settingsRaw = localStorage.getItem('caretrack_settings_' + session.userId);
          if (settingsRaw) {
            const settings = JSON.parse(settingsRaw);
            if (settings && settings.theme) return settings.theme;
          }
        }
      }
    } catch (e) { /* ignore parse errors */ }

    return localStorage.getItem('caretrack_theme') || 'light';
  }

  /**
   * Apply theme to <html> element immediately.
   * Called once at module evaluation time (before DOMContentLoaded)
   * to eliminate Flash Of Unstyled Content.
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    // Keep the global key in sync as the fallback
    localStorage.setItem('caretrack_theme', theme);
  }

  /** Public – applies the stored theme on every page load */
  function initTheme() {
    applyTheme(getStoredTheme());
  }

  /** Toggle between light ↔ dark and persist for the current user */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = current === 'dark' ? 'light' : 'dark';

    applyTheme(newTheme);

    // Persist in user-specific settings if logged in
    try {
      const user = Auth.getCurrentUser();
      if (user) {
        Storage.saveSettings(user.id, { theme: newTheme });
      }
    } catch (e) { /* auth/storage may not be present on landing page */ }

    // Sync every theme-toggle button on the page
    updateThemeIcon(newTheme);

    // Sync the settings-page toggle switch if it's on the page
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) themeSwitch.checked = newTheme === 'dark';

    showToast('Switched to ' + (newTheme === 'dark' ? 'Dark' : 'Light') + ' mode', 'info');
  }

  /** Update all .theme-toggle-btn icons to reflect the active theme */
  function updateThemeIcon(theme) {
    const sunSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>`;
    const moonSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>`;

    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      if (theme === 'dark') {
        btn.innerHTML = sunSVG;
        btn.title = 'Switch to Light Mode';
        btn.setAttribute('aria-label', 'Switch to Light Mode');
      } else {
        btn.innerHTML = moonSVG;
        btn.title = 'Switch to Dark Mode';
        btn.setAttribute('aria-label', 'Switch to Dark Mode');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  HEADER + SIDEBAR INITIALIZATION (dashboard pages)                  */
  /* ------------------------------------------------------------------ */

  function initHeaderAndSidebar() {
    try {
      const user = Auth.getCurrentUser();
      if (!user) return;

      // Populate user details in header pill
      const avatarEl = document.querySelector('.header-user-avatar');
      if (avatarEl) avatarEl.textContent = user.initials || 'CT';

      const nameEl = document.querySelector('.header-user-name');
      if (nameEl) nameEl.textContent = user.name;

      const roleEl = document.querySelector('.header-user-role');
      if (roleEl) roleEl.textContent = user.role || 'Member';
    } catch (e) { /* no-op if Auth not available */ }

    // Sync theme icon to current theme state
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeIcon(currentTheme);

    // Wire ALL .theme-toggle-btn elements on the page
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      // Remove any previous listener to avoid duplicates
      btn.onclick = toggleTheme;
    });

    // Notifications dropdown
    try {
      const user = Auth.getCurrentUser();
      if (user) setupNotifications(user.id);
    } catch (e) { /* no-op */ }

    // Sidebar badge counts
    try {
      const user = Auth.getCurrentUser();
      if (user) {
        const activeMeds = Storage.getMedicines(user.id).filter(m => m.status === 'Active');
        const upcomingApts = Storage.getAppointments(user.id).filter(a => a.status === 'Upcoming');
        const medBadge = document.getElementById('sidebar-meds-badge');
        if (medBadge) medBadge.textContent = activeMeds.length;
        const aptBadge = document.getElementById('sidebar-apts-badge');
        if (aptBadge) aptBadge.textContent = upcomingApts.length;
      }
    } catch (e) { /* no-op */ }

    // Mobile sidebar drawer
    setupMobileSidebar();

    // Global search — redirect to medicines page
    document.querySelectorAll('.header-search input').forEach(input => {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          const query = this.value.trim();
          if (query) window.location.href = 'medicines.html?search=' + encodeURIComponent(query);
        }
      });
    });

    // Highlight active sidebar link
    highlightActiveNavLink();
  }

  function highlightActiveNavLink() {
    const page = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.sidebar-nav .sidebar-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === page || (page === '' && href === 'dashboard.html'))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  MOBILE SIDEBAR DRAWER                                               */
  /* ------------------------------------------------------------------ */

  function setupMobileSidebar() {
    const menuBtn = document.querySelector('.menu-toggle-btn');
    const sidebar = document.querySelector('.app-sidebar');
    const closeBtn = document.querySelector('.sidebar-close-btn');

    // Create backdrop once
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    function openSidebar() {
      if (sidebar) sidebar.classList.add('active');
      if (backdrop) backdrop.classList.add('active');
      document.body.style.overflow = 'hidden'; // prevent scroll when drawer open
    }

    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('active');
      if (backdrop) backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (menuBtn) menuBtn.onclick = openSidebar;
    if (closeBtn) closeBtn.onclick = closeSidebar;
    if (backdrop) backdrop.onclick = closeSidebar;

    // Close drawer on ESC key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
        closeSidebar();
      }
    });

    // Close drawer when a sidebar link is clicked (on mobile)
    if (sidebar) {
      sidebar.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', function () {
          // Only close if in mobile view (sidebar is drawer)
          if (window.innerWidth < 769) closeSidebar();
        });
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  NOTIFICATIONS DROPDOWN                                              */
  /* ------------------------------------------------------------------ */

  function setupNotifications(userId) {
    const notifBtn = document.querySelector('.notification-btn');
    const notifDropdown = document.querySelector('.notification-dropdown');
    const notifBadge = document.querySelector('.notification-badge');
    const notifList = document.querySelector('.notification-list');
    const clearBtn = document.querySelector('.notification-clear-btn');

    if (!notifBtn || !notifDropdown) return;

    notifBtn.onclick = function (e) {
      e.stopPropagation();
      notifDropdown.classList.toggle('active');
    };

    document.addEventListener('click', function (e) {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.classList.remove('active');
      }
    });

    renderNotifications();

    if (clearBtn) {
      clearBtn.onclick = function () {
        Storage.clearAllNotifications(userId);
        renderNotifications();
        showToast('All notifications cleared', 'info');
      };
    }

    function renderNotifications() {
      let items = [];
      try { items = Storage.getNotifications(userId); } catch (e) { /* no-op */ }
      const unread = items.filter(n => !n.read);

      if (notifBadge) {
        notifBadge.style.display = unread.length > 0 ? 'block' : 'none';
      }

      if (!notifList) return;

      if (items.length === 0) {
        notifList.innerHTML = '<p class="text-muted text-sm" style="text-align: center; padding: 1.5rem 0;">No new notifications</p>';
        return;
      }

      notifList.innerHTML = items.map(n => `
        <div class="notification-item ${n.type === 'warning' ? 'alert' : ''}" data-id="${n.id}">
          <div class="notification-icon">
            ${n.type === 'warning' ? '⚠️' : (n.type === 'success' ? '✓' : 'ℹ️')}
          </div>
          <div class="notification-content">
            <div class="notification-text">${escapeHtml(n.title)}: ${escapeHtml(n.message)}</div>
            <div class="notification-time">${escapeHtml(n.time)}</div>
          </div>
        </div>
      `).join('');
    }
  }

  /* ------------------------------------------------------------------ */
  /*  TOAST NOTIFICATIONS                                                 */
  /* ------------------------------------------------------------------ */

  function showToast(message, type) {
    type = type || 'info';
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { success: '✓', danger: '✕', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span style="font-weight: 700; font-size: 1.1rem;">' + (icons[type] || 'ℹ️') + '</span>'
      + '<span>' + escapeHtml(message) + '</span>';

    container.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('fade-out');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  /* ------------------------------------------------------------------ */
  /*  MODAL UTILITIES                                                     */
  /* ------------------------------------------------------------------ */

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      // Only restore scroll if no other modal is open
      if (!document.querySelector('.modal-overlay.active')) {
        document.body.style.overflow = '';
      }
    }
  }

  function confirmDialog(title, message, confirmBtnText, onConfirm) {
    confirmBtnText = confirmBtnText || 'Confirm';
    let modal = document.getElementById('confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirm-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-container" style="max-width: 440px;">
          <div class="modal-header">
            <h3 class="modal-title" id="confirm-modal-title"></h3>
            <button class="modal-close" id="confirm-modal-x">&times;</button>
          </div>
          <div class="modal-body">
            <p id="confirm-modal-desc" style="color: var(--body-text); font-size: 0.95rem;"></p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" id="confirm-modal-cancel">Cancel</button>
            <button class="btn btn-danger" id="confirm-modal-ok"></button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-desc').textContent = message;
    document.getElementById('confirm-modal-ok').textContent = confirmBtnText;

    openModal('confirm-modal');

    const okBtn = document.getElementById('confirm-modal-ok');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const xBtn = document.getElementById('confirm-modal-x');

    const cleanup = function () {
      closeModal('confirm-modal');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      xBtn.onclick = null;
    };

    okBtn.onclick = function () { cleanup(); if (typeof onConfirm === 'function') onConfirm(); };
    cancelBtn.onclick = cleanup;
    xBtn.onclick = cleanup;
  }

  /* ------------------------------------------------------------------ */
  /*  HELPER UTILITIES                                                    */
  /* ------------------------------------------------------------------ */

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      // Parse as UTC date to avoid timezone shifts
      const parts = dateStr.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  EARLY THEME APPLICATION (runs immediately on script evaluation)    */
  /* ------------------------------------------------------------------ */

  // Apply theme before DOM is fully painted — prevents white flash
  initTheme();

  /* ------------------------------------------------------------------ */
  /*  PUBLIC API                                                          */
  /* ------------------------------------------------------------------ */

  return {
    initTheme: initTheme,
    toggleTheme: toggleTheme,
    updateThemeIcon: updateThemeIcon,
    initHeaderAndSidebar: initHeaderAndSidebar,
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    confirmDialog: confirmDialog,
    escapeHtml: escapeHtml,
    formatDate: formatDate
  };

})();
