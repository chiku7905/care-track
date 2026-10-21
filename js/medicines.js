/**
 * CareTrack - Modern Healthcare Management System
 * Medicines Management Controller (medicines.js)
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
  let currentSort = 'name-asc';

  // DOM Elements
  const tableBody = document.getElementById('meds-table-body');
  const emptyView = document.getElementById('meds-empty-view');
  const searchInput = document.getElementById('med-search-input');
  const sortSelect = document.getElementById('med-sort-select');
  const filterPills = document.querySelectorAll('.filter-btn-pill');

  const countAll = document.getElementById('count-all');
  const countActive = document.getElementById('count-active');
  const countCompleted = document.getElementById('count-completed');

  // Modal Elements
  const medModal = document.getElementById('medicine-modal');
  const medModalTitle = document.getElementById('med-modal-title');
  const medForm = document.getElementById('med-form');
  const medIdInput = document.getElementById('med-id');
  const medNameInput = document.getElementById('med-name');
  const medDosageInput = document.getElementById('med-dosage');
  const medFreqSelect = document.getElementById('med-frequency');
  const medTimeInput = document.getElementById('med-time');
  const medStatusSelect = document.getElementById('med-status');
  const medStartDate = document.getElementById('med-start-date');
  const medEndDate = document.getElementById('med-end-date');
  const medInstructions = document.getElementById('med-instructions');
  const medReminder = document.getElementById('med-reminder');

  const btnOpenAdd = document.getElementById('btn-open-add-med');
  const btnCloseModal = document.getElementById('close-med-modal');
  const btnCancelModal = document.getElementById('btn-cancel-med');

  // Check URL query param for global search integration
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam) {
    searchQuery = searchParam.trim();
    searchInput.value = searchQuery;
  }

  // Event Listeners
  btnOpenAdd.onclick = () => openAddModal();
  btnCloseModal.onclick = () => Common.closeModal('medicine-modal');
  btnCancelModal.onclick = () => Common.closeModal('medicine-modal');

  searchInput.addEventListener('input', function () {
    searchQuery = this.value.trim().toLowerCase();
    renderMedicines();
  });

  sortSelect.addEventListener('change', function () {
    currentSort = this.value;
    renderMedicines();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', function () {
      filterPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      renderMedicines();
    });
  });

  // Form submission (Add or Edit)
  medForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let hasError = false;

    const name = medNameInput.value.trim();
    const dosage = medDosageInput.value.trim();
    const time = medTimeInput.value.trim();

    if (!name) {
      document.getElementById('med-name-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('med-name-error').classList.remove('visible');
    }

    if (!dosage) {
      document.getElementById('med-dosage-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('med-dosage-error').classList.remove('visible');
    }

    if (!time) {
      document.getElementById('med-time-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('med-time-error').classList.remove('visible');
    }

    if (hasError) return;

    const medData = {
      name: name,
      dosage: dosage,
      frequency: medFreqSelect.value,
      time: time,
      status: medStatusSelect.value,
      startDate: medStartDate.value || new Date().toISOString().split('T')[0],
      endDate: medEndDate.value || '',
      instructions: medInstructions.value.trim(),
      reminder: medReminder.checked
    };

    const editId = medIdInput.value;
    if (editId) {
      Storage.updateMedicine(user.id, editId, medData);
      Common.showToast(`Updated ${name} prescription`, 'success');
    } else {
      Storage.addMedicine(user.id, medData);
      Common.showToast(`Added ${name} to medicines list`, 'success');
    }

    Common.closeModal('medicine-modal');
    renderMedicines();
  });

  // Modal open helper
  function openAddModal() {
    medForm.reset();
    medIdInput.value = '';
    medModalTitle.textContent = 'Add New Medicine';
    medStartDate.value = new Date().toISOString().split('T')[0];
    medReminder.checked = true;
    Common.openModal('medicine-modal');
  }

  function openEditModal(med) {
    medIdInput.value = med.id;
    medModalTitle.textContent = 'Edit Medicine Prescription';
    medNameInput.value = med.name;
    medDosageInput.value = med.dosage;
    medFreqSelect.value = med.frequency;
    medTimeInput.value = med.time;
    medStatusSelect.value = med.status;
    medStartDate.value = med.startDate || '';
    medEndDate.value = med.endDate || '';
    medInstructions.value = med.instructions || '';
    medReminder.checked = !!med.reminder;
    Common.openModal('medicine-modal');
  }

  // Render Table
  function renderMedicines() {
    const allMeds = Storage.getMedicines(user.id);

    // Update filter counters
    if (countAll) countAll.textContent = allMeds.length;
    if (countActive) countActive.textContent = allMeds.filter(m => m.status === 'Active').length;
    if (countCompleted) countCompleted.textContent = allMeds.filter(m => m.status === 'Completed').length;

    // Filter by Status
    let filtered = allMeds.filter(m => {
      if (currentFilter === 'active') return m.status === 'Active';
      if (currentFilter === 'completed') return m.status === 'Completed';
      return true;
    });

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchQuery) ||
        m.dosage.toLowerCase().includes(searchQuery) ||
        (m.instructions && m.instructions.toLowerCase().includes(searchQuery))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (currentSort === 'name-asc') return a.name.localeCompare(b.name);
      if (currentSort === 'name-desc') return b.name.localeCompare(a.name);
      if (currentSort === 'status') return a.status.localeCompare(b.status);
      if (currentSort === 'time') return a.time.localeCompare(b.time);
      return 0;
    });

    // Empty state check
    if (filtered.length === 0) {
      tableBody.innerHTML = '';
      emptyView.style.display = 'block';
      emptyView.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💊</div>
          <h3>No Medicines Found</h3>
          <p>${searchQuery ? 'No prescriptions matched your search query.' : 'There are currently no medicines recorded in this view.'}</p>
          <button type="button" class="btn btn-primary btn-sm" id="btn-empty-add">+ Add Medicine</button>
        </div>
      `;
      const emptyAdd = document.getElementById('btn-empty-add');
      if (emptyAdd) emptyAdd.onclick = openAddModal;
      return;
    }

    emptyView.style.display = 'none';

    tableBody.innerHTML = filtered.map(med => {
      const isActive = med.status === 'Active';
      const isTaken = med.takenToday;

      return `
        <tr data-id="${med.id}">
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="med-icon-pill" style="width: 36px; height: 36px; background-color: ${isTaken ? 'var(--success-bg)' : 'var(--primary-light)'}; color: ${isTaken ? 'var(--success)' : 'var(--primary)'};">
                ${isTaken ? '✓' : '💊'}
              </div>
              <div>
                <strong style="color: var(--dark-text); font-size: 0.95rem;">${Common.escapeHtml(med.name)}</strong>
                <div style="font-size: 0.8rem; color: var(--muted-text);">${Common.escapeHtml(med.dosage)}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge badge-neutral">${Common.escapeHtml(med.frequency)}</span>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--dark-text);">⏰ ${Common.escapeHtml(med.time)}</div>
            ${med.instructions ? `<div style="font-size: 0.75rem; color: var(--muted-text); max-width: 220px;">${Common.escapeHtml(med.instructions)}</div>` : ''}
          </td>
          <td>
            <div style="font-size: 0.825rem; color: var(--body-text);">
              ${Common.formatDate(med.startDate)} ${med.endDate ? `&rarr; ${Common.formatDate(med.endDate)}` : ''}
            </div>
          </td>
          <td>
            <span class="badge ${isActive ? (isTaken ? 'badge-success' : 'badge-warning') : 'badge-neutral'}">
              ${isActive ? (isTaken ? 'Taken Today' : 'Pending') : 'Completed'}
            </span>
          </td>
          <td>
            <label class="switch" title="Toggle Daily Reminder">
              <input type="checkbox" class="toggle-reminder" data-id="${med.id}" ${med.reminder ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            ${isActive ? `
              <button type="button" class="btn btn-sm ${isTaken ? 'btn-outline' : 'btn-success'} btn-take-med" data-id="${med.id}" style="margin-right: 0.35rem;">
                ${isTaken ? 'Undo' : 'Mark Taken'}
              </button>
            ` : ''}
            <button type="button" class="btn-icon btn-edit-med" data-id="${med.id}" title="Edit Medicine">
              ✏️
            </button>
            <button type="button" class="btn-icon btn-delete-med" data-id="${med.id}" title="Delete Medicine" style="color: var(--danger);">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Row Action Listeners
    tableBody.querySelectorAll('.btn-take-med').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const updated = Storage.toggleMedicineTaken(user.id, id);
        if (updated) {
          Common.showToast(`${updated.name} marked ${updated.takenToday ? 'Taken' : 'Upcoming'}`, updated.takenToday ? 'success' : 'info');
          renderMedicines();
        }
      };
    });

    tableBody.querySelectorAll('.toggle-reminder').forEach(chk => {
      chk.onchange = function () {
        const id = this.getAttribute('data-id');
        Storage.updateMedicine(user.id, id, { reminder: this.checked });
        Common.showToast(`Reminder ${this.checked ? 'enabled' : 'disabled'}`, 'info');
      };
    });

    tableBody.querySelectorAll('.btn-edit-med').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const med = allMeds.find(m => m.id === id);
        if (med) openEditModal(med);
      };
    });

    tableBody.querySelectorAll('.btn-delete-med').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const med = allMeds.find(m => m.id === id);
        if (!med) return;

        Common.confirmDialog(
          'Delete Medicine',
          `Are you sure you want to remove ${med.name} from your medicines list?`,
          'Delete',
          () => {
            Storage.deleteMedicine(user.id, id);
            Common.showToast(`Deleted ${med.name}`, 'warning');
            renderMedicines();
          }
        );
      };
    });
  }

  // Initial render
  renderMedicines();
});
