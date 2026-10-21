/**
 * CareTrack - Modern Healthcare Management System
 * User Profile Controller (profile.js)
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  if (!Auth.requireAuth()) return;
  let user = Auth.getCurrentUser();
  if (!user) return;

  Common.initHeaderAndSidebar();

  // Setup Logout
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      Common.confirmDialog('Log Out', 'Are you sure you want to log out?', 'Log Out', () => Auth.logout());
    };
  }

  // Display Elements
  const bigAvatar = document.getElementById('profile-big-avatar');
  const dispName = document.getElementById('profile-display-name');
  const dispRole = document.getElementById('profile-display-role');
  const dispEmail = document.getElementById('profile-display-email');
  const dispPhone = document.getElementById('profile-display-phone');

  const statMeds = document.getElementById('stat-meds-total');
  const statTasks = document.getElementById('stat-tasks-total');
  const statRecords = document.getElementById('stat-records-total');

  const metaId = document.getElementById('meta-user-id');
  const metaCreated = document.getElementById('meta-created-at');

  // Form Elements
  const form = document.getElementById('profile-edit-form');
  const inputName = document.getElementById('edit-name');
  const inputEmail = document.getElementById('edit-email');
  const inputPhone = document.getElementById('edit-phone');
  const inputRole = document.getElementById('edit-role');

  function renderProfile() {
    user = Auth.getCurrentUser();
    if (!user) return;

    bigAvatar.textContent = user.initials || 'CT';
    dispName.textContent = user.name;
    dispRole.textContent = user.role || 'Member';
    dispEmail.textContent = user.email;
    dispPhone.textContent = user.phone || 'N/A';

    inputName.value = user.name;
    inputEmail.value = user.email;
    inputPhone.value = user.phone || '';
    inputRole.value = user.role || '';

    if (metaId) metaId.textContent = user.id;
    if (metaCreated) metaCreated.textContent = Common.formatDate(user.createdAt || '2026-01-15');

    // Aggregate statistics
    const meds = Storage.getMedicines(user.id);
    const tasks = Storage.getTasks(user.id);
    const records = Storage.getRecords(user.id);

    if (statMeds) statMeds.textContent = meds.length;
    if (statTasks) statTasks.textContent = tasks.length;
    if (statRecords) statRecords.textContent = records.length;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let hasError = false;

    const name = inputName.value.trim();
    const email = inputEmail.value.trim();
    const phone = inputPhone.value.trim();
    const role = inputRole.value.trim();

    if (!name || name.length < 2) {
      document.getElementById('edit-name-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('edit-name-error').classList.remove('visible');
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      document.getElementById('edit-email-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('edit-email-error').classList.remove('visible');
    }

    if (!phone || phone.length < 7) {
      document.getElementById('edit-phone-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('edit-phone-error').classList.remove('visible');
    }

    if (hasError) return;

    const res = Auth.updateProfile({
      name: name,
      email: email,
      phone: phone,
      role: role
    });

    if (res.success) {
      Common.showToast('Profile updated successfully!', 'success');
      Common.initHeaderAndSidebar();
      renderProfile();
    } else {
      Common.showToast(res.message || 'Error updating profile', 'danger');
    }
  });

  // Initial render
  renderProfile();
});
