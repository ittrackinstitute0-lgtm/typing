// Virtual On-Screen Keyboard with Finger Guides & Next-Key Illumination

const KEY_LAYOUT = [
  [
    { code: 'Backquote', label: '`', shift: '~', finger: 'finger-l-pinky' },
    { code: 'Digit1', label: '1', shift: '!', finger: 'finger-l-pinky' },
    { code: 'Digit2', label: '2', shift: '@', finger: 'finger-l-ring' },
    { code: 'Digit3', label: '3', shift: '#', finger: 'finger-l-middle' },
    { code: 'Digit4', label: '4', shift: '$', finger: 'finger-l-index' },
    { code: 'Digit5', label: '5', shift: '%', finger: 'finger-l-index' },
    { code: 'Digit6', label: '6', shift: '^', finger: 'finger-r-index' },
    { code: 'Digit7', label: '7', shift: '&', finger: 'finger-r-index' },
    { code: 'Digit8', label: '8', shift: '*', finger: 'finger-r-middle' },
    { code: 'Digit9', label: '9', shift: '(', finger: 'finger-r-ring' },
    { code: 'Digit0', label: '0', shift: ')', finger: 'finger-r-pinky' },
    { code: 'Minus', label: '-', shift: '_', finger: 'finger-r-pinky' },
    { code: 'Equal', label: '=', shift: '+', finger: 'finger-r-pinky' },
    { code: 'Backspace', label: '⌫', width: 'w-16', finger: 'finger-r-pinky' }
  ],
  [
    { code: 'Tab', label: 'Tab', width: 'w-14', finger: 'finger-l-pinky' },
    { code: 'KeyQ', label: 'Q', finger: 'finger-l-pinky' },
    { code: 'KeyW', label: 'W', finger: 'finger-l-ring' },
    { code: 'KeyE', label: 'E', finger: 'finger-l-middle' },
    { code: 'KeyR', label: 'R', finger: 'finger-l-index' },
    { code: 'KeyT', label: 'T', finger: 'finger-l-index' },
    { code: 'KeyY', label: 'Y', finger: 'finger-r-index' },
    { code: 'KeyU', label: 'U', finger: 'finger-r-index' },
    { code: 'KeyI', label: 'I', finger: 'finger-r-middle' },
    { code: 'KeyO', label: 'O', finger: 'finger-r-ring' },
    { code: 'KeyP', label: 'P', finger: 'finger-r-pinky' },
    { code: 'BracketLeft', label: '[', shift: '{', finger: 'finger-r-pinky' },
    { code: 'BracketRight', label: ']', shift: '}', finger: 'finger-r-pinky' },
    { code: 'Backslash', label: '\\', shift: '|', finger: 'finger-r-pinky' }
  ],
  [
    { code: 'CapsLock', label: 'Caps', width: 'w-16', finger: 'finger-l-pinky' },
    { code: 'KeyA', label: 'A', finger: 'finger-l-pinky' },
    { code: 'KeyS', label: 'S', finger: 'finger-l-ring' },
    { code: 'KeyD', label: 'D', finger: 'finger-l-middle' },
    { code: 'KeyF', label: 'F', finger: 'finger-l-index' },
    { code: 'KeyG', label: 'G', finger: 'finger-l-index' },
    { code: 'KeyH', label: 'H', finger: 'finger-r-index' },
    { code: 'KeyJ', label: 'J', finger: 'finger-r-index' },
    { code: 'KeyK', label: 'K', finger: 'finger-r-middle' },
    { code: 'KeyL', label: 'L', finger: 'finger-r-ring' },
    { code: 'Semicolon', label: ';', shift: ':', finger: 'finger-r-pinky' },
    { code: 'Quote', label: '\'', shift: '"', finger: 'finger-r-pinky' },
    { code: 'Enter', label: 'Enter ↵', width: 'w-20', finger: 'finger-r-pinky' }
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 'w-20', finger: 'finger-l-pinky' },
    { code: 'KeyZ', label: 'Z', finger: 'finger-l-pinky' },
    { code: 'KeyX', label: 'X', finger: 'finger-l-ring' },
    { code: 'KeyC', label: 'C', finger: 'finger-l-middle' },
    { code: 'KeyV', label: 'V', finger: 'finger-l-index' },
    { code: 'KeyB', label: 'B', finger: 'finger-l-index' },
    { code: 'KeyN', label: 'N', finger: 'finger-r-index' },
    { code: 'KeyM', label: 'M', finger: 'finger-r-index' },
    { code: 'Comma', label: ',', shift: '<', finger: 'finger-r-middle' },
    { code: 'Period', label: '.', shift: '>', finger: 'finger-r-ring' },
    { code: 'Slash', label: '/', shift: '?', finger: 'finger-r-pinky' },
    { code: 'ShiftRight', label: 'Shift', width: 'w-20', finger: 'finger-r-pinky' }
  ],
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 'w-14', finger: 'finger-l-pinky' },
    { code: 'AltLeft', label: 'Alt', width: 'w-12', finger: 'finger-thumb' },
    { code: 'Space', label: '␣ Space', width: 'flex-1 max-w-sm', finger: 'finger-thumb' },
    { code: 'AltRight', label: 'Alt', width: 'w-12', finger: 'finger-thumb' },
    { code: 'ControlRight', label: 'Ctrl', width: 'w-14', finger: 'finger-r-pinky' }
  ]
];

class VirtualKeyboard {
  constructor(containerId = 'virtualKeyboard') {
    this.container = document.getElementById(containerId);
    this.keyMap = new Map();
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    KEY_LAYOUT.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'flex justify-center gap-1.5 my-1';

      row.forEach(keyDef => {
        const keyEl = document.createElement('div');
        const widthClass = keyDef.width || 'w-10';
        keyEl.className = `virtual-key ${widthClass} ${keyDef.finger} flex flex-col items-center justify-center cursor-pointer transition-all`;
        keyEl.setAttribute('data-code', keyDef.code);

        if (keyDef.shift) {
          keyEl.innerHTML = `<span class="text-[9px] text-gray-400 -mb-1">${keyDef.shift}</span><span class="text-xs">${keyDef.label}</span>`;
        } else {
          keyEl.innerHTML = `<span class="text-xs">${keyDef.label}</span>`;
        }

        rowDiv.appendChild(keyEl);
        this.keyMap.set(keyDef.code, keyEl);
      });

      this.container.appendChild(rowDiv);
    });
  }

  pressKey(code) {
    const el = this.keyMap.get(code);
    if (el) {
      el.classList.add('active-press');
      setTimeout(() => {
        el.classList.remove('active-press');
      }, 120);
    }
  }

  highlightNext(char) {
    // Clear previous target
    this.keyMap.forEach(el => el.classList.remove('target-next'));
    if (!char) return;

    let targetCode = null;
    const lower = char.toLowerCase();

    if (char === ' ') targetCode = 'Space';
    else if (char === '\n') targetCode = 'Enter';
    else if (/[a-z]/.test(lower)) targetCode = `Key${lower.toUpperCase()}`;
    else if (/[0-9]/.test(char)) targetCode = `Digit${char}`;
    else {
      // Symbols
      const symbolMap = {
        ';': 'Semicolon', ':': 'Semicolon',
        '\'': 'Quote', '"': 'Quote',
        ',': 'Comma', '<': 'Comma',
        '.': 'Period', '>': 'Period',
        '/': 'Slash', '?': 'Slash',
        '[': 'BracketLeft', '{': 'BracketLeft',
        ']': 'BracketRight', '}': 'BracketRight',
        '\\': 'Backslash', '|': 'Backslash',
        '-': 'Minus', '_': 'Minus',
        '=': 'Equal', '+': 'Equal',
        '`': 'Backquote', '~': 'Backquote',
        '!': 'Digit1', '@': 'Digit2', '#': 'Digit3',
        '$': 'Digit4', '%': 'Digit5', '^': 'Digit6',
        '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0'
      };
      targetCode = symbolMap[char];
    }

    if (targetCode && this.keyMap.has(targetCode)) {
      this.keyMap.get(targetCode).classList.add('target-next');
    }
  }
}

window.VirtualKeyboard = VirtualKeyboard;
