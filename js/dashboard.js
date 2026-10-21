/**
 * CareTrack - Modern Healthcare Management System
 * Dashboard Controller (dashboard.js)
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Protect page
  if (!Auth.requireAuth()) return;

  const user = Auth.getCurrentUser();
  if (!user) return;

  // Initialize shared layout elements
  Common.initHeaderAndSidebar();

  // Setup Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.onclick = function () {
      Common.confirmDialog(
        'Confirm Log Out',
        'Are you sure you want to end your current session?',
        'Log Out',
        () => Auth.logout()
      );
    };
  }

  // Set greeting with user name and time of day
  setupGreeting(user.name);

  // Load and render all dashboard data
  refreshDashboard();

  // Setup healthcare quotes rotation
  setupQuotes();

  // ----------------------------------------------------
  // GREETING
  // ----------------------------------------------------
  function setupGreeting(name) {
    const greetingTitle = document.getElementById('greeting-title');
    const greetingSubtitle = document.getElementById('greeting-subtitle');
    const now = new Date();
    const hour = now.getHours();

    let timeGreeting = 'Good Morning';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good Afternoon';
    } else if (hour >= 17) {
      timeGreeting = 'Good Evening';
    }

    if (greetingTitle) {
      greetingTitle.textContent = `${timeGreeting}, ${name.split(' ')[0]}`;
    }

    if (greetingSubtitle) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const dateString = now.toLocaleDateString('en-US', options);
      greetingSubtitle.textContent = `Today is ${dateString} • Your health overview is up to date.`;
    }
  }

  // ----------------------------------------------------
  // REFRESH DASHBOARD METRICS & WIDGETS
  // ----------------------------------------------------
  function refreshDashboard() {
    const medicines = Storage.getMedicines(user.id);
    const appointments = Storage.getAppointments(user.id);
    const tasks = Storage.getTasks(user.id);
    const emergency = Storage.getEmergencyInfo(user.id);

    // Filter active items
    const activeMeds = medicines.filter(m => m.status === 'Active');
    const takenMeds = activeMeds.filter(m => m.takenToday);

    const upcomingApts = appointments.filter(a => a.status === 'Upcoming');
    
    // Sort upcoming appointments by date & time
    upcomingApts.sort((a, b) => new Date(`${a.date}T${convertTo24(a.time)}`) - new Date(`${b.date}T${convertTo24(b.time)}`));

    const completedTasks = tasks.filter(t => t.completed);

    // Update Sidebar Badges
    const medBadge = document.getElementById('sidebar-meds-badge');
    if (medBadge) medBadge.textContent = activeMeds.length;

    const aptBadge = document.getElementById('sidebar-apts-badge');
    if (aptBadge) aptBadge.textContent = upcomingApts.length;

    // 1. Update KPI Summary Cards
    // KPI 1: Medicines
    const kpiMedsValue = document.getElementById('kpi-meds-value');
    const kpiMedsSubtext = document.getElementById('kpi-meds-subtext');
    if (kpiMedsValue) {
      kpiMedsValue.textContent = `${takenMeds.length} / ${activeMeds.length}`;
    }
    if (kpiMedsSubtext) {
      const remaining = activeMeds.length - takenMeds.length;
      kpiMedsSubtext.textContent = remaining > 0 ? `${remaining} dose${remaining > 1 ? 's' : ''} remaining` : 'All doses completed!';
    }

    // KPI 2: Appointments
    const kpiAptsValue = document.getElementById('kpi-apts-value');
    const kpiAptsSubtext = document.getElementById('kpi-apts-subtext');
    if (kpiAptsValue) {
      kpiAptsValue.textContent = upcomingApts.length;
    }
    if (kpiAptsSubtext) {
      kpiAptsSubtext.textContent = upcomingApts.length > 0 ? `Next: ${Common.formatDate(upcomingApts[0].date)}` : 'No upcoming visits';
    }

    // KPI 3: Care Tasks
    const kpiTasksValue = document.getElementById('kpi-tasks-value');
    const kpiTasksSubtext = document.getElementById('kpi-tasks-subtext');
    if (kpiTasksValue) {
      kpiTasksValue.textContent = `${completedTasks.length} / ${tasks.length}`;
    }
    if (kpiTasksSubtext) {
      const remainingTasks = tasks.length - completedTasks.length;
      kpiTasksSubtext.textContent = remainingTasks > 0 ? `${remainingTasks} task${remainingTasks > 1 ? 's' : ''} left` : 'All care tasks done!';
    }

    // KPI 4: Completion Rate
    const kpiRateValue = document.getElementById('kpi-rate-value');
    let totalItems = activeMeds.length + tasks.length;
    let finishedItems = takenMeds.length + completedTasks.length;
    let rate = totalItems > 0 ? Math.round((finishedItems / totalItems) * 100) : 100;
    if (kpiRateValue) {
      kpiRateValue.textContent = `${rate}%`;
    }

    // 2. Render Today's Medicines Widget
    renderTodayMedicines(activeMeds);

    // 3. Render Daily Care Tasks
    renderTasksList(tasks);

    // 4. Render Weekly Activity Chart
    renderWeeklyChart();

    // 5. Render Next Upcoming Appointment
    renderUpcomingAppointment(upcomingApts[0]);

    // 6. Render Emergency Contacts
    renderEmergencyWidget(emergency);
  }

  // ----------------------------------------------------
  // MEDICINES WIDGET
  // ----------------------------------------------------
  function renderTodayMedicines(meds) {
    const container = document.getElementById('dashboard-meds-list');
    if (!container) return;

    if (meds.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <div class="empty-state-icon">💊</div>
          <h3>No Active Medicines</h3>
          <p>You have no active prescriptions scheduled for today.</p>
          <a href="medicines.html" class="btn btn-primary btn-sm">+ Add Medicine</a>
        </div>
      `;
      return;
    }

    container.innerHTML = meds.map(med => {
      const isTaken = med.takenToday;
      return `
        <div class="med-item-row" data-id="${med.id}">
          <div class="med-meta">
            <div class="med-icon-pill" style="background-color: ${isTaken ? 'var(--success-bg)' : 'var(--primary-light)'}; color: ${isTaken ? 'var(--success)' : 'var(--primary)'};">
              ${isTaken ? '✓' : '💊'}
            </div>
            <div>
              <div class="med-name">${Common.escapeHtml(med.name)} <span style="font-weight: normal; color: var(--muted-text); font-size: 0.825rem;">(${Common.escapeHtml(med.dosage)})</span></div>
              <div class="med-details">⏰ ${Common.escapeHtml(med.time)} • ${Common.escapeHtml(med.instructions || med.frequency)}</div>
            </div>
          </div>
          <div class="med-actions">
            <span class="badge ${isTaken ? 'badge-success' : 'badge-warning'}">
              ${isTaken ? 'Taken' : 'Upcoming'}
            </span>
            <button type="button" class="btn btn-sm ${isTaken ? 'btn-outline' : 'btn-primary'} btn-toggle-med" data-id="${med.id}">
              ${isTaken ? 'Undo' : 'Mark Taken'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach toggle listeners
    container.querySelectorAll('.btn-toggle-med').forEach(btn => {
      btn.onclick = function () {
        const medId = this.getAttribute('data-id');
        const updated = Storage.toggleMedicineTaken(user.id, medId);
        if (updated) {
          Common.showToast(`${updated.name} marked as ${updated.takenToday ? 'Taken' : 'Upcoming'}`, updated.takenToday ? 'success' : 'info');
          refreshDashboard();
        }
      };
    });
  }

  // ----------------------------------------------------
  // DAILY CARE TASKS CHECKLIST
  // ----------------------------------------------------
  function renderTasksList(tasks) {
    const container = document.getElementById('dashboard-tasks-list');
    if (!container) return;

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem 1rem;">
          <p>No care tasks set for today.</p>
          <a href="tasks.html" class="btn btn-sm btn-outline">+ Add Daily Task</a>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks.slice(0, 5).map(task => {
      const isDone = task.completed;
      let badgeClass = 'badge-primary';
      if (task.category === 'Health') badgeClass = 'badge-danger';
      if (task.category === 'Fitness') badgeClass = 'badge-success';
      if (task.category === 'Medication') badgeClass = 'badge-warning';

      return `
        <div class="task-item ${isDone ? 'completed' : ''}" data-id="${task.id}">
          <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${isDone ? 'checked' : ''} aria-label="Mark task done">
          <div class="task-item-content">
            <div class="task-title">${Common.escapeHtml(task.title)}</div>
            <div class="task-time">⏰ Due: ${Common.escapeHtml(task.dueTime)} • <span class="badge ${badgeClass}" style="padding: 1px 6px; font-size: 0.7rem;">${Common.escapeHtml(task.category)}</span></div>
          </div>
        </div>
      `;
    }).join('');

    // Attach checkbox change event
    container.querySelectorAll('.task-checkbox').forEach(chk => {
      chk.onchange = function () {
        const taskId = this.getAttribute('data-id');
        const updated = Storage.toggleTask(user.id, taskId);
        if (updated) {
          Common.showToast(`Task ${updated.completed ? 'completed!' : 'marked incomplete'}`, updated.completed ? 'success' : 'info');
          refreshDashboard();
        }
      };
    });
  }

  // ----------------------------------------------------
  // WEEKLY ACTIVITY CHART (Custom CSS & JS)
  // ----------------------------------------------------
  function renderWeeklyChart() {
    const chartWrap = document.getElementById('weekly-chart-bars');
    const avgLabel = document.getElementById('weekly-average-label');
    if (!chartWrap) return;

    const data = Storage.getUserData(user.id);
    const weeklyValues = (data && data.activityWeekly && data.activityWeekly.length === 7) 
      ? data.activityWeekly 
      : [80, 90, 75, 85, 95, 70, 85];

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentDayIdx = (new Date().getDay() + 6) % 7; // Convert Sun=0 to Mon=0

    let total = 0;
    chartWrap.innerHTML = weeklyValues.map((val, idx) => {
      total += val;
      const isToday = idx === currentDayIdx;
      return `
        <div class="chart-bar-col">
          <div class="chart-bar-bg">
            <div class="chart-bar-fill" style="height: ${val}%;" data-tooltip="${val}% Fulfilled"></div>
          </div>
          <span class="chart-day-label ${isToday ? 'today' : ''}">${days[idx]}</span>
        </div>
      `;
    }).join('');

    const avg = Math.round(total / weeklyValues.length);
    if (avgLabel) {
      avgLabel.textContent = `Weekly Average: ${avg}%`;
    }
  }

  // ----------------------------------------------------
  // UPCOMING APPOINTMENT WIDGET
  // ----------------------------------------------------
  function renderUpcomingAppointment(apt) {
    const container = document.getElementById('dashboard-appointment-card');
    if (!container) return;

    if (!apt) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem 1rem;">
          <p>No upcoming doctor appointments scheduled.</p>
          <a href="appointments.html" class="btn btn-outline btn-sm">+ Book an Appointment</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="appointment-preview-card">
        <div class="doc-info-group">
          <div class="doc-avatar">
            ${Common.escapeHtml(apt.doctorName.replace('Dr. ', '').substring(0, 2).toUpperCase())}
          </div>
          <div>
            <div class="doc-name">${Common.escapeHtml(apt.doctorName)}</div>
            <div class="doc-specialty">${Common.escapeHtml(apt.specialty)}</div>
          </div>
        </div>

        <div class="appointment-meta-list">
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
            <div class="appointment-meta-item" style="color: var(--muted-text); font-style: italic;">
              <span>📝 ${Common.escapeHtml(apt.notes)}</span>
            </div>
          ` : ''}
        </div>

        <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
          <a href="appointments.html" class="btn btn-outline btn-sm" style="flex: 1;">View Appointment Details</a>
        </div>
      </div>
    `;
  }

  // ----------------------------------------------------
  // EMERGENCY WIDGET
  // ----------------------------------------------------
  function renderEmergencyWidget(emergency) {
    const container = document.getElementById('dashboard-emergency-content');
    if (!container) return;

    const docPhone = emergency.doctorPhone || emergency.primaryPhone || '+91 94535 00111';
    const primaryName = emergency.primaryName || 'Emergency Services';
    const primaryPhone = emergency.primaryPhone || '+91 94535 00111';

    container.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.85rem; color: var(--muted-text); margin-bottom: 0.35rem;">PRIMARY CONTACT</div>
        <div style="font-weight: 700; color: var(--dark-text); font-size: 1.05rem;">${Common.escapeHtml(primaryName)}</div>
        <div style="font-size: 0.8rem; color: var(--muted-text);">${Common.escapeHtml(emergency.primaryRelation || 'Primary Care')} • ${Common.escapeHtml(primaryPhone)}</div>
      </div>

      <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem;">
        <span class="badge badge-neutral">Blood: <strong>${Common.escapeHtml(emergency.bloodGroup || 'B+')}</strong></span>
        <span class="badge badge-danger">Allergies: <strong>${Common.escapeHtml(emergency.allergies || 'None')}</strong></span>
      </div>

      <a href="tel:${primaryPhone.replace(/\s+/g, '')}" class="emergency-action-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        <span>Call Primary Contact</span>
      </a>

      <div style="text-align: center; margin-top: 0.75rem;">
        <a href="emergency.html" class="text-xs text-primary font-semibold">View Emergency Info &amp; Secondary Contacts &rarr;</a>
      </div>
    `;
  }

  // ----------------------------------------------------
  // MOTIVATIONAL HEALTHCARE QUOTES
  // ----------------------------------------------------
  function setupQuotes() {
    const quotes = [
      { text: "To keep the body in good health is a duty... otherwise we shall not be able to keep our mind strong and clear.", author: "Buddha" },
      { text: "The greatest wealth is health. Consistency in your daily care routine changes everything.", author: "Virgil" },
      { text: "Healing is a matter of time, but it is sometimes also a matter of opportunity and adherence.", author: "Hippocrates" },
      { text: "Take care of your body. It's the only place you have to live in.", author: "Jim Rohn" },
      { text: "Health is a state of complete harmony of the body, mind and spirit.", author: "B.K.S. Iyengar" }
    ];

    let currentIdx = 0;
    const textEl = document.getElementById('quote-text');
    const authorEl = document.getElementById('quote-author');
    const refreshBtn = document.getElementById('btn-refresh-quote');

    function displayQuote(idx) {
      if (!textEl || !authorEl) return;
      textEl.textContent = `"${quotes[idx].text}"`;
      authorEl.innerHTML = `<span>— ${quotes[idx].author}</span><span class="badge badge-primary">Daily Wellness</span>`;
    }

    if (refreshBtn) {
      refreshBtn.onclick = function () {
        currentIdx = (currentIdx + 1) % quotes.length;
        displayQuote(currentIdx);
      };
    }
  }

  // Helper for 24h conversion for sorting
  function convertTo24(timeStr) {
    if (!timeStr) return '00:00';
    const parts = timeStr.trim().split(' ');
    let [hours, mins] = parts[0].split(':').map(Number);
    const period = parts[1] ? parts[1].toUpperCase() : 'AM';
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
});
