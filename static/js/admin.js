// Admin Panel Dashboard Controller: Levels CRUD, Results Search, Settings, Analytics

document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      
      tabBtns.forEach(b => {
        b.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-300');
        b.classList.add('text-gray-400', 'border-transparent');
      });
      tabPanes.forEach(pane => pane.classList.add('hidden'));

      btn.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-300');
      btn.classList.remove('text-gray-400', 'border-transparent');
      
      const activePane = document.getElementById(targetId);
      if (activePane) activePane.classList.remove('hidden');

      // Trigger lazy tab loads
      if (targetId === 'tabLevels') loadAdminLevels();
      if (targetId === 'tabResults') loadAdminResults();
    });
  });

  // Initial load
  loadAdminStats();

  // Search results input
  const searchInput = document.getElementById('searchStudentResults');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadAdminResults(searchInput.value.trim());
      }, 300);
    });
  }

  // Bind Level Modal Forms
  setupLevelModals();

  // Bind Settings Form
  setupSettingsForm();

  // Bind Password Change Form
  setupPasswordForm();
});

// --- Analytics & Stats ---
async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('statTotalTests').textContent = data.total_tests;
    document.getElementById('statAvgWpm').textContent = `${data.avg_wpm} WPM`;
    document.getElementById('statPassRate').textContent = `${data.pass_rate}%`;
    document.getElementById('statTotalStudents').textContent = data.total_students;
    document.getElementById('statTotalLevels').textContent = data.total_levels;

    // Recent test records table
    const tableBody = document.getElementById('recentTestsTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      if (!data.recent_tests || data.recent_tests.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-gray-500">No test attempts recorded yet.</td></tr>`;
        return;
      }

      data.recent_tests.forEach(test => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-800/60 hover:bg-gray-800/30';
        row.innerHTML = `
          <td class="py-3 px-4 font-semibold text-gray-200">${escapeHtml(test.student_name)}</td>
          <td class="py-3 px-4 text-gray-300">Level ${test.level_number || '-'}</td>
          <td class="py-3 px-4 font-bold text-cyan-400">${test.wpm}</td>
          <td class="py-3 px-4 text-emerald-400">${test.accuracy}%</td>
          <td class="py-3 px-4">
            ${test.passed 
              ? '<span class="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Passed</span>' 
              : '<span class="px-2 py-0.5 rounded text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30">Failed</span>'}
          </td>
          <td class="py-3 px-4 text-xs text-gray-500">${test.created_at}</td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (e) {
    console.error("Failed to load admin stats", e);
  }
}

// --- Levels Management ---
async function loadAdminLevels() {
  try {
    const res = await fetch('/api/admin/levels');
    const data = await res.json();
    const tbody = document.getElementById('adminLevelsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    data.levels.forEach(lvl => {
      const row = document.createElement('tr');
      row.className = 'border-b border-gray-800/60 hover:bg-gray-800/30';
      row.innerHTML = `
        <td class="py-3.5 px-4 font-bold text-cyan-400">#${lvl.level_number}</td>
        <td class="py-3.5 px-4 font-semibold text-white">${escapeHtml(lvl.title)}</td>
        <td class="py-3.5 px-4">
          <span class="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-cyan-300 border border-gray-700">${escapeHtml(lvl.category)}</span>
        </td>
        <td class="py-3.5 px-4 text-sm font-mono text-gray-300">${lvl.target_wpm} WPM / ${lvl.min_accuracy}%</td>
        <td class="py-3.5 px-4 text-xs text-gray-400 font-mono max-w-xs truncate" title="${escapeHtml(lvl.content)}">
          ${escapeHtml(lvl.content)}
        </td>
        <td class="py-3.5 px-4 text-right">
          <button class="edit-lvl-btn px-2.5 py-1 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-black mr-2 transition-all" data-level='${JSON.stringify(lvl)}'>
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="delete-lvl-btn px-2.5 py-1 text-xs font-semibold rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all" data-id="${lvl.id}" data-num="${lvl.level_number}">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Attach event listeners
    tbody.querySelectorAll('.edit-lvl-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lvlData = JSON.parse(btn.getAttribute('data-level'));
        openEditLevelModal(lvlData);
      });
    });

    tbody.querySelectorAll('.delete-lvl-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const num = btn.getAttribute('data-num');
        if (confirm(`Are you sure you want to delete Level ${num}? This cannot be undone.`)) {
          const dRes = await fetch(`/api/admin/level/delete/${id}`, { method: 'POST' });
          const resJson = await dRes.json();
          if (resJson.success) {
            loadAdminLevels();
            loadAdminStats();
          }
        }
      });
    });
  } catch (e) {
    console.error("Failed to load levels", e);
  }
}

function setupLevelModals() {
  const modal = document.getElementById('levelFormModal');
  const modalTitle = document.getElementById('levelModalTitle');
  const form = document.getElementById('levelForm');
  const cancelBtn = document.getElementById('cancelLevelModalBtn');
  const openAddBtn = document.getElementById('openAddLevelModalBtn');

  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('levelFormId').value = '';
      if (modalTitle) modalTitle.textContent = 'Add New Typing Level';
      modal.classList.remove('hidden');
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('levelFormId').value;
      const payload = {
        level_number: parseInt(document.getElementById('levelFormNumber').value) || null,
        title: document.getElementById('levelFormTitle').value.trim(),
        category: document.getElementById('levelFormCategory').value.trim(),
        description: document.getElementById('levelFormDesc').value.trim(),
        content: document.getElementById('levelFormContent').value.trim(),
        target_wpm: parseInt(document.getElementById('levelFormTargetWpm').value) || 20,
        min_accuracy: parseInt(document.getElementById('levelFormMinAcc').value) || 85,
        time_limit: parseInt(document.getElementById('levelFormTimeLimit').value) || 0
      };

      const url = id ? `/api/admin/level/update/${id}` : '/api/admin/level/create';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        modal.classList.add('hidden');
        loadAdminLevels();
        loadAdminStats();
      } else {
        alert(data.error || 'Failed to save level');
      }
    });
  }
}

function openEditLevelModal(lvl) {
  const modal = document.getElementById('levelFormModal');
  const modalTitle = document.getElementById('levelModalTitle');
  if (modalTitle) modalTitle.textContent = `Edit Level ${lvl.level_number}`;

  document.getElementById('levelFormId').value = lvl.id;
  document.getElementById('levelFormNumber').value = lvl.level_number;
  document.getElementById('levelFormTitle').value = lvl.title;
  document.getElementById('levelFormCategory').value = lvl.category;
  document.getElementById('levelFormDesc').value = lvl.description || '';
  document.getElementById('levelFormContent').value = lvl.content;
  document.getElementById('levelFormTargetWpm').value = lvl.target_wpm;
  document.getElementById('levelFormMinAcc').value = lvl.min_accuracy;
  document.getElementById('levelFormTimeLimit').value = lvl.time_limit || 0;

  modal.classList.remove('hidden');
}

// --- Student Test Results ---
async function loadAdminResults(searchTerm = '') {
  try {
    const url = searchTerm ? `/api/admin/results?search=${encodeURIComponent(searchTerm)}` : '/api/admin/results';
    const res = await fetch(url);
    const data = await res.json();
    const tbody = document.getElementById('adminResultsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!data.results || data.results.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-500">No matching test records found.</td></tr>`;
      return;
    }

    data.results.forEach(item => {
      const row = document.createElement('tr');
      row.className = 'border-b border-gray-800/60 hover:bg-gray-800/30';
      row.innerHTML = `
        <td class="py-3 px-4 font-semibold text-white">${escapeHtml(item.student_name)}</td>
        <td class="py-3 px-4 text-cyan-300">Level ${item.level_number || '-'}</td>
        <td class="py-3 px-4 font-bold text-cyan-400">${item.wpm} <span class="text-xs text-gray-500 font-normal">(${item.raw_wpm} raw)</span></td>
        <td class="py-3 px-4 text-emerald-400 font-semibold">${item.accuracy}%</td>
        <td class="py-3 px-4 text-gray-400">${item.errors_count} err / ${item.time_seconds}s</td>
        <td class="py-3 px-4">
          ${item.passed 
            ? '<span class="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PASSED</span>' 
            : '<span class="px-2 py-0.5 rounded text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30">FAILED</span>'}
        </td>
        <td class="py-3 px-4 text-right">
          <button class="delete-result-btn text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20" data-id="${item.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll('.delete-result-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this test score?')) {
          const res = await fetch(`/api/admin/result/delete/${id}`, { method: 'POST' });
          const resJson = await res.json();
          if (resJson.success) {
            loadAdminResults(searchTerm);
            loadAdminStats();
          }
        }
      });
    });
  } catch (e) {
    console.error("Failed to load results", e);
  }
}

// --- Settings Form ---
function setupSettingsForm() {
  const form = document.getElementById('adminSettingsForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      site_name: document.getElementById('settingsSiteName').value.trim(),
      enforce_level_lock: document.getElementById('settingsEnforceLock').checked ? 'true' : 'false',
      announcement: document.getElementById('settingsAnnouncement').value.trim()
    };

    const res = await fetch('/api/admin/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      alert('Settings updated successfully!');
    }
  });
}

// --- Admin Password Change ---
function setupPasswordForm() {
  const form = document.getElementById('adminPasswordForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById('oldPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;

    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match!");
      return;
    }

    const res = await fetch('/api/admin/password/change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
    const data = await res.json();

    if (data.success) {
      alert("Password changed successfully!");
      form.reset();
    } else {
      alert(data.error || "Failed to update password");
    }
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
