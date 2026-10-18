// Levels Management & Progression System for Frontend

class LevelController {
  constructor(typingEngine) {
    this.engine = typingEngine;
    this.levels = [];
    this.highestUnlocked = 1;
    this.currentLevelNum = 1;
    this.enforceLock = true;
    this.init();
  }

  async init() {
    await this.fetchLevels();
    this.renderLevelPills();
    this.renderLevelsMap();

    // Check URL parameters for ?level=X
    const urlParams = new URLSearchParams(window.location.search);
    const paramLevel = parseInt(urlParams.get('level'));
    if (paramLevel && this.isUnlocked(paramLevel)) {
      this.selectLevel(paramLevel);
    } else {
      this.selectLevel(1);
    }
  }

  async fetchLevels() {
    try {
      const res = await fetch('/api/levels');
      const data = await res.json();
      this.levels = data.levels || [];
      this.highestUnlocked = data.highest_unlocked || 1;
      this.enforceLock = data.enforce_lock !== false;
    } catch (e) {
      console.error("Failed to load levels", e);
    }
  }

  isUnlocked(lvlNum) {
    if (!this.enforceLock) return true;
    return lvlNum <= this.highestUnlocked;
  }

  getLevel(lvlNum) {
    return this.levels.find(l => l.level_number === lvlNum) || null;
  }

  selectLevel(lvlNum) {
    const lvl = this.getLevel(lvlNum);
    if (!lvl) return;

    if (!this.isUnlocked(lvlNum)) {
      alert(`Level ${lvlNum} is locked! Complete previous levels to unlock.`);
      return;
    }

    this.currentLevelNum = lvlNum;

    // Update active level UI pills in index
    document.querySelectorAll('.level-pill').forEach(pill => {
      const pNum = parseInt(pill.getAttribute('data-level'));
      if (pNum === lvlNum) {
        pill.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-300', 'font-bold');
        pill.classList.remove('bg-gray-800/60', 'border-gray-700/60', 'text-gray-400');
      } else {
        pill.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-300', 'font-bold');
        if (this.isUnlocked(pNum)) {
          pill.classList.add('bg-gray-800/60', 'border-gray-700/60', 'text-gray-300');
        }
      }
    });

    // Update Level Banner info on index.html
    const badgeEl = document.getElementById('activeLevelBadge');
    const titleEl = document.getElementById('activeLevelTitle');
    const descEl = document.getElementById('activeLevelDesc');
    const targetEl = document.getElementById('activeLevelTarget');

    if (badgeEl) badgeEl.textContent = `LEVEL ${lvl.level_number}`;
    if (titleEl) titleEl.textContent = lvl.title;
    if (descEl) descEl.textContent = lvl.description;
    if (targetEl) targetEl.textContent = `🎯 Target: ${lvl.target_wpm} WPM | ${lvl.min_accuracy}% Accuracy`;

    // Load into typing engine
    if (this.engine) {
      this.engine.mode = 'level';
      this.engine.loadText(lvl.content, lvl);
    }
  }

  selectNextLevel() {
    const nextNum = this.currentLevelNum + 1;
    if (this.getLevel(nextNum)) {
      this.selectLevel(nextNum);
    } else {
      alert("Congratulations! You have conquered all available levels!");
    }
  }

  renderLevelPills() {
    const container = document.getElementById('levelPillsContainer');
    if (!container) return;

    container.innerHTML = '';
    this.levels.forEach(lvl => {
      const unlocked = this.isUnlocked(lvl.level_number);
      const isCurrent = (lvl.level_number === this.currentLevelNum);

      const pill = document.createElement('button');
      pill.className = `level-pill px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
        isCurrent
          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
          : unlocked
          ? 'bg-gray-800/60 border-gray-700/60 text-gray-300 hover:border-gray-500'
          : 'bg-gray-900/40 border-gray-800 text-gray-600 opacity-60 cursor-not-allowed'
      }`;
      pill.setAttribute('data-level', lvl.level_number);

      if (!unlocked) {
        pill.innerHTML = `<i class="fa-solid fa-lock text-[10px]"></i> Lvl ${lvl.level_number}`;
      } else if (lvl.passed) {
        pill.innerHTML = `<i class="fa-solid fa-check text-emerald-400 text-[10px]"></i> Lvl ${lvl.level_number}`;
      } else {
        pill.innerHTML = `Lvl ${lvl.level_number}`;
      }

      pill.addEventListener('click', () => {
        this.selectLevel(lvl.level_number);
      });

      container.appendChild(pill);
    });
  }

  renderLevelsMap() {
    const container = document.getElementById('levelsMapContainer');
    if (!container) return;

    container.innerHTML = '';

    // Calculate progression stats
    const totalLevels = this.levels.length;
    const passedCount = this.levels.filter(l => l.passed).length;
    const progressPct = totalLevels > 0 ? Math.round((passedCount / totalLevels) * 100) : 0;

    const progBar = document.getElementById('mapProgressBar');
    const progText = document.getElementById('mapProgressText');
    if (progBar) progBar.style.width = `${progressPct}%`;
    if (progText) progText.textContent = `${passedCount} of ${totalLevels} Levels Completed (${progressPct}%)`;

    this.levels.forEach(lvl => {
      const unlocked = this.isUnlocked(lvl.level_number);
      const card = document.createElement('div');
      card.className = `glass-panel rounded-2xl p-6 transition-all border ${
        unlocked 
          ? 'border-gray-800 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5' 
          : 'border-gray-900 opacity-60 bg-gray-950/40'
      }`;

      // Star display
      let starIcons = '';
      for (let s = 1; s <= 3; s++) {
        if (s <= (lvl.stars || 0)) {
          starIcons += '<i class="fa-solid fa-star text-amber-400 text-sm"></i>';
        } else {
          starIcons += '<i class="fa-regular fa-star text-gray-700 text-sm"></i>';
        }
      }

      card.innerHTML = `
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              unlocked 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'bg-gray-800 text-gray-600'
            }">
              ${unlocked ? lvl.level_number : '<i class="fa-solid fa-lock"></i>'}
            </span>
            <div>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-800 text-cyan-400 border border-gray-700">
                ${lvl.category || 'General'}
              </span>
              <h3 class="text-lg font-bold text-white mt-1">${lvl.title}</h3>
            </div>
          </div>
          <div class="flex items-center gap-1">
            ${starIcons}
          </div>
        </div>

        <p class="text-sm text-gray-400 mb-5 min-h-[40px] leading-relaxed">${lvl.description || 'Master this level to boost your speed.'}</p>

        <div class="grid grid-cols-2 gap-3 text-xs mb-5 p-3 rounded-xl bg-gray-900/60 border border-gray-800/80">
          <div>
            <span class="text-gray-500 block">Target Speed:</span>
            <span class="font-bold text-cyan-400 text-sm">${lvl.target_wpm} WPM</span>
          </div>
          <div>
            <span class="text-gray-500 block">Min Accuracy:</span>
            <span class="font-bold text-emerald-400 text-sm">${lvl.min_accuracy}%</span>
          </div>
          ${lvl.best_wpm > 0 ? `
          <div class="col-span-2 pt-2 border-t border-gray-800 flex justify-between items-center">
            <span class="text-gray-500">Your Best:</span>
            <span class="font-bold text-amber-400">${lvl.best_wpm} WPM</span>
          </div>` : ''}
        </div>

        <div>
          ${unlocked ? `
            <a href="/?level=${lvl.level_number}" class="block w-full py-2.5 text-center text-sm font-semibold rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black transition-all">
              ${lvl.passed ? 'Practice Again' : 'Start Level'}
            </a>
          ` : `
            <button disabled class="w-full py-2.5 text-center text-sm font-semibold rounded-xl bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">
              <i class="fa-solid fa-lock mr-1.5"></i> Locked
            </button>
          `}
        </div>
      `;

      container.appendChild(card);
    });
  }
}

window.LevelController = LevelController;
