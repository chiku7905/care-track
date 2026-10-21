/**
 * CareTrack - Modern Healthcare Management System
 * Settings & Preferences Controller (settings.js)
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  if (!Auth.requireAuth()) return;
  const user = Auth.getCurrentUser();
  if (!user) return;

  Common.initHeaderAndSidebar();

  // Setup Logout
  const logoutBtn = document.getElementById('btn-logout');
  const settingsLogoutBtn = document.getElementById('btn-settings-logout');

  function handleLogout() {
    Common.confirmDialog(
      'Sign Out',
      'Are you sure you want to log out of CareTrack?',
      'Sign Out',
      () => Auth.logout()
    );
  }

  if (logoutBtn) logoutBtn.onclick = handleLogout;
  if (settingsLogoutBtn) settingsLogoutBtn.onclick = handleLogout;

  // Settings DOM Elements
  const themeSwitch = document.getElementById('theme-switch');
  const prefMed = document.getElementById('pref-med-reminders');
  const prefEmail = document.getElementById('pref-email-notif');
  const prefSound = document.getElementById('pref-sound');

  // Password Form Elements
  const passForm = document.getElementById('password-change-form');
  const currPassInput = document.getElementById('curr-password');
  const newPassInput = document.getElementById('new-password');
  const confirmPassInput = document.getElementById('confirm-new-password');

  const currPassError = document.getElementById('curr-pass-error');
  const newPassError = document.getElementById('new-pass-error');
  const confirmPassError = document.getElementById('confirm-pass-error');

  // Load preferences
  function loadSettings() {
    const settings = Storage.getSettings(user.id);
    const currentTheme = document.documentElement.getAttribute('data-theme') || settings.theme || 'light';

    if (themeSwitch) {
      themeSwitch.checked = currentTheme === 'dark';
    }
    if (prefMed) {
      prefMed.checked = settings.medicineReminders !== false;
    }
    if (prefEmail) {
      prefEmail.checked = settings.notificationsEmail !== false;
    }
    if (prefSound) {
      prefSound.checked = !!settings.soundEnabled;
    }
  }

  // Theme switch handler — delegates to Common.toggleTheme for consistency
  if (themeSwitch) {
    themeSwitch.addEventListener('change', function () {
      // Use Common.toggleTheme so the header icon and all other toggles stay in sync
      Common.toggleTheme();
      // Ensure the switch stays in the correct checked state after toggle
      const applied = document.documentElement.getAttribute('data-theme') || 'light';
      this.checked = applied === 'dark';
    });
  }

  // Notification toggles
  if (prefMed) {
    prefMed.addEventListener('change', function () {
      Storage.saveSettings(user.id, { medicineReminders: this.checked });
      Common.showToast(`Medicine reminders ${this.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  }

  if (prefEmail) {
    prefEmail.addEventListener('change', function () {
      Storage.saveSettings(user.id, { notificationsEmail: this.checked });
      Common.showToast(`Email summaries ${this.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  }

  if (prefSound) {
    prefSound.addEventListener('change', function () {
      Storage.saveSettings(user.id, { soundEnabled: this.checked });
      Common.showToast(`Audible alerts ${this.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  }

  // Password Change Handler
  passForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let hasError = false;

    const currPass = currPassInput.value;
    const newPass = newPassInput.value;
    const confirmPass = confirmPassInput.value;

    if (!currPass) {
      currPassError.classList.add('visible');
      hasError = true;
    } else {
      currPassError.classList.remove('visible');
    }

    if (!newPass || newPass.length < 6) {
      newPassError.classList.add('visible');
      hasError = true;
    } else {
      newPassError.classList.remove('visible');
    }

    if (newPass !== confirmPass) {
      confirmPassError.classList.add('visible');
      hasError = true;
    } else {
      confirmPassError.classList.remove('visible');
    }

    if (hasError) return;

    const res = Auth.changePassword(currPass, newPass);
    if (res.success) {
      Common.showToast('Account password updated successfully!', 'success');
      passForm.reset();
    } else {
      currPassError.textContent = res.message;
      currPassError.classList.add('visible');
      Common.showToast(res.message, 'danger');
    }
  });

  // Initial load
  loadSettings();
});
