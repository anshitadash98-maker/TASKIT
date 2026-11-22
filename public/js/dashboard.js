/**
 * TASKIT — Modern SaaS Productivity Dashboard Logic
 * Strict Vanilla JavaScript (ES6+) — Zero Frameworks
 */

document.addEventListener('DOMContentLoaded', () => {

  // Global Application State
  const state = {
    user: null,
    tasks: [],
    stats: {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0
    },
    navFilter: 'all',          // 'all', 'today', 'upcoming', 'completed'
    searchQuery: '',
    statusFilter: 'ALL',        // 'ALL', 'OPEN', 'DONE'
    priorityFilter: 'ALL',      // 'ALL', 'LOW', 'MEDIUM', 'HIGH'
    sortBy: 'createdAt',        // 'createdAt', 'dueDate', 'priority'
    sortOrder: 'DESC',          // 'DESC', 'ASC'
    editingTaskId: null,
    deletingTask: null
  };

  // DOM Elements: Header & User
  const headerGreeting = document.getElementById('headerGreeting');
  const currentDateDisplay = document.getElementById('currentDateDisplay');
  const headerAvatar = document.getElementById('headerAvatar');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserEmail = document.getElementById('sidebarUserEmail');
  const logoutBtn = document.getElementById('logoutBtn');

  // Header user display
  const headerUserNameDisplay = document.getElementById('headerUserNameDisplay');
  const sidebarProgressPct = document.getElementById('sidebarProgressPct');
  const sidebarProgressBar = document.getElementById('sidebarProgressBar');
  const sidebarProgressHint = document.getElementById('sidebarProgressHint');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  // Navigation Items
  const navDashboard = document.getElementById('navDashboard');
  const navMyTasks = document.getElementById('navMyTasks');
  const navToday = document.getElementById('navToday');
  const navUpcoming = document.getElementById('navUpcoming');
  const navCompleted = document.getElementById('navCompleted');
  const navAiAssistant = document.getElementById('navAiAssistant');
  const navItems = [navDashboard, navMyTasks, navToday, navUpcoming, navCompleted, navAiAssistant];

  // View Panels
  const tasksViewPanel = document.getElementById('tasksViewPanel');
  const aiAssistantPanel = document.getElementById('aiAssistantPanel');
  const headerQuickAiBtn = document.getElementById('headerQuickAiBtn');
  const headerSubheading = document.getElementById('headerSubheading');

  const navBadgeTotal = document.getElementById('navBadgeTotal');
  const navBadgeToday = document.getElementById('navBadgeToday');
  const navBadgeDone = document.getElementById('navBadgeDone');
  const sectionTitleDisplay = document.getElementById('sectionTitleDisplay');

  // Stat Counters
  const statTotalNumber = document.getElementById('statTotalNumber');
  const statCompletedNumber = document.getElementById('statCompletedNumber');
  const statPendingNumber = document.getElementById('statPendingNumber');
  const statOverdueNumber = document.getElementById('statOverdueNumber');

  // Search & Filter Toolbar
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const statusFilterSelect = document.getElementById('statusFilterSelect');
  const priorityFilterSelect = document.getElementById('priorityFilterSelect');
  const sortBySelect = document.getElementById('sortBySelect');
  const sortDirectionToggleBtn = document.getElementById('sortDirectionToggleBtn');
  const sortDescIcon = document.getElementById('sortDescIcon');
  const sortAscIcon = document.getElementById('sortAscIcon');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');

  // Task Grid & Empty State
  const tasksLoadingState = document.getElementById('tasksLoadingState');
  const tasksGrid = document.getElementById('tasksGrid');
  const emptyState = document.getElementById('emptyState');
  const emptyCreateBtn = document.getElementById('emptyCreateBtn');
  const openNewTaskBtn = document.getElementById('openNewTaskBtn');

  // Task Modal Elements
  const taskModal = document.getElementById('taskModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const taskForm = document.getElementById('taskForm');
  const taskEditId = document.getElementById('taskEditId');
  const taskTitleInput = document.getElementById('taskTitleInput');
  const taskDescInput = document.getElementById('taskDescInput');
  const taskDueDateInput = document.getElementById('taskDueDateInput');
  const taskPrioritySelect = document.getElementById('taskPrioritySelect');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const saveTaskBtn = document.getElementById('saveTaskBtn');

  // Delete Confirmation Modal Elements
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  const deleteTaskTitleDisplay = document.getElementById('deleteTaskTitleDisplay');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  // AI Assistant Elements
  const aiEngineBadge = document.getElementById('aiEngineBadge');
  const aiRefreshBtn = document.getElementById('aiRefreshBtn');
  const aiClearChatBtn = document.getElementById('aiClearChatBtn');
  const aiChatHistory = document.getElementById('aiChatHistory');
  const aiThinkingIndicator = document.getElementById('aiThinkingIndicator');
  const aiChatForm = document.getElementById('aiChatForm');
  const aiChatInput = document.getElementById('aiChatInput');
  const aiSendBtn = document.getElementById('aiSendBtn');
  const aiPromptChips = document.querySelectorAll('.ai-prompt-chip');

  // Natural Language Task Modal Elements
  const quickNlpTaskBtn = document.getElementById('quickNlpTaskBtn');
  const nlpModal = document.getElementById('nlpModal');
  const closeNlpModalBtn = document.getElementById('closeNlpModalBtn');
  const nlpTextInput = document.getElementById('nlpTextInput');
  const nlpParseBtn = document.getElementById('nlpParseBtn');
  const nlpPreviewContainer = document.getElementById('nlpPreviewContainer');
  const nlpExtractedList = document.getElementById('nlpExtractedList');
  const nlpCancelBtn = document.getElementById('nlpCancelBtn');
  const nlpConfirmBtn = document.getElementById('nlpConfirmBtn');
  let currentParsedTasks = [];

  // =========================================================================
  // 1. Toast Notification System
  // =========================================================================
  const toastContainer = document.getElementById('toastContainer');

  function showToast(message, type = 'success') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <span class="toast-icon">${iconSvg}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('is-hiding');
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // =========================================================================
  // 2. Authentication & Session Initialization
  // =========================================================================
  async function initSession() {
    try {
      const data = await API.getMe();
      state.user = data.user;

      // Update User displays
      const displayName = state.user.full_name || state.user.email.split('@')[0];
      const initial = displayName.charAt(0).toUpperCase();

      if (headerGreeting) headerGreeting.textContent = `Good day, ${displayName}!`;
      if (headerUserNameDisplay) headerUserNameDisplay.textContent = displayName;
      if (sidebarUserName) sidebarUserName.textContent = displayName;
      if (sidebarUserEmail) sidebarUserEmail.textContent = state.user.email;
      if (sidebarAvatar) sidebarAvatar.textContent = initial;
      if (headerAvatar) headerAvatar.textContent = initial;

      // Format & Set Current Date
      if (currentDateDisplay) {
        const today = new Date();
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        currentDateDisplay.textContent = today.toLocaleDateString('en-US', options);
      }

      await fetchTasksAndRender();
    } catch (err) {
      console.warn('Session check failed; redirecting to login.', err);
      API.clearAuth();
      window.location.href = '/index.html';
    }
  }

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      showToast('Signing out...', 'info');
      setTimeout(async () => {
        await API.logout();
      }, 400);
    });
  }

  // =========================================================================
  // 3. Mobile Navigation Drawer
  // =========================================================================
  function toggleMobileMenu(open) {
    if (sidebar) {
      if (open) sidebar.classList.add('is-open');
      else sidebar.classList.remove('is-open');
    }
    if (sidebarOverlay) {
      if (open) sidebarOverlay.classList.add('is-active');
      else sidebarOverlay.classList.remove('is-active');
    }
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => toggleMobileMenu(true));
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => toggleMobileMenu(false));
  }

  // =========================================================================
  // 4. Fetch Tasks & Dynamic Statistics
  // =========================================================================
  async function fetchTasksAndRender() {
    if (tasksLoadingState) tasksLoadingState.style.display = 'flex';

    try {
      // Build API query parameters
      const params = {
        search: state.searchQuery,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      };

      if (state.statusFilter !== 'ALL') {
        params.status = state.statusFilter;
      }

      if (state.priorityFilter !== 'ALL') {
        params.priority = state.priorityFilter;
      }

      const [tasksRes, statsRes] = await Promise.all([
        API.getTasks(params),
        API.getStats()
      ]);

      state.tasks = tasksRes.tasks || [];

      // Calculate dynamic statistics from real backend data
      const allTasks = state.tasks;
      const todayStr = new Date().toISOString().split('T')[0];

      const totalCount = statsRes.total ?? allTasks.length;
      const completedCount = statsRes.completed ?? allTasks.filter(t => t.status === 'DONE').length;
      const pendingCount = statsRes.pending ?? (totalCount - completedCount);
      const overdueCount = statsRes.overdue ?? allTasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'DONE').length;

      state.stats = {
        total: totalCount,
        completed: completedCount,
        pending: pendingCount,
        overdue: overdueCount
      };

      updateStatsUI(todayStr);
      renderTaskList();
      checkClearFilterVisibility();
    } catch (err) {
      console.error('Failed to load tasks:', err);
      showToast(err.message || 'Error loading tasks', 'error');
    } finally {
      if (tasksLoadingState) tasksLoadingState.style.display = 'none';
    }
  }

  // Update Dynamic Statistics Cards & Sidebar Badges
  function updateStatsUI(todayStr) {
    if (statTotalNumber) statTotalNumber.textContent = state.stats.total;
    if (statCompletedNumber) statCompletedNumber.textContent = state.stats.completed;
    if (statPendingNumber) statPendingNumber.textContent = state.stats.pending;
    if (statOverdueNumber) statOverdueNumber.textContent = state.stats.overdue;

    // Sidebar badges
    if (navBadgeTotal) navBadgeTotal.textContent = state.stats.total;
    if (navBadgeDone) navBadgeDone.textContent = state.stats.completed;

    // Calculate count due today
    const dueTodayCount = state.tasks.filter(t => t.due_date === todayStr && t.status !== 'DONE').length;
    if (navBadgeToday) navBadgeToday.textContent = dueTodayCount;

    // Productivity Progress Bar
    const total = state.stats.total;
    const completed = state.stats.completed;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (sidebarProgressPct) sidebarProgressPct.textContent = `${pct}%`;
    if (sidebarProgressBar) sidebarProgressBar.style.width = `${pct}%`;
    if (sidebarProgressHint) sidebarProgressHint.textContent = `${completed} of ${total} tasks completed`;
  }

  // =========================================================================
  // 5. Filter & Render Task Cards
  // =========================================================================
  function getFilteredTasks() {
    const todayStr = new Date().toISOString().split('T')[0];

    return state.tasks.filter(task => {
      // Sidebar Navigation View Filter
      if (state.navFilter === 'today') {
        if (task.due_date !== todayStr) return false;
      } else if (state.navFilter === 'upcoming') {
        if (!task.due_date || task.due_date <= todayStr) return false;
      } else if (state.navFilter === 'completed') {
        if (task.status !== 'DONE') return false;
      }

      return true;
    });
  }

  function renderTaskList() {
    if (!tasksGrid || !emptyState) return;
    tasksGrid.innerHTML = '';

    const filtered = getFilteredTasks();
    const todayStr = new Date().toISOString().split('T')[0];

    if (filtered.length === 0) {
      tasksGrid.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    tasksGrid.style.display = 'flex';
    emptyState.style.display = 'none';

    filtered.forEach(task => {
      const isDone = task.status === 'DONE';
      const isOverdue = !isDone && task.due_date && task.due_date < todayStr;

      const card = document.createElement('article');
      card.className = `task-card ${isDone ? 'is-completed' : ''} ${isOverdue ? 'is-overdue' : ''}`;
      card.setAttribute('data-id', task.id);

      // Priority mapping
      let priorityClass = 'priority-MEDIUM';
      let priorityLabel = 'Medium';
      if (task.priority === 'HIGH' || task.priority === 'URGENT') {
        priorityClass = 'priority-HIGH';
        priorityLabel = 'High';
      } else if (task.priority === 'LOW') {
        priorityClass = 'priority-LOW';
        priorityLabel = 'Low';
      }

      // Format Due Date
      let dueDateDisplay = 'No due date';
      if (task.due_date) {
        const d = new Date(task.due_date + 'T00:00:00');
        dueDateDisplay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      card.innerHTML = `
        <!-- Checkbox Column -->
        <div class="task-check-wrap">
          <input
            type="checkbox"
            class="task-checkbox"
            ${isDone ? 'checked' : ''}
            aria-label="Mark task as ${isDone ? 'incomplete' : 'complete'}"
            title="${isDone ? 'Mark as incomplete' : 'Mark as complete'}">
        </div>

        <!-- Task Content Body -->
        <div class="task-info-body">
          <div class="task-card-header-row">
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <span class="priority-badge ${priorityClass}">
              <span class="priority-dot"></span>
              ${priorityLabel}
            </span>
          </div>

          ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}

          <div class="task-meta-footer">
            <div class="meta-due-date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>${dueDateDisplay}</span>
            </div>

            ${isOverdue ? `
              <span class="meta-overdue-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Overdue
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Action Buttons (Edit, Delete) -->
        <div class="task-card-actions">
          <button class="btn-card-action btn-edit-action" title="Edit task" aria-label="Edit task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
            </svg>
          </button>
          <button class="btn-card-action btn-delete-action" title="Delete task" aria-label="Delete task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Event: Toggle Completion Checkbox
      const checkbox = card.querySelector('.task-checkbox');
      checkbox.addEventListener('change', async (e) => {
        const newStatus = e.target.checked ? 'DONE' : 'TODO';
        try {
          await API.patchTaskStatus(task.id, newStatus);
          showToast(newStatus === 'DONE' ? 'Task marked as completed!' : 'Task marked as pending.', 'success');
          await fetchTasksAndRender();
        } catch (err) {
          checkbox.checked = !checkbox.checked;
          showToast(err.message || 'Failed to update status', 'error');
        }
      });

      // Event: Edit Task
      card.querySelector('.btn-edit-action').addEventListener('click', () => {
        openEditTaskModal(task);
      });

      // Event: Delete Task with Confirmation
      card.querySelector('.btn-delete-action').addEventListener('click', () => {
        openDeleteConfirmModal(task);
      });

      tasksGrid.appendChild(card);
    });
  }

  // =========================================================================
  // 6. Navigation & View Switching (Tasks vs AI Assistant)
  // =========================================================================
  function showTasksView(selectedBtn, filterType, title) {
    if (aiAssistantPanel) aiAssistantPanel.classList.remove('is-active');
    if (tasksViewPanel) tasksViewPanel.classList.add('is-active');

    navItems.forEach(item => {
      if (item) item.classList.remove('is-active');
    });
    if (selectedBtn) selectedBtn.classList.add('is-active');

    state.navFilter = filterType;
    if (sectionTitleDisplay) sectionTitleDisplay.textContent = title;
    if (headerSubheading) headerSubheading.textContent = "Let's make today productive and organized.";

    toggleMobileMenu(false);
    renderTaskList();
  }

  function showAiAssistantView() {
    if (tasksViewPanel) tasksViewPanel.classList.remove('is-active');
    if (aiAssistantPanel) aiAssistantPanel.classList.add('is-active');

    navItems.forEach(item => {
      if (item) item.classList.remove('is-active');
    });
    if (navAiAssistant) navAiAssistant.classList.add('is-active');

    if (headerSubheading) headerSubheading.textContent = "Your Personal Productivity Assistant — Powered by AI.";

    toggleMobileMenu(false);
    updateAiEngineStatus();
    if (aiChatInput) aiChatInput.focus();
  }

  if (navDashboard) {
    navDashboard.addEventListener('click', () => showTasksView(navDashboard, 'all', 'Dashboard'));
  }
  if (navMyTasks) {
    navMyTasks.addEventListener('click', () => showTasksView(navMyTasks, 'all', 'My Tasks'));
  }
  if (navToday) {
    navToday.addEventListener('click', () => showTasksView(navToday, 'today', "Today's Tasks"));
  }
  if (navUpcoming) {
    navUpcoming.addEventListener('click', () => showTasksView(navUpcoming, 'upcoming', 'Upcoming Tasks'));
  }
  if (navCompleted) {
    navCompleted.addEventListener('click', () => showTasksView(navCompleted, 'completed', 'Completed Tasks'));
  }
  if (navAiAssistant) {
    navAiAssistant.addEventListener('click', showAiAssistantView);
  }
  if (headerQuickAiBtn) {
    headerQuickAiBtn.addEventListener('click', showAiAssistantView);
  }

  // =========================================================================
  // 7. Search, Filtering & Sorting Toolbar
  // =========================================================================
  let searchDebounceTimer = null;

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (clearSearchBtn) clearSearchBtn.style.display = val ? 'block' : 'none';

      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        state.searchQuery = val;
        fetchTasksAndRender();
      }, 250);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      state.searchQuery = '';
      fetchTasksAndRender();
    });
  }

  if (statusFilterSelect) {
    statusFilterSelect.addEventListener('change', (e) => {
      state.statusFilter = e.target.value;
      fetchTasksAndRender();
    });
  }

  if (priorityFilterSelect) {
    priorityFilterSelect.addEventListener('change', (e) => {
      state.priorityFilter = e.target.value;
      fetchTasksAndRender();
    });
  }

  if (sortBySelect) {
    sortBySelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      fetchTasksAndRender();
    });
  }

  if (sortDirectionToggleBtn) {
    sortDirectionToggleBtn.addEventListener('click', () => {
      state.sortOrder = state.sortOrder === 'DESC' ? 'ASC' : 'DESC';
      if (sortDescIcon) sortDescIcon.style.display = state.sortOrder === 'DESC' ? 'block' : 'none';
      if (sortAscIcon) sortAscIcon.style.display = state.sortOrder === 'ASC' ? 'block' : 'none';
      fetchTasksAndRender();
    });
  }

  function checkClearFilterVisibility() {
    const isFiltered = state.searchQuery || state.statusFilter !== 'ALL' || state.priorityFilter !== 'ALL' || state.sortBy !== 'createdAt';
    if (clearFiltersBtn) {
      clearFiltersBtn.style.display = isFiltered ? 'inline-flex' : 'none';
    }
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      state.searchQuery = '';
      state.statusFilter = 'ALL';
      state.priorityFilter = 'ALL';
      state.sortBy = 'createdAt';
      state.sortOrder = 'DESC';

      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      if (statusFilterSelect) statusFilterSelect.value = 'ALL';
      if (priorityFilterSelect) priorityFilterSelect.value = 'ALL';
      if (sortBySelect) sortBySelect.value = 'createdAt';
      if (sortDescIcon) sortDescIcon.style.display = 'block';
      if (sortAscIcon) sortAscIcon.style.display = 'none';

      fetchTasksAndRender();
    });
  }

  // =========================================================================
  // 8. Task Modal: Add New Task & Edit Task
  // =========================================================================
  function openCreateTaskModal() {
    state.editingTaskId = null;
    modalTitle.textContent = 'Add New Task';
    modalSubtitle.textContent = 'Fill in the details below to organize your task.';
    taskEditId.value = '';
    taskTitleInput.value = '';
    taskDescInput.value = '';
    taskDueDateInput.value = new Date().toISOString().split('T')[0];
    taskPrioritySelect.value = 'MEDIUM';

    taskModal.classList.add('is-open');
    taskTitleInput.focus();
  }

  function openEditTaskModal(task) {
    state.editingTaskId = task.id;
    modalTitle.textContent = 'Edit Task';
    modalSubtitle.textContent = 'Modify task details and save changes.';
    taskEditId.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskDueDateInput.value = task.due_date || '';

    // Normalizing priority
    let pr = task.priority;
    if (pr === 'URGENT') pr = 'HIGH';
    taskPrioritySelect.value = pr || 'MEDIUM';

    taskModal.classList.add('is-open');
    taskTitleInput.focus();
  }

  function closeTaskModal() {
    taskModal.classList.remove('is-open');
    taskForm.reset();
  }

  if (openNewTaskBtn) openNewTaskBtn.addEventListener('click', openCreateTaskModal);
  if (emptyCreateBtn) emptyCreateBtn.addEventListener('click', openCreateTaskModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeTaskModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeTaskModal);

  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
  });

  // Task Form Submit (Create or Update)
  if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = taskTitleInput.value.trim();
      const description = taskDescInput.value.trim();
      const dueDate = taskDueDateInput.value || null;
      const priority = taskPrioritySelect.value;

      if (!title) {
        showToast('Please enter a task title.', 'error');
        taskTitleInput.focus();
        return;
      }

      saveTaskBtn.disabled = true;

      try {
        if (state.editingTaskId) {
          await API.patchTask(state.editingTaskId, {
            title,
            description,
            dueDate,
            priority
          });
          showToast('Task updated successfully!', 'success');
        } else {
          await API.createTask({
            title,
            description,
            dueDate,
            priority,
            status: 'TODO'
          });
          showToast('New task created!', 'success');
        }

        closeTaskModal();
        await fetchTasksAndRender();
      } catch (err) {
        showToast(err.message || 'Failed to save task.', 'error');
      } finally {
        saveTaskBtn.disabled = false;
      }
    });
  }

  // =========================================================================
  // 9. Delete Confirmation Modal
  // =========================================================================
  function openDeleteConfirmModal(task) {
    state.deletingTask = task;
    if (deleteTaskTitleDisplay) {
      deleteTaskTitleDisplay.textContent = task.title;
    }
    deleteConfirmModal.classList.add('is-open');
  }

  function closeDeleteConfirmModal() {
    state.deletingTask = null;
    deleteConfirmModal.classList.remove('is-open');
  }

  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);
  deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) closeDeleteConfirmModal();
  });

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!state.deletingTask) return;
      confirmDeleteBtn.disabled = true;

      try {
        await API.deleteTask(state.deletingTask.id);
        showToast('Task deleted successfully.', 'info');
        closeDeleteConfirmModal();
        await fetchTasksAndRender();
      } catch (err) {
        showToast(err.message || 'Failed to delete task.', 'error');
      } finally {
        confirmDeleteBtn.disabled = false;
      }
    });
  }

  // =========================================================================
  // 10. TASKIT AI Assistant Chat & Recommendation Logic
  // =========================================================================
  async function updateAiEngineStatus() {
    if (!aiEngineBadge) return;
    try {
      const status = await API.getAiStatus();
      if (status.geminiConfigured) {
        aiEngineBadge.innerHTML = `<span class="badge-dot" style="background:#10b981;box-shadow:0 0 6px #10b981;"></span><span>Google Gemini 2.0 Flash</span>`;
        aiEngineBadge.style.borderColor = '#a7f3d0';
        aiEngineBadge.style.backgroundColor = '#ecfdf5';
        aiEngineBadge.style.color = '#047857';
      } else {
        aiEngineBadge.innerHTML = `<span class="badge-dot"></span><span>TASKIT Heuristic Engine (Local)</span>`;
        aiEngineBadge.style.borderColor = 'var(--amber-border)';
        aiEngineBadge.style.backgroundColor = 'var(--amber-light)';
        aiEngineBadge.style.color = 'var(--amber-primary)';
      }
    } catch (e) {
      aiEngineBadge.innerHTML = `<span class="badge-dot"></span><span>TASKIT Rule-Based Engine</span>`;
    }
  }

  function appendAiMessage(sender, contentHtml) {
    if (!aiChatHistory) return;
    const row = document.createElement('div');
    row.className = `ai-msg-row ai-msg-${sender}`;

    if (sender === 'assistant') {
      row.innerHTML = `
        <div class="ai-msg-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="8" width="18" height="12" rx="3.5"></rect>
            <path d="M12 4v4"></path>
            <circle cx="12" cy="3" r="1.2" fill="currentColor"></circle>
            <circle cx="8.5" cy="13" r="1.5" fill="currentColor"></circle>
            <circle cx="15.5" cy="13" r="1.5" fill="currentColor"></circle>
            <path d="M9.5 16.5c1 .5 4 .5 5 0"></path>
            <path d="M1.5 13h1.5"></path>
            <path d="M21 13h1.5"></path>
          </svg>
        </div>
        <div class="ai-msg-bubble">
          ${contentHtml}
        </div>
      `;
    } else {
      row.innerHTML = `
        <div class="ai-msg-bubble">
          <p>${escapeHtml(contentHtml)}</p>
        </div>
      `;
    }

    aiChatHistory.appendChild(row);
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
  }

  function formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/•\s+/g, '• ');
  }

  async function handleSendAiMessage(messageText) {
    const text = messageText.trim();
    if (!text) return;

    appendAiMessage('user', text);
    if (aiChatInput) aiChatInput.value = '';

    if (aiThinkingIndicator) aiThinkingIndicator.style.display = 'flex';
    if (aiChatHistory) aiChatHistory.scrollTop = aiChatHistory.scrollHeight;

    try {
      const res = await API.aiChat(text);
      if (aiThinkingIndicator) aiThinkingIndicator.style.display = 'none';

      let responseHtml = `<p>${formatMarkdown(res.reply)}</p>`;

      // Render Interactive Priority Cards
      if (res.actionType === 'PRIORITIZE' && res.data && Array.isArray(res.data.recommendations) && res.data.recommendations.length > 0) {
        responseHtml += `<div class="ai-priority-list">`;
        res.data.recommendations.forEach(rec => {
          let priorityClass = 'priority-MEDIUM';
          if (rec.recommendedPriority === 'HIGH') priorityClass = 'priority-HIGH';
          else if (rec.recommendedPriority === 'LOW') priorityClass = 'priority-LOW';

          responseHtml += `
            <div class="ai-priority-card" id="aiRec_${rec.taskId}">
              <div class="priority-card-top">
                <span class="priority-rank-pill">#${rec.suggestedOrder} Priority</span>
                <span class="priority-badge ${priorityClass}">
                  <span class="priority-dot"></span>
                  ${rec.recommendedPriority}
                </span>
              </div>
              <h4 class="priority-card-title">${escapeHtml(rec.title)}</h4>
              <div class="priority-card-reason">
                <strong>Why:</strong> ${escapeHtml(rec.reason)}
              </div>
              <div class="priority-card-bottom">
                <span class="time-allocation-tag">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Est. ${escapeHtml(rec.recommendedTimeAllocation)}
                </span>
                <div class="priority-actions">
                  <button type="button" class="btn-accept-rec" data-task-id="${rec.taskId}" data-priority="${rec.recommendedPriority}">
                    Accept Priority
                  </button>
                  <button type="button" class="btn-dismiss-rec" data-dismiss-id="aiRec_${rec.taskId}">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          `;
        });
        responseHtml += `</div>`;
      }

      // Render Plan Day Schedule Timeline
      if (res.actionType === 'PLAN_DAY' && res.data && Array.isArray(res.data.schedule) && res.data.schedule.length > 0) {
        responseHtml += `
          <div class="ai-plan-schedule">
            <div class="schedule-header-box">
              <strong>${escapeHtml(res.data.planTitle)}</strong> (${res.data.totalHoursPlanned} hrs planned)
            </div>
            <div class="schedule-timeline">
        `;

        res.data.schedule.forEach(slot => {
          const isBreak = !slot.taskId;
          responseHtml += `
            <div class="timeline-slot ${isBreak ? 'slot-break' : ''}">
              <span class="timeline-time">${escapeHtml(slot.timeRange)}</span>
              <span class="timeline-task-title">${escapeHtml(slot.taskTitle)}</span>
            </div>
          `;
        });

        responseHtml += `</div>`;

        if (Array.isArray(res.data.overflowTasks) && res.data.overflowTasks.length > 0) {
          responseHtml += `
            <div class="overflow-tasks-box">
              <strong>Can wait for upcoming days (${res.data.overflowTasks.length} tasks):</strong>
              <ul style="padding-left: 1.25rem; margin-top: 0.35rem;">
                ${res.data.overflowTasks.map(o => `<li><strong>${escapeHtml(o.taskTitle)}</strong> — ${escapeHtml(o.reason)}</li>`).join('')}
              </ul>
            </div>
          `;
        }

        responseHtml += `</div>`;
      }

      // Render Extracted Tasks Review Card
      if (res.actionType === 'EXTRACTED_TASKS' && res.data && Array.isArray(res.data.extractedTasks) && res.data.extractedTasks.length > 0) {
        responseHtml += `
          <div class="ai-extracted-tasks-card">
            <h4 style="font-size:0.95rem;font-weight:700;">Extracted Tasks Review:</h4>
            <div class="extracted-items-wrap">
        `;

        res.data.extractedTasks.forEach((t, idx) => {
          responseHtml += `
            <div class="extracted-item-row">
              <input type="checkbox" class="extracted-check" checked data-idx="${idx}">
              <div class="extracted-title">${escapeHtml(t.title)}</div>
              <div class="extracted-meta">
                <span>Due: ${t.dueDate ? t.dueDate : 'None'}</span>
                <span class="priority-badge priority-${t.priority}" style="font-size:0.65rem;">${t.priority}</span>
              </div>
            </div>
          `;
        });

        responseHtml += `
            </div>
            <div style="display:flex;gap:0.65rem;margin-top:0.65rem;">
              <button type="button" class="btn-primary-amber btn-confirm-chat-tasks" style="font-size:0.8rem;height:36px;padding:0 0.85rem;">
                Confirm & Save All Tasks
              </button>
            </div>
          </div>
        `;
      }

      appendAiMessage('assistant', responseHtml);

      // Attach dynamic event listeners inside newly appended cards
      const lastMsg = aiChatHistory.lastElementChild;
      if (lastMsg) {
        // Accept recommendation click
        lastMsg.querySelectorAll('.btn-accept-rec').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const taskId = e.currentTarget.getAttribute('data-task-id');
            const newPriority = e.currentTarget.getAttribute('data-priority');
            try {
              await API.aiApplyPriority(taskId, newPriority);
              showToast(`Task priority updated to ${newPriority}!`, 'success');
              e.currentTarget.textContent = '✓ Applied';
              e.currentTarget.disabled = true;
              e.currentTarget.style.background = 'var(--success-text)';
              await fetchTasksAndRender();
            } catch (err) {
              showToast(err.message || 'Failed to apply priority', 'error');
            }
          });
        });

        // Dismiss recommendation card
        lastMsg.querySelectorAll('.btn-dismiss-rec').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-dismiss-id');
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.style.opacity = '0.35';
          });
        });

        // Confirm chat-extracted tasks
        const confirmChatBtn = lastMsg.querySelector('.btn-confirm-chat-tasks');
        if (confirmChatBtn && res.data && res.data.extractedTasks) {
          confirmChatBtn.addEventListener('click', async () => {
            const checks = lastMsg.querySelectorAll('.extracted-check:checked');
            const selected = Array.from(checks).map(c => res.data.extractedTasks[parseInt(c.getAttribute('data-idx'), 10)]);

            if (selected.length === 0) {
              showToast('No tasks selected.', 'error');
              return;
            }

            confirmChatBtn.disabled = true;
            try {
              await API.aiConfirmTasks(selected);
              showToast(`Saved ${selected.length} tasks to your board!`, 'success');
              confirmChatBtn.textContent = '✓ Tasks Saved!';
              confirmChatBtn.style.background = 'var(--success-text)';
              await fetchTasksAndRender();
            } catch (err) {
              confirmChatBtn.disabled = false;
              showToast(err.message || 'Failed to save tasks', 'error');
            }
          });
        }
      }

    } catch (err) {
      if (aiThinkingIndicator) aiThinkingIndicator.style.display = 'none';
      appendAiMessage('assistant', `<p style="color:var(--overdue-text);">Sorry, I encountered an issue: ${escapeHtml(err.message)}</p>`);
    }
  }

  // Chat Form Submit
  if (aiChatForm) {
    aiChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (aiChatInput) handleSendAiMessage(aiChatInput.value);
    });
  }

  // Prompt Chips Click
  aiPromptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.getAttribute('data-prompt');
      if (promptText) handleSendAiMessage(promptText);
    });
  });

  // Re-Analyze Button
  if (aiRefreshBtn) {
    aiRefreshBtn.addEventListener('click', () => {
      handleSendAiMessage('Prioritise my tasks.');
    });
  }

  // Clear Chat History
  if (aiClearChatBtn) {
    aiClearChatBtn.addEventListener('click', () => {
      if (aiChatHistory) {
        aiChatHistory.innerHTML = `
          <div class="ai-msg-row ai-msg-assistant">
            <div class="ai-msg-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="8" width="18" height="12" rx="3.5"></rect>
                <path d="M12 4v4"></path>
                <circle cx="12" cy="3" r="1.2" fill="currentColor"></circle>
                <circle cx="8.5" cy="13" r="1.5" fill="currentColor"></circle>
                <circle cx="15.5" cy="13" r="1.5" fill="currentColor"></circle>
                <path d="M9.5 16.5c1 .5 4 .5 5 0"></path>
                <path d="M1.5 13h1.5"></path>
                <path d="M21 13h1.5"></path>
              </svg>
            </div>
            <div class="ai-msg-bubble">
              <p>Chat history cleared. How can I assist with your productivity today?</p>
            </div>
          </div>
        `;
      }
    });
  }

  // =========================================================================
  // 11. Natural Language Task Modal Dialog
  // =========================================================================
  function openNlpModal() {
    if (nlpModal) {
      nlpModal.classList.add('is-open');
      if (nlpTextInput) {
        nlpTextInput.value = '';
        nlpTextInput.focus();
      }
      if (nlpPreviewContainer) nlpPreviewContainer.style.display = 'none';
      currentParsedTasks = [];
    }
  }

  function closeNlpModal() {
    if (nlpModal) nlpModal.classList.remove('is-open');
  }

  if (quickNlpTaskBtn) quickNlpTaskBtn.addEventListener('click', openNlpModal);
  if (closeNlpModalBtn) closeNlpModalBtn.addEventListener('click', closeNlpModal);
  if (nlpCancelBtn) nlpCancelBtn.addEventListener('click', closeNlpModal);
  if (nlpModal) {
    nlpModal.addEventListener('click', (e) => {
      if (e.target === nlpModal) closeNlpModal();
    });
  }

  if (nlpParseBtn) {
    nlpParseBtn.addEventListener('click', async () => {
      const text = nlpTextInput ? nlpTextInput.value.trim() : '';
      if (!text) {
        showToast('Please describe your tasks first.', 'error');
        return;
      }

      nlpParseBtn.disabled = true;
      nlpParseBtn.textContent = 'Analyzing tasks...';

      try {
        const res = await API.aiParseTasks(text);
        currentParsedTasks = res.extractedTasks || [];

        if (currentParsedTasks.length === 0) {
          showToast('Could not extract any tasks. Try describing with deadlines e.g. "by tomorrow".', 'error');
          return;
        }

        if (nlpExtractedList) {
          nlpExtractedList.innerHTML = '';
          currentParsedTasks.forEach((t, i) => {
            const row = document.createElement('div');
            row.className = 'extracted-item-row';
            row.innerHTML = `
              <input type="checkbox" class="nlp-modal-check" checked data-idx="${i}">
              <div class="extracted-title">${escapeHtml(t.title)}</div>
              <div class="extracted-meta">
                <span>Due: ${t.dueDate || 'None'}</span>
                <span class="priority-badge priority-${t.priority}" style="font-size:0.65rem;">${t.priority}</span>
              </div>
            `;
            nlpExtractedList.appendChild(row);
          });
        }

        if (nlpPreviewContainer) nlpPreviewContainer.style.display = 'block';
      } catch (err) {
        showToast(err.message || 'Failed to parse tasks', 'error');
      } finally {
        nlpParseBtn.disabled = false;
        nlpParseBtn.textContent = 'Analyze & Extract Tasks';
      }
    });
  }

  if (nlpConfirmBtn) {
    nlpConfirmBtn.addEventListener('click', async () => {
      if (!nlpExtractedList) return;
      const checkedBoxes = nlpExtractedList.querySelectorAll('.nlp-modal-check:checked');
      const selected = Array.from(checkedBoxes).map(cb => currentParsedTasks[parseInt(cb.getAttribute('data-idx'), 10)]);

      if (selected.length === 0) {
        showToast('Please select at least one task to save.', 'error');
        return;
      }

      nlpConfirmBtn.disabled = true;
      try {
        await API.aiConfirmTasks(selected);
        showToast(`Successfully created ${selected.length} tasks!`, 'success');
        closeNlpModal();
        await fetchTasksAndRender();
      } catch (err) {
        showToast(err.message || 'Failed to save tasks.', 'error');
      } finally {
        nlpConfirmBtn.disabled = false;
      }
    });
  }

  // Escape key closes NLP modal too
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (nlpModal && nlpModal.classList.contains('is-open')) closeNlpModal();
    }
  });

  // Escape Key to Close Open Modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (taskModal.classList.contains('is-open')) closeTaskModal();
      if (deleteConfirmModal.classList.contains('is-open')) closeDeleteConfirmModal();
    }
  });

  // Helper: HTML Escaping
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize
  initSession();

});
