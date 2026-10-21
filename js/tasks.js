/**
 * CareTrack - Modern Healthcare Management System
 * Care Tasks Controller (tasks.js)
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
  let categoryFilter = 'all';
  let searchQuery = '';

  // DOM Elements
  const tasksList = document.getElementById('tasks-full-list');
  const emptyView = document.getElementById('tasks-empty-view');
  const searchInput = document.getElementById('task-search-input');
  const catSelect = document.getElementById('task-category-filter');
  const filterPills = document.querySelectorAll('.filter-btn-pill');

  const countAll = document.getElementById('count-all');
  const countCompleted = document.getElementById('count-completed');
  const countPending = document.getElementById('count-pending');

  const statCompleted = document.getElementById('stat-completed-count');
  const statPending = document.getElementById('stat-pending-count');
  const progressDesc = document.getElementById('progress-status-desc');
  const ringCircle = document.getElementById('tasks-ring');
  const ringText = document.getElementById('ring-percent-text');

  // Modal Elements
  const taskModal = document.getElementById('task-modal');
  const taskModalTitle = document.getElementById('task-modal-title');
  const taskForm = document.getElementById('task-form');
  const taskIdInput = document.getElementById('task-id');
  const taskTitleInput = document.getElementById('task-title');
  const taskCategorySelect = document.getElementById('task-category');
  const taskTimeInput = document.getElementById('task-time');
  const taskDateInput = document.getElementById('task-date');

  const btnOpenAdd = document.getElementById('btn-open-add-task');
  const btnCloseModal = document.getElementById('close-task-modal');
  const btnCancelModal = document.getElementById('btn-cancel-task');

  btnOpenAdd.onclick = () => openAddModal();
  btnCloseModal.onclick = () => Common.closeModal('task-modal');
  btnCancelModal.onclick = () => Common.closeModal('task-modal');

  searchInput.addEventListener('input', function () {
    searchQuery = this.value.trim().toLowerCase();
    renderTasks();
  });

  catSelect.addEventListener('change', function () {
    categoryFilter = this.value;
    renderTasks();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', function () {
      filterPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      renderTasks();
    });
  });

  // Form submission
  taskForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let hasError = false;

    const title = taskTitleInput.value.trim();
    const time = taskTimeInput.value.trim();

    if (!title) {
      document.getElementById('task-title-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('task-title-error').classList.remove('visible');
    }

    if (!time) {
      document.getElementById('task-time-error').classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('task-time-error').classList.remove('visible');
    }

    if (hasError) return;

    const taskData = {
      title: title,
      category: taskCategorySelect.value,
      dueTime: time,
      dueDate: taskDateInput.value || new Date().toISOString().split('T')[0]
    };

    const editId = taskIdInput.value;
    if (editId) {
      Storage.updateTask(user.id, editId, taskData);
      Common.showToast(`Updated task: ${title}`, 'success');
    } else {
      Storage.addTask(user.id, taskData);
      Common.showToast(`Added task: ${title}`, 'success');
    }

    Common.closeModal('task-modal');
    renderTasks();
  });

  function openAddModal() {
    taskForm.reset();
    taskIdInput.value = '';
    taskModalTitle.textContent = 'Add Care Task';
    taskDateInput.value = new Date().toISOString().split('T')[0];
    taskTimeInput.value = '08:00 AM';
    taskCategorySelect.value = 'Wellness';
    Common.openModal('task-modal');
  }

  function openEditModal(task) {
    taskIdInput.value = task.id;
    taskModalTitle.textContent = 'Edit Care Task';
    taskTitleInput.value = task.title;
    taskCategorySelect.value = task.category;
    taskTimeInput.value = task.dueTime;
    taskDateInput.value = task.dueDate || new Date().toISOString().split('T')[0];
    Common.openModal('task-modal');
  }

  // Update SVG Progress Ring
  function updateProgressRing(completed, total) {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const circumference = 264; // 2 * PI * 42
    const offset = circumference - (percent / 100) * circumference;

    if (ringCircle) {
      ringCircle.style.strokeDashoffset = offset;
    }
    if (ringText) {
      ringText.textContent = `${percent}%`;
    }
    if (progressDesc) {
      progressDesc.textContent = `Completed ${completed} of ${total} care tasks for today.`;
    }
    if (statCompleted) statCompleted.textContent = completed;
    if (statPending) statPending.textContent = total - completed;
  }

  // Render Tasks
  function renderTasks() {
    const allTasks = Storage.getTasks(user.id);
    const todayStr = new Date().toISOString().split('T')[0];

    // Filter counters
    const completedAll = allTasks.filter(t => t.completed);
    const pendingAll = allTasks.filter(t => !t.completed);

    if (countAll) countAll.textContent = allTasks.length;
    if (countCompleted) countCompleted.textContent = completedAll.length;
    if (countPending) countPending.textContent = pendingAll.length;

    // Update Progress Ring with overall or today's tasks
    updateProgressRing(completedAll.length, allTasks.length);

    // Apply Filter
    let filtered = allTasks.filter(t => {
      if (currentFilter === 'today') return t.dueDate === todayStr;
      if (currentFilter === 'completed') return t.completed;
      if (currentFilter === 'pending') return !t.completed;
      return true;
    });

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery) ||
        t.category.toLowerCase().includes(searchQuery)
      );
    }

    if (filtered.length === 0) {
      tasksList.innerHTML = '';
      emptyView.style.display = 'block';
      emptyView.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No Care Tasks Found</h3>
          <p>${searchQuery ? 'No tasks matched your search query.' : 'You have no care tasks in this view.'}</p>
          <button type="button" class="btn btn-primary btn-sm" id="btn-empty-task">+ Add Care Task</button>
        </div>
      `;
      const emptyBtn = document.getElementById('btn-empty-task');
      if (emptyBtn) emptyBtn.onclick = openAddModal;
      return;
    }

    emptyView.style.display = 'none';

    tasksList.innerHTML = filtered.map(task => {
      const isDone = task.completed;
      let badgeClass = 'badge-primary';
      if (task.category === 'Health') badgeClass = 'badge-danger';
      if (task.category === 'Fitness') badgeClass = 'badge-success';
      if (task.category === 'Medication') badgeClass = 'badge-warning';

      return `
        <div class="task-item ${isDone ? 'completed' : ''}" data-id="${task.id}" style="padding: 1rem; border-radius: var(--radius-md);">
          <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${isDone ? 'checked' : ''} style="width: 22px; height: 22px;">
          <div class="task-item-content">
            <div class="task-title" style="font-size: 1rem;">${Common.escapeHtml(task.title)}</div>
            <div class="task-time" style="margin-top: 0.2rem;">
              ⏰ Due: ${Common.escapeHtml(task.dueTime)} • 
              📅 ${Common.formatDate(task.dueDate)} • 
              <span class="badge ${badgeClass}" style="padding: 1px 7px;">${Common.escapeHtml(task.category)}</span>
            </div>
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn-icon btn-edit-task" data-id="${task.id}" title="Edit Task">
              ✏️
            </button>
            <button type="button" class="btn-icon btn-delete-task" data-id="${task.id}" title="Delete Task" style="color: var(--danger);">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners
    tasksList.querySelectorAll('.task-checkbox').forEach(chk => {
      chk.onchange = function () {
        const id = this.getAttribute('data-id');
        const updated = Storage.toggleTask(user.id, id);
        if (updated) {
          Common.showToast(`Task ${updated.completed ? 'completed!' : 'marked pending'}`, updated.completed ? 'success' : 'info');
          renderTasks();
        }
      };
    });

    tasksList.querySelectorAll('.btn-edit-task').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const task = allTasks.find(t => t.id === id);
        if (task) openEditModal(task);
      };
    });

    tasksList.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const task = allTasks.find(t => t.id === id);
        if (!task) return;

        Common.confirmDialog(
          'Delete Task',
          `Are you sure you want to delete "${task.title}"?`,
          'Delete',
          () => {
            Storage.deleteTask(user.id, id);
            Common.showToast('Task removed', 'warning');
            renderTasks();
          }
        );
      };
    });
  }

  // Initial render
  renderTasks();
});
