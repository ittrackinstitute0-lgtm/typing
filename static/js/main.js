// Main Application Controller: Themes, Audio Controls, Student Profiles, Mode Switchers

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Theme
  const savedTheme = localStorage.getItem('typepulse_theme') || 'cyber';
  setTheme(savedTheme);

  const themeSelect = document.getElementById('themeSelector');
  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener('change', (e) => {
      setTheme(e.target.value);
    });
  }

  // 2. Initialize Sound Controls
  const soundSelect = document.getElementById('soundSelector');
  if (soundSelect && window.soundManager) {
    soundSelect.value = window.soundManager.getSoundType();
    soundSelect.addEventListener('change', (e) => {
      window.soundManager.setSoundType(e.target.value);
    });
  }

  // 3. Initialize Keyboard and Engine if on index page
  let virtualKeyboard = null;
  let typingEngine = null;
  let levelController = null;

  if (document.getElementById('virtualKeyboard')) {
    virtualKeyboard = new window.VirtualKeyboard('virtualKeyboard');
  }

  if (document.getElementById('typingWords')) {
    typingEngine = new window.TypingEngine({
      textContainerId: 'typingWords',
      caretId: 'customCaret',
      wpmId: 'liveWpm',
      accId: 'liveAccuracy',
      timeId: 'liveTime',
      progressId: 'typingProgressBar',
      keyboard: virtualKeyboard
    });

    levelController = new window.LevelController(typingEngine);

    // Test finished hook
    window.onTestFinished = function(result) {
      if (result.new_level_unlocked && levelController) {
        levelController.fetchLevels().then(() => {
          levelController.renderLevelPills();
        });
      }
    };
  }

  // Keyboard toggle
  const toggleKbBtn = document.getElementById('toggleKeyboardBtn');
  const kbWrapper = document.getElementById('virtualKeyboardWrapper');
  if (toggleKbBtn && kbWrapper) {
    const isKbVisible = localStorage.getItem('typepulse_show_keyboard') !== 'false';
    kbWrapper.style.display = isKbVisible ? 'block' : 'none';

    toggleKbBtn.addEventListener('click', () => {
      const nowVisible = (kbWrapper.style.display !== 'none');
      kbWrapper.style.display = nowVisible ? 'none' : 'block';
      localStorage.setItem('typepulse_show_keyboard', (!nowVisible).toString());
      toggleKbBtn.classList.toggle('text-cyan-400', !nowVisible);
    });
  }

  // Quick Action Buttons
  const restartBtn = document.getElementById('restartTestBtn');
  if (restartBtn && typingEngine) {
    restartBtn.addEventListener('click', () => {
      typingEngine.reset();
      typingEngine.focus();
    });
  }

  const modalRetryBtn = document.getElementById('modalRetryBtn');
  if (modalRetryBtn && typingEngine) {
    modalRetryBtn.addEventListener('click', () => {
      document.getElementById('resultsModal').classList.add('hidden');
      typingEngine.reset();
      typingEngine.focus();
    });
  }

  const modalNextLevelBtn = document.getElementById('modalNextLevelBtn');
  if (modalNextLevelBtn && levelController) {
    modalNextLevelBtn.addEventListener('click', () => {
      document.getElementById('resultsModal').classList.add('hidden');
      levelController.selectNextLevel();
    });
  }

  // Mode Tabs (Level Mode vs Quote Mode vs Random Words)
  const modeLevelBtn = document.getElementById('modeLevelBtn');
  const modeQuoteBtn = document.getElementById('modeQuoteBtn');
  const modeWordsBtn = document.getElementById('modeWordsBtn');

  if (modeLevelBtn && modeQuoteBtn && modeWordsBtn && typingEngine) {
    modeLevelBtn.addEventListener('click', () => {
      setModeActive(modeLevelBtn);
      if (levelController) {
        levelController.selectLevel(levelController.currentLevelNum);
      }
    });

    modeQuoteBtn.addEventListener('click', async () => {
      setModeActive(modeQuoteBtn);
      typingEngine.mode = 'quote';
      try {
        const res = await fetch('/api/random-quote');
        const data = await res.json();
        typingEngine.loadText(data.quote, { title: 'Inspirational Quote', target_wpm: 35, min_accuracy: 90 });
        const titleEl = document.getElementById('activeLevelTitle');
        if (titleEl) titleEl.textContent = 'Quote Practice Mode';
      } catch (e) {
        console.error(e);
      }
    });

    modeWordsBtn.addEventListener('click', () => {
      setModeActive(modeWordsBtn);
      typingEngine.mode = 'words';
      const wordBank = "world code system build program future modern design focus rhythm speed pulse dexterity champion victory logic power matrix lightning quick stream target create balance dynamic agility neural cyber";
      const sample = wordBank.split(' ').sort(() => 0.5 - Math.random()).slice(0, 25).join(' ');
      typingEngine.loadText(sample, { title: '25 Words Sprint', target_wpm: 40, min_accuracy: 92 });
      const titleEl = document.getElementById('activeLevelTitle');
      if (titleEl) titleEl.textContent = '25 Words Free Sprint';
    });
  }

  function setModeActive(activeBtn) {
    [modeLevelBtn, modeQuoteBtn, modeWordsBtn].forEach(btn => {
      if (btn) {
        btn.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-300');
        btn.classList.add('bg-gray-800/40', 'border-gray-700/60', 'text-gray-400');
      }
    });
    activeBtn.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-300');
    activeBtn.classList.remove('bg-gray-800/40', 'border-gray-700/60', 'text-gray-400');
  }

  // Student Profile Switcher Modal
  const studentBtn = document.getElementById('studentProfileBtn');
  const studentModal = document.getElementById('studentProfileModal');
  const studentInput = document.getElementById('studentUsernameInput');
  const saveStudentBtn = document.getElementById('saveStudentBtn');
  const closeStudentModalBtn = document.getElementById('closeStudentModalBtn');

  if (studentBtn && studentModal) {
    studentBtn.addEventListener('click', () => {
      studentModal.classList.remove('hidden');
      if (studentInput) studentInput.focus();
    });
  }

  if (closeStudentModalBtn && studentModal) {
    closeStudentModalBtn.addEventListener('click', () => {
      studentModal.classList.add('hidden');
    });
  }

  if (saveStudentBtn && studentInput) {
    saveStudentBtn.addEventListener('click', () => {
      const name = studentInput.value.trim();
      if (!name) return;

      fetch('/api/session/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.location.reload();
        }
      });
    });
  }
});

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('typepulse_theme', theme);
}
