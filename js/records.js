/**
 * CareTrack - Modern Healthcare Management System
 * Health Records Controller (records.js)
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
  let attachedFileName = '';
  let attachedFileSize = '';

  // DOM Elements
  const cardsGrid = document.getElementById('records-cards-grid');
  const emptyView = document.getElementById('records-empty-view');
  const searchInput = document.getElementById('record-search-input');
  const filterPills = document.querySelectorAll('.filter-btn-pill');

  const countAll = document.getElementById('count-all');
  const countLab = document.getElementById('count-lab');

  // Modal Elements
  const recordModal = document.getElementById('record-modal');
  const recordForm = document.getElementById('record-form');
  const titleInput = document.getElementById('record-title');
  const categorySelect = document.getElementById('record-category');
  const dateInput = document.getElementById('record-date');
  const fileInput = document.getElementById('record-file');
  const notesInput = document.getElementById('record-notes');

  const btnOpenAdd = document.getElementById('btn-open-add-record');
  const btnCloseModal = document.getElementById('close-record-modal');
  const btnCancelModal = document.getElementById('btn-cancel-record');

  // View Details Modal
  const viewModal = document.getElementById('record-view-modal');
  const viewTitle = document.getElementById('view-record-title');
  const viewBody = document.getElementById('record-view-body');
  const closeViewX = document.getElementById('close-view-record-modal');
  const closeViewBtn = document.getElementById('btn-close-record-view');

  btnOpenAdd.onclick = () => openAddModal();
  btnCloseModal.onclick = () => Common.closeModal('record-modal');
  btnCancelModal.onclick = () => Common.closeModal('record-modal');
  closeViewX.onclick = () => Common.closeModal('record-view-modal');
  closeViewBtn.onclick = () => Common.closeModal('record-view-modal');

  searchInput.addEventListener('input', function () {
    searchQuery = this.value.trim().toLowerCase();
    renderRecords();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', function () {
      filterPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      renderRecords();
    });
  });

  // File input change: capture simulated file metadata
  fileInput.addEventListener('change', function () {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      attachedFileName = file.name;
      const sizeKB = Math.round(file.size / 1024);
      attachedFileSize = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    }
  });

  // Form submission
  recordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let hasError = false;

    const title = titleInput.value.trim();
    const date = dateInput.value;

    if (!title) {
      document.getElementById('record-title-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('record-title-error').classList.remove('visible');
    }

    if (!date) {
      document.getElementById('record-date-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('record-date-error').classList.remove('visible');
    }

    if (hasError) return;

    const recordData = {
      title: title,
      category: categorySelect.value,
      date: date,
      notes: notesInput.value.trim(),
      fileName: attachedFileName || `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_document.pdf`,
      fileSize: attachedFileSize || '1.1 MB'
    };

    Storage.addRecord(user.id, recordData);
    Common.showToast(`Saved record: ${title}`, 'success');

    Common.closeModal('record-modal');
    renderRecords();
  });

  function openAddModal() {
    recordForm.reset();
    dateInput.value = new Date().toISOString().split('T')[0];
    attachedFileName = '';
    attachedFileSize = '';
    Common.openModal('record-modal');
  }

  function openViewModal(record) {
    viewTitle.textContent = record.title;

    let badgeClass = 'badge-primary';
    if (record.category === 'Lab Report') badgeClass = 'badge-danger';
    if (record.category === 'Vaccination') badgeClass = 'badge-success';
    if (record.category === 'Imaging') badgeClass = 'badge-warning';

    viewBody.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
        <span class="badge ${badgeClass}" style="font-size: 0.85rem; padding: 4px 10px;">${Common.escapeHtml(record.category)}</span>
        <span style="font-size: 0.85rem; color: var(--muted-text);">📅 ${Common.formatDate(record.date)}</span>
      </div>

      <div style="background: var(--bg-main); border-radius: var(--radius-md); padding: 1.15rem; border: 1px solid var(--border-light); margin-bottom: 1.25rem;">
        <div style="font-size: 0.75rem; color: var(--muted-text); font-weight: 700; margin-bottom: 0.35rem; text-transform: uppercase;">CLINICAL SUMMARY &amp; NOTES</div>
        <div style="font-size: 0.95rem; color: var(--dark-text); line-height: 1.6;">
          ${record.notes ? Common.escapeHtml(record.notes) : 'No clinical summary notes entered for this document.'}
        </div>
      </div>

      <div style="border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 1rem; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">📄</span>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; color: var(--dark-text);">${Common.escapeHtml(record.fileName || 'document.pdf')}</div>
            <div style="font-size: 0.75rem; color: var(--muted-text);">${Common.escapeHtml(record.fileSize || '1.0 MB')} • Local Demo Attachment</div>
          </div>
        </div>
        <button type="button" class="btn btn-outline btn-sm" onclick="Common.showToast('Demo preview: Document stored locally in browser storage', 'info')">
          View Demo
        </button>
      </div>
    `;
    Common.openModal('record-view-modal');
  }

  // Render Cards
  function renderRecords() {
    const allRecords = Storage.getRecords(user.id);

    // Update filter counts
    if (countAll) countAll.textContent = allRecords.length;
    if (countLab) countLab.textContent = allRecords.filter(r => r.category === 'Lab Report').length;

    // Filter
    let filtered = allRecords.filter(r => {
      if (currentFilter !== 'all') return r.category === currentFilter;
      return true;
    });

    // Search
    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchQuery) ||
        r.category.toLowerCase().includes(searchQuery) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery))
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
      cardsGrid.innerHTML = '';
      emptyView.style.display = 'block';
      emptyView.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <h3>No Health Records Found</h3>
          <p>${searchQuery ? 'No documents matched your search query.' : 'There are no records found in this category.'}</p>
          <button type="button" class="btn btn-primary btn-sm" id="btn-empty-record">+ Add Health Record</button>
        </div>
      `;
      const emptyBtn = document.getElementById('btn-empty-record');
      if (emptyBtn) emptyBtn.onclick = openAddModal;
      return;
    }

    emptyView.style.display = 'none';

    cardsGrid.innerHTML = filtered.map(rec => {
      let badgeClass = 'badge-primary';
      if (rec.category === 'Lab Report') badgeClass = 'badge-danger';
      if (rec.category === 'Vaccination') badgeClass = 'badge-success';
      if (rec.category === 'Imaging') badgeClass = 'badge-warning';

      return `
        <div class="entity-card" data-id="${rec.id}">
          <div class="entity-card-header">
            <div>
              <span class="badge ${badgeClass}" style="margin-bottom: 0.4rem;">${Common.escapeHtml(rec.category)}</span>
              <h3 style="font-size: 1.05rem; color: var(--dark-text); line-height: 1.35;">${Common.escapeHtml(rec.title)}</h3>
            </div>
          </div>

          <div class="entity-card-body">
            <div style="font-size: 0.8rem; color: var(--muted-text); margin-bottom: 0.65rem;">
              📅 Recorded on <strong>${Common.formatDate(rec.date)}</strong>
            </div>
            <div style="font-size: 0.85rem; color: var(--body-text); line-height: 1.5; max-height: 54px; overflow: hidden; text-overflow: ellipsis;">
              ${rec.notes ? Common.escapeHtml(rec.notes) : 'No additional clinical remarks.'}
            </div>

            <div style="margin-top: 0.85rem; padding: 0.45rem 0.65rem; background: var(--bg-main); border-radius: var(--radius-sm); font-size: 0.775rem; color: var(--muted-text); display: flex; align-items: center; gap: 0.45rem;">
              <span>📎</span>
              <span style="font-weight: 600; color: var(--dark-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${Common.escapeHtml(rec.fileName || 'report.pdf')}</span>
              <span style="margin-left: auto;">(${Common.escapeHtml(rec.fileSize || '1.2 MB')})</span>
            </div>
          </div>

          <div class="entity-card-footer">
            <button type="button" class="btn btn-outline btn-sm btn-view-rec" data-id="${rec.id}">
              View Report
            </button>
            <button type="button" class="btn-icon btn-delete-rec" data-id="${rec.id}" title="Delete Record" style="color: var(--danger);">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners
    cardsGrid.querySelectorAll('.btn-view-rec').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const rec = allRecords.find(r => r.id === id);
        if (rec) openViewModal(rec);
      };
    });

    cardsGrid.querySelectorAll('.btn-delete-rec').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const rec = allRecords.find(r => r.id === id);
        if (!rec) return;

        Common.confirmDialog(
          'Delete Health Record',
          `Are you sure you want to delete "${rec.title}"?`,
          'Delete',
          () => {
            Storage.deleteRecord(user.id, id);
            Common.showToast('Record deleted', 'warning');
            renderRecords();
          }
        );
      };
    });
  }

  // Initial render
  renderRecords();
});
