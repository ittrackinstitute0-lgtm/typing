// Core Typing Engine: Real-time WPM, Accuracy, Caret Tracking, Level Progression

class TypingEngine {
  constructor(options = {}) {
    this.textContainer = document.getElementById(options.textContainerId || 'typingWords');
    this.caret = document.getElementById(options.caretId || 'customCaret');
    this.wpmEl = document.getElementById(options.wpmId || 'liveWpm');
    this.accEl = document.getElementById(options.accId || 'liveAccuracy');
    this.timeEl = document.getElementById(options.timeId || 'liveTime');
    this.progressBar = document.getElementById(options.progressId || 'typingProgressBar');
    this.keyboard = options.keyboard || null;

    // State
    this.text = "";
    this.charElements = [];
    this.currentIndex = 0;
    this.errorsCount = 0;
    this.totalTyped = 0;
    this.startTime = null;
    this.timerInterval = null;
    this.isTestRunning = false;
    this.isTestFinished = false;

    // Level metadata
    this.currentLevel = null;
    this.mode = 'level'; // 'level', 'time', 'words', 'quote'

    // Telemetry for chart
    this.wpmTimeline = [];
    this.timelineInterval = null;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    if (this.textContainer) {
      this.textContainer.addEventListener('click', () => {
        this.focus();
      });
    }

    // Window resize readjusts caret position
    window.addEventListener('resize', () => {
      this.updateCaret();
    });
  }

  focus() {
    // Typing happens via window keydown, keeping user engaged
    this.updateCaret();
  }

  loadText(text, levelData = null) {
    this.text = text.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
    this.currentLevel = levelData;
    this.reset();
    this.renderText();
    this.updateCaret();
    if (this.keyboard && this.text.length > 0) {
      this.keyboard.highlightNext(this.text[0]);
    }
  }

  reset() {
    clearInterval(this.timerInterval);
    clearInterval(this.timelineInterval);
    this.currentIndex = 0;
    this.errorsCount = 0;
    this.totalTyped = 0;
    this.startTime = null;
    this.isTestRunning = false;
    this.isTestFinished = false;
    this.wpmTimeline = [];

    if (this.wpmEl) this.wpmEl.textContent = '0';
    if (this.accEl) this.accEl.textContent = '100%';
    if (this.timeEl) this.timeEl.textContent = '0s';
    if (this.progressBar) this.progressBar.style.width = '0%';

    if (this.charElements && this.charElements.length > 0) {
      this.charElements.forEach(el => {
        el.className = 'char-untyped';
      });
    }
    this.updateCaret();
    if (this.keyboard && this.text.length > 0) {
      this.keyboard.highlightNext(this.text[0]);
    }
  }

  renderText() {
    if (!this.textContainer) return;
    this.textContainer.innerHTML = '';
    this.charElements = [];

    // Split text into words to wrap properly in flex / inline-block
    const words = this.text.split(' ');
    let globalIndex = 0;

    words.forEach((word, wIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'inline-block whitespace-nowrap mr-2 mb-1';

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'char-untyped';
        span.setAttribute('data-index', globalIndex);
        wordSpan.appendChild(span);
        this.charElements.push(span);
        globalIndex++;
      }

      // Append space if not last word
      if (wIdx < words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.innerHTML = '&nbsp;';
        spaceSpan.className = 'char-untyped';
        spaceSpan.setAttribute('data-index', globalIndex);
        wordSpan.appendChild(spaceSpan);
        this.charElements.push(spaceSpan);
        globalIndex++;
      }

      this.textContainer.appendChild(wordSpan);
    });
  }

  updateCaret() {
    if (!this.caret || !this.charElements.length) return;

    if (this.currentIndex < this.charElements.length) {
      const targetChar = this.charElements[this.currentIndex];
      const boxRect = this.textContainer.getBoundingClientRect();
      const charRect = targetChar.getBoundingClientRect();

      const left = charRect.left - boxRect.left;
      const top = charRect.top - boxRect.top;

      this.caret.style.left = `${left}px`;
      this.caret.style.top = `${top}px`;
      this.caret.style.height = `${charRect.height || 28}px`;
      this.caret.style.display = 'block';

      // Auto scroll container into view if needed
      const scrollThreshold = this.textContainer.clientHeight - 80;
      if (top > scrollThreshold) {
        this.textContainer.scrollTop = top - 40;
      }
    } else {
      // Reached the end
      const lastChar = this.charElements[this.charElements.length - 1];
      const boxRect = this.textContainer.getBoundingClientRect();
      const charRect = lastChar.getBoundingClientRect();
      const left = (charRect.left - boxRect.left) + charRect.width;
      const top = charRect.top - boxRect.top;

      this.caret.style.left = `${left}px`;
      this.caret.style.top = `${top}px`;
    }
  }

  startTest() {
    this.isTestRunning = true;
    this.startTime = Date.now();

    this.timerInterval = setInterval(() => {
      this.updateStats();
    }, 200);

    // Track WPM trajectory every second for graph
    this.timelineInterval = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      const currentWpm = this.calculateWpm(elapsed);
      this.wpmTimeline.push({ time: Math.round(elapsed), wpm: currentWpm });
    }, 1000);
  }

  handleKeyDown(e) {
    // If inside an input or textarea modal, do not capture
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      return;
    }

    // Tab + Enter Quick Restart Shortcut
    if (e.key === 'Tab') {
      e.preventDefault();
      this.reset();
      return;
    }

    if (this.isTestFinished) {
      if (e.key === 'Enter') {
        const nextBtn = document.getElementById('modalNextLevelBtn');
        if (nextBtn && !nextBtn.classList.contains('hidden')) {
          nextBtn.click();
        } else {
          this.reset();
          const modal = document.getElementById('resultsModal');
          if (modal) modal.classList.add('hidden');
        }
      }
      return;
    }

    // Ignore modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
      return;
    }

    // Animate Virtual Keyboard
    if (this.keyboard) {
      this.keyboard.pressKey(e.code);
    }

    // Backspace handling
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.currentIndex > 0) {
        this.currentIndex--;
        const el = this.charElements[this.currentIndex];
        el.className = 'char-untyped';
        this.updateCaret();
        if (this.keyboard) {
          const nextChar = this.text[this.currentIndex];
          this.keyboard.highlightNext(nextChar);
        }
        if (window.soundManager) window.soundManager.playKeySound('backspace');
      }
      return;
    }

    // Only handle single characters
    if (e.key.length !== 1) {
      return;
    }

    e.preventDefault();

    // Start timer on first valid keypress
    if (!this.isTestRunning) {
      this.startTest();
    }

    const expectedChar = this.text[this.currentIndex];
    const typedChar = e.key;
    const currentCharEl = this.charElements[this.currentIndex];

    this.totalTyped++;

    if (typedChar === expectedChar) {
      currentCharEl.className = 'char-correct';
      if (window.soundManager) window.soundManager.playKeySound(typedChar);
    } else {
      currentCharEl.className = 'char-incorrect';
      this.errorsCount++;
      if (window.soundManager) window.soundManager.playErrorSound();
    }

    this.currentIndex++;
    this.updateStats();
    this.updateCaret();

    // Update next key on virtual keyboard
    if (this.keyboard) {
      if (this.currentIndex < this.text.length) {
        this.keyboard.highlightNext(this.text[this.currentIndex]);
      } else {
        this.keyboard.highlightNext(null);
      }
    }

    // Check if test completed
    if (this.currentIndex >= this.text.length) {
      this.finishTest();
    }
  }

  calculateWpm(elapsedSeconds) {
    if (elapsedSeconds <= 0) return 0;
    const minutes = elapsedSeconds / 60;
    // Standard typing calculation: (correct_characters / 5) / minutes
    const correctChars = Math.max(0, this.totalTyped - this.errorsCount);
    const netWpm = Math.round((correctChars / 5) / minutes);
    return Math.max(0, netWpm);
  }

  calculateRawWpm(elapsedSeconds) {
    if (elapsedSeconds <= 0) return 0;
    const minutes = elapsedSeconds / 60;
    const rawWpm = Math.round((this.totalTyped / 5) / minutes);
    return Math.max(0, rawWpm);
  }

  calculateAccuracy() {
    if (this.totalTyped === 0) return 100;
    const acc = ((this.totalTyped - this.errorsCount) / this.totalTyped) * 100;
    return Math.max(0, Math.round(acc * 10) / 10);
  }

  updateStats() {
    if (!this.startTime) return;
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    const wpm = this.calculateWpm(elapsedSeconds);
    const acc = this.calculateAccuracy();

    if (this.wpmEl) this.wpmEl.textContent = wpm;
    if (this.accEl) this.accEl.textContent = `${acc}%`;
    if (this.timeEl) this.timeEl.textContent = `${Math.round(elapsedSeconds)}s`;

    if (this.progressBar && this.text.length > 0) {
      const pct = Math.min(100, Math.round((this.currentIndex / this.text.length) * 100));
      this.progressBar.style.width = `${pct}%`;
    }
  }

  finishTest() {
    this.isTestFinished = true;
    this.isTestRunning = false;
    clearInterval(this.timerInterval);
    clearInterval(this.timelineInterval);

    const elapsedSeconds = Math.max(1, (Date.now() - this.startTime) / 1000);
    const finalWpm = this.calculateWpm(elapsedSeconds);
    const rawWpm = this.calculateRawWpm(elapsedSeconds);
    const finalAcc = this.calculateAccuracy();

    // Ensure last timeline point
    this.wpmTimeline.push({ time: Math.round(elapsedSeconds), wpm: finalWpm });

    // Send payload to backend
    const payload = {
      level_number: this.currentLevel ? this.currentLevel.level_number : null,
      mode: this.mode,
      wpm: finalWpm,
      raw_wpm: rawWpm,
      accuracy: finalAcc,
      errors_count: this.errorsCount,
      time_seconds: Math.round(elapsedSeconds * 10) / 10
    };

    fetch('/api/save-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      this.showResultModal(data, payload);
    })
    .catch(err => {
      console.error("Failed to save result", err);
      // Fallback local display
      this.showResultModal({ passed: true, stars: 1 }, payload);
    });
  }

  showResultModal(serverResp, testData) {
    const modal = document.getElementById('resultsModal');
    if (!modal) return;

    const modalTitle = document.getElementById('modalTitle');
    const modalStars = document.getElementById('modalStars');
    const modalWpm = document.getElementById('modalWpm');
    const modalAcc = document.getElementById('modalAcc');
    const modalRawWpm = document.getElementById('modalRawWpm');
    const modalTime = document.getElementById('modalTime');
    const modalErrors = document.getElementById('modalErrors');
    const modalNextLevelBtn = document.getElementById('modalNextLevelBtn');
    const modalStatusBadge = document.getElementById('modalStatusBadge');

    if (modalWpm) modalWpm.textContent = testData.wpm;
    if (modalAcc) modalAcc.textContent = `${testData.accuracy}%`;
    if (modalRawWpm) modalRawWpm.textContent = testData.raw_wpm;
    if (modalTime) modalTime.textContent = `${testData.time_seconds}s`;
    if (modalErrors) modalErrors.textContent = testData.errors_count;

    const passed = serverResp.passed;
    const stars = serverResp.stars || 0;

    // Stars HTML
    let starsHtml = '';
    for (let i = 1; i <= 3; i++) {
      if (i <= stars) {
        starsHtml += '<i class="fa-solid fa-star text-amber-400 star-glow text-2xl mx-1"></i>';
      } else {
        starsHtml += '<i class="fa-regular fa-star text-gray-600 text-2xl mx-1"></i>';
      }
    }
    if (modalStars) modalStars.innerHTML = starsHtml;

    if (passed) {
      if (modalTitle) modalTitle.innerHTML = `🎉 Level Passed!`;
      if (modalStatusBadge) {
        modalStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        modalStatusBadge.textContent = 'CRITERIA MET';
      }
      if (window.soundManager) window.soundManager.playVictoryChord();
      if (window.confetti) {
        window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      if (modalNextLevelBtn) {
        modalNextLevelBtn.classList.remove('hidden');
      }
    } else {
      if (modalTitle) modalTitle.innerHTML = `⚡ Keep Practicing!`;
      if (modalStatusBadge) {
        modalStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30';
        const targetWpm = this.currentLevel ? this.currentLevel.target_wpm : 20;
        const targetAcc = this.currentLevel ? this.currentLevel.min_accuracy : 85;
        modalStatusBadge.textContent = `TARGET: ${targetWpm} WPM | ${targetAcc}% ACC`;
      }
      if (modalNextLevelBtn) {
        modalNextLevelBtn.classList.add('hidden');
      }
    }

    // Render Speed trajectory chart
    if (window.renderSpeedChart) {
      window.renderSpeedChart(this.wpmTimeline);
    }

    modal.classList.remove('hidden');

    // Notify levels list if listener attached
    if (window.onTestFinished) {
      window.onTestFinished(serverResp);
    }
  }
}

window.TypingEngine = TypingEngine;
