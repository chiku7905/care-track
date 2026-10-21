/**
 * CareTrack - Modern Healthcare Management System
 * Appointments Controller (appointments.js)
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  if (!Auth.requireAuth()) return;
  const user = Auth.getCurrentUser();
  if (!user) return;

  Common.initHeaderAndSidebar();

  // Setup Logout
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      Common.confirmDialog('Log Out', 'Are you sure you want to log out?', 'Log Out', () => Auth.logout());
    };
  }

  // State
  let currentFilter = 'all';
  let searchQuery = '';

  // DOM Elements
  const cardsGrid = document.getElementById('apts-cards-grid');
  const emptyView = document.getElementById('apts-empty-view');
  const searchInput = document.getElementById('apt-search-input');
  const filterPills = document.querySelectorAll('.filter-btn-pill');

  const countAll = document.getElementById('count-all');
  const countUpcoming = document.getElementById('count-upcoming');
  const countCompleted = document.getElementById('count-completed');
  const countCancelled = document.getElementById('count-cancelled');

  // Modal Elements
  const aptModal = document.getElementById('appointment-modal');
  const aptModalTitle = document.getElementById('apt-modal-title');
  const aptForm = document.getElementById('apt-form');
  const aptIdInput = document.getElementById('apt-id');
  const aptDoctorInput = document.getElementById('apt-doctor');
  const aptSpecialtyInput = document.getElementById('apt-specialty');
  const aptDateInput = document.getElementById('apt-date');
  const aptTimeInput = document.getElementById('apt-time');
  const aptLocationInput = document.getElementById('apt-location');
  const aptStatusSelect = document.getElementById('apt-status');
  const aptNotesInput = document.getElementById('apt-notes');

  const btnOpenAdd = document.getElementById('btn-open-add-apt');
  const btnCloseModal = document.getElementById('close-apt-modal');
  const btnCancelModal = document.getElementById('btn-cancel-apt');

  // Details Modal Elements
  const detailsModal = document.getElementById('apt-details-modal');
  const detailsBody = document.getElementById('apt-details-body');
  const closeDetailsX = document.getElementById('close-details-modal');
  const closeDetailsBtn = document.getElementById('btn-close-details');

  btnOpenAdd.onclick = () => openAddModal();
  btnCloseModal.onclick = () => Common.closeModal('appointment-modal');
  btnCancelModal.onclick = () => Common.closeModal('appointment-modal');
  closeDetailsX.onclick = () => Common.closeModal('apt-details-modal');
  closeDetailsBtn.onclick = () => Common.closeModal('apt-details-modal');

  searchInput.addEventListener('input', function () {
    searchQuery = this.value.trim().toLowerCase();
    renderAppointments();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', function () {
      filterPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      renderAppointments();
    });
  });

  // Form submission (Add or Edit)
  aptForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let hasError = false;

    const doctor = aptDoctorInput.value.trim();
    const specialty = aptSpecialtyInput.value.trim();
    const date = aptDateInput.value;
    const time = aptTimeInput.value.trim();
    const location = aptLocationInput.value.trim();

    if (!doctor) {
      document.getElementById('apt-doctor-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('apt-doctor-error').classList.remove('visible');
    }

    if (!specialty) {
      document.getElementById('apt-specialty-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('apt-specialty-error').classList.remove('visible');
    }

    if (!date) {
      document.getElementById('apt-date-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('apt-date-error').classList.remove('visible');
    }

    if (!time) {
      document.getElementById('apt-time-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('apt-time-error').classList.remove('visible');
    }

    if (!location) {
      document.getElementById('apt-location-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('apt-location-error').classList.remove('visible');
    }

    if (hasError) return;

    const aptData = {
      doctorName: doctor,
      specialty: specialty,
      date: date,
      time: time,
      location: location,
      status: aptStatusSelect.value,
      notes: aptNotesInput.value.trim()
    };

    const editId = aptIdInput.value;
    if (editId) {
      Storage.updateAppointment(user.id, editId, aptData);
      Common.showToast(`Updated appointment with ${doctor}`, 'success');
    } else {
      Storage.addAppointment(user.id, aptData);
      Common.showToast(`Scheduled appointment with ${doctor}`, 'success');
    }

    Common.closeModal('appointment-modal');
    renderAppointments();
  });

  function openAddModal() {
    aptForm.reset();
    aptIdInput.value = '';
    aptModalTitle.textContent = 'Schedule Doctor Appointment';
    // default date tomorrow
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    aptDateInput.value = tomorrow;
    aptTimeInput.value = '10:00 AM';
    aptStatusSelect.value = 'Upcoming';
    Common.openModal('appointment-modal');
  }

  function openEditModal(apt) {
    aptIdInput.value = apt.id;
    aptModalTitle.textContent = 'Edit Appointment';
    aptDoctorInput.value = apt.doctorName;
    aptSpecialtyInput.value = apt.specialty;
    aptDateInput.value = apt.date;
    aptTimeInput.value = apt.time;
    aptLocationInput.value = apt.location;
    aptStatusSelect.value = apt.status;
    aptNotesInput.value = apt.notes || '';
    Common.openModal('appointment-modal');
  }

  function openDetailsModal(apt) {
    let badgeClass = 'badge-primary';
    if (apt.status === 'Completed') badgeClass = 'badge-success';
    if (apt.status === 'Cancelled') badgeClass = 'badge-danger';

    detailsBody.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.25rem;">
        <div class="doc-avatar" style="width: 58px; height: 58px; margin: 0 auto 0.75rem; font-size: 1.35rem;">
          ${Common.escapeHtml(apt.doctorName.replace('Dr. ', '').substring(0, 2).toUpperCase())}
        </div>
        <h3 style="color: var(--dark-text); margin-bottom: 0.25rem;">${Common.escapeHtml(apt.doctorName)}</h3>
        <div style="color: var(--primary); font-weight: 600; font-size: 0.95rem;">${Common.escapeHtml(apt.specialty)}</div>
        <span class="badge ${badgeClass}" style="margin-top: 0.5rem;">${Common.escapeHtml(apt.status)}</span>
      </div>

      <div style="background: var(--bg-main); border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--border-light); margin-bottom: 1rem;">
        <div style="margin-bottom: 0.75rem;">
          <div style="font-size: 0.75rem; color: var(--muted-text); font-weight: 700; text-transform: uppercase;">DATE & TIME</div>
          <div style="font-size: 0.95rem; font-weight: 600; color: var(--dark-text);">📅 ${Common.formatDate(apt.date)} at ${Common.escapeHtml(apt.time)}</div>
        </div>
        <div style="margin-bottom: 0.75rem;">
          <div style="font-size: 0.75rem; color: var(--muted-text); font-weight: 700; text-transform: uppercase;">LOCATION</div>
          <div style="font-size: 0.95rem; color: var(--dark-text);">📍 ${Common.escapeHtml(apt.location)}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--muted-text); font-weight: 700; text-transform: uppercase;">NOTES &amp; PREPARATION</div>
          <div style="font-size: 0.9rem; color: var(--body-text);">${apt.notes ? Common.escapeHtml(apt.notes) : 'No special preparation notes provided.'}</div>
        </div>
      </div>
    `;
    Common.openModal('apt-details-modal');
  }

  // Render Cards Grid
  function renderAppointments() {
    const allApts = Storage.getAppointments(user.id);

    // Update counts
    if (countAll) countAll.textContent = allApts.length;
    if (countUpcoming) countUpcoming.textContent = allApts.filter(a => a.status === 'Upcoming').length;
    if (countCompleted) countCompleted.textContent = allApts.filter(a => a.status === 'Completed').length;
    if (countCancelled) countCancelled.textContent = allApts.filter(a => a.status === 'Cancelled').length;

    // Filter
    let filtered = allApts.filter(a => {
      if (currentFilter === 'upcoming') return a.status === 'Upcoming';
      if (currentFilter === 'completed') return a.status === 'Completed';
      if (currentFilter === 'cancelled') return a.status === 'Cancelled';
      return true;
    });

    // Search
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.doctorName.toLowerCase().includes(searchQuery) ||
        a.specialty.toLowerCase().includes(searchQuery) ||
        a.location.toLowerCase().includes(searchQuery) ||
        (a.notes && a.notes.toLowerCase().includes(searchQuery))
      );
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filtered.length === 0) {
      cardsGrid.innerHTML = '';
      emptyView.style.display = 'block';
      emptyView.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🩺</div>
          <h3>No Appointments Found</h3>
          <p>${searchQuery ? 'No appointments matched your search.' : 'You have no appointments recorded in this filter view.'}</p>
          <button type="button" class="btn btn-primary btn-sm" id="btn-empty-apt">+ Schedule Appointment</button>
        </div>
      `;
      const emptyBtn = document.getElementById('btn-empty-apt');
      if (emptyBtn) emptyBtn.onclick = openAddModal;
      return;
    }

    emptyView.style.display = 'none';

    cardsGrid.innerHTML = filtered.map(apt => {
      let badgeClass = 'badge-primary';
      if (apt.status === 'Completed') badgeClass = 'badge-success';
      if (apt.status === 'Cancelled') badgeClass = 'badge-danger';

      return `
        <div class="entity-card" data-id="${apt.id}">
          <div class="entity-card-header">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="doc-avatar">
                ${Common.escapeHtml(apt.doctorName.replace('Dr. ', '').substring(0, 2).toUpperCase())}
              </div>
              <div>
                <h3 style="font-size: 1.05rem; color: var(--dark-text); margin-bottom: 0.15rem;">${Common.escapeHtml(apt.doctorName)}</h3>
                <div style="font-size: 0.8rem; color: var(--primary); font-weight: 600;">${Common.escapeHtml(apt.specialty)}</div>
              </div>
            </div>
            <span class="badge ${badgeClass}">${Common.escapeHtml(apt.status)}</span>
          </div>

          <div class="entity-card-body">
            <div class="appointment-meta-list" style="margin-top: 0.5rem;">
              <div class="appointment-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <strong>${Common.formatDate(apt.date)}</strong> at ${Common.escapeHtml(apt.time)}
              </div>
              <div class="appointment-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>${Common.escapeHtml(apt.location)}</span>
              </div>
              ${apt.notes ? `
                <div class="appointment-meta-item" style="color: var(--muted-text); font-size: 0.8rem;">
                  <span>📝 ${Common.escapeHtml(apt.notes)}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="entity-card-footer">
            <button type="button" class="btn btn-outline btn-sm btn-view-apt" data-id="${apt.id}">
              View Details
            </button>
            <div style="display: flex; gap: 0.4rem;">
              ${apt.status === 'Upcoming' ? `
                <button type="button" class="btn btn-sm btn-outline btn-cancel-apt" data-id="${apt.id}" title="Cancel Consultation" style="color: var(--warning); border-color: var(--warning);">
                  Cancel
                </button>
              ` : ''}
              <button type="button" class="btn-icon btn-edit-apt" data-id="${apt.id}" title="Edit Appointment">
                ✏️
              </button>
              <button type="button" class="btn-icon btn-delete-apt" data-id="${apt.id}" title="Delete Record" style="color: var(--danger);">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach card event listeners
    cardsGrid.querySelectorAll('.btn-view-apt').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const apt = allApts.find(a => a.id === id);
        if (apt) openDetailsModal(apt);
      };
    });

    cardsGrid.querySelectorAll('.btn-edit-apt').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const apt = allApts.find(a => a.id === id);
        if (apt) openEditModal(apt);
      };
    });

    cardsGrid.querySelectorAll('.btn-cancel-apt').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const apt = allApts.find(a => a.id === id);
        if (!apt) return;

        Common.confirmDialog(
          'Cancel Appointment',
          `Are you sure you want to cancel your consultation with ${apt.doctorName}?`,
          'Yes, Cancel',
          () => {
            Storage.cancelAppointment(user.id, id);
            Common.showToast(`Appointment cancelled`, 'info');
            renderAppointments();
          }
        );
      };
    });

    cardsGrid.querySelectorAll('.btn-delete-apt').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const apt = allApts.find(a => a.id === id);
        if (!apt) return;

        Common.confirmDialog(
          'Delete Appointment Record',
          `Are you sure you want to completely remove this appointment record?`,
          'Delete',
          () => {
            Storage.deleteAppointment(user.id, id);
            Common.showToast(`Appointment removed`, 'warning');
            renderAppointments();
          }
        );
      };
    });
  }

  // Initial render
  renderAppointments();
});
