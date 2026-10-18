# TypePulse - Modern Typing Mastery Platform 🚀

A modern, high-performance typing test and skill progression platform built with Flask, SQLite, Tailwind CSS, and Web Audio API.

---

## ✨ Features

### 1. Modern Minimalist UI & Cyber Themes
- **Sleek Aesthetic**: Inspired by Monkeytype and Keybr with glassmorphism and animated glow effects.
- **Multiple Themes**:
  - `Midnight Cyber` (Default Dark Slate & Neon Cyan)
  - `Monkey Carbon` (Charcoal & Amber Gold)
  - `Retro Synth` (Deep Purple & Neon Pink)
  - `Clean Light` (Minimalist Daylight mode)
- **Fluid Blinking Caret**: Smooth tracking caret with zero-lag position interpolation.
- **Real-time Heads-up Display (HUD)**: Live Net WPM, Raw WPM, Accuracy %, and elapsed time counters.

### 2. Tactile Mechanical Keyboard Audio Synthesizer
- Built using native **Web Audio API** (zero external mp3 files required, 100% offline support).
- Switch Options:
  - **Clicky (Blue Switches)**: Sharp mechanical snap and spring ping.
  - **Thock (Box Navy / Lubed Linear)**: Deep, resonant wooden thock sound.
  - **Tactile (Brown Switches)**: Subtle tactile bump.
  - **Mute**: Silent practice mode.
- Celebratory harmonic chord on completing a level, and subtle audio cues on errors.

### 3. Progressive 10-Stage Level Curriculum
Each level has strict unlock criteria (**Target WPM** and **Min Accuracy %**):
1. **Level 1: Home Row Foundations** (A S D F J K L ;)
2. **Level 2: Home Row Fluency** (Fluid home row sentence cadence)
3. **Level 3: Top Row Reach** (E, R, U, I, O vowels and reach keys)
4. **Level 4: Bottom Row Navigation** (C, V, B, N, M lower dexterity)
5. **Level 5: Common English Rhythm** (Top 100 most frequent English words)
6. **Level 6: Capitalization & Punctuation** (Shift keys, commas, apostrophes, semicolons)
7. **Level 7: Number Row & Mixed Symbols** (Numbers 0-9 and special characters)
8. **Level 8: Developer Code Syntax** (JavaScript, Python, brackets `{}`, `[]`, arrows `=>`)
9. **Level 9: High Speed Sprint** (Burst speed training)
10. **Level 10: Master Typist Final Trial** (Prose, eloquence, and grandmaster trial)

### 4. Interactive Virtual On-Screen Keyboard
- Highlights keys as they are pressed with dynamic feedback.
- **Next-Key Illumination**: Pulses the exact next key you need to press.
- **Color-Coded Finger Guidance**: Shows finger zones (Pinky, Ring, Middle, Index, Thumbs) so typists learn touch-typing without looking down.
- One-click toggle to show or hide the virtual keyboard.

### 5. Detailed Test Analytics & Trajectory Chart
- Results Modal shows:
  - Star rating: ★ (Bronze), ★★ (Silver), ★★★ (Gold)
  - Net WPM, Raw WPM, Accuracy %, Total Errors, Time Taken
  - Interactive **Chart.js** Speed Trajectory graph showing second-by-second WPM acceleration.
  - Confetti celebration upon passing!

### 6. Admin Panel (`/admin`)
- **Default Credentials**:
  - **Username**: `admin`
  - **Password**: `admin123`
- **Dashboard KPIs**: Total tests taken, platform average WPM, overall pass rate %, active typists count.
- **Levels & Lessons Manager (Full CRUD)**:
  - Add new levels with custom practice text, target WPM, min accuracy, and category.
  - Edit existing levels in real-time.
  - Delete or reorder levels.
- **Student Performance Audit Logs**:
  - Live stream of all test submissions with telemetry.
  - Searchable by student name.
  - One-click **Export to CSV** for records, grading, or reports.
- **Platform Configuration**:
  - Toggle level locking rule (enforced progression vs free play).
  - Update site title & header announcements.
  - Change admin password securely.

---

## 🚀 Quick Start Guide

### Option 1: One-Click Windows Launcher
Double-click `run.bat` in this folder.

### Option 2: Command Line
```powershell
python app.py
```

Then open your browser and visit:
- **Typing Practice Arena**: [http://127.0.0.1:5000](http://127.0.0.1:5000)
- **Levels Roadmap**: [http://127.0.0.1:5000/levels](http://127.0.0.1:5000/levels)
- **Leaderboard**: [http://127.0.0.1:5000/leaderboard](http://127.0.0.1:5000/leaderboard)
- **Admin Control Center**: [http://127.0.0.1:5000/admin/login](http://127.0.0.1:5000/admin/login)

---

## ⌨️ Keyboard Shortcuts
- `Tab + Enter`: Instant test restart.
- Click anywhere on the text stream to regain focus.
