// Web Component for the Lotto Ball
class LottoBall extends HTMLElement {
  static get observedAttributes() {
    return ['number', 'size'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  getBallColor(num) {
    // Standard Lotto Ball Colors (Korean Style)
    if (num <= 10) return 'oklch(0.85 0.2 85)';   // Yellow/Gold
    if (num <= 20) return 'oklch(0.65 0.18 250)'; // Blue
    if (num <= 30) return 'oklch(0.65 0.22 25)';  // Red
    if (num <= 40) return 'oklch(0.55 0.05 240)'; // Gray/Dark
    return 'oklch(0.75 0.18 145)';                // Green
  }

  render() {
    const number = this.getAttribute('number') || '?';
    const size = this.getAttribute('size') || 'var(--ball-size, 3.5rem)';
    const color = this.getBallColor(parseInt(number));
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: ${size};
          height: ${size};
          aspect-ratio: 1;
        }
        .ball {
          width: 100%;
          height: 100%;
          background: ${color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: calc(${size} * 0.4);
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          position: relative;
          box-shadow: 
            0 8px 16px var(--ball-shadow, rgba(0,0,0,0.15)),
            inset -4px -4px 8px rgba(0,0,0,0.2),
            inset 4px 4px 8px rgba(255,255,255,0.3);
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          user-select: none;
        }
        /* Glossy effect */
        .ball::after {
          content: '';
          position: absolute;
          top: 15%;
          left: 15%;
          width: 40%;
          height: 25%;
          background: linear-gradient(to bottom, rgba(255,255,255,0.4), transparent);
          border-radius: 50%;
          transform: rotate(-25deg);
        }
        @keyframes popIn {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
      </style>
      <div class="ball">${number}</div>
    `;
  }
}

if (!customElements.get('lotto-ball')) {
  customElements.define('lotto-ball', LottoBall);
}

// State Management
let currentNumbers = [];
let history = JSON.parse(localStorage.getItem('lotto-history') || '[]');

// DOM Elements
const ballContainer = document.getElementById('ball-container');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const historyList = document.getElementById('history-list');

function generateNumbers() {
  const numbers = new Set();
  while (numbers.size < 6) {
    const randomNum = Math.floor(Math.random() * 45) + 1;
    numbers.add(randomNum);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

function saveToHistory(numbers) {
  const item = {
    id: Date.now(),
    numbers: [...numbers],
    timestamp: new Date().toLocaleTimeString()
  };
  history.unshift(item);
  history = history.slice(0, 10); // Keep last 10
  localStorage.setItem('lotto-history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = history.map(item => `
    <div class="history-item">
      <div class="history-balls">
        ${item.numbers.map(n => `<lotto-ball number="${n}" size="1.8rem"></lotto-ball>`).join('')}
      </div>
      <div class="history-timestamp">${item.timestamp}</div>
    </div>
  `).join('');
}

async function updateUI() {
  // Disable button during animation
  generateBtn.disabled = true;
  copyBtn.style.display = 'none';

  // Clear existing balls
  ballContainer.innerHTML = '';

  currentNumbers = generateNumbers();

  // Create balls with sequential delay
  for (let i = 0; i < currentNumbers.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 150));
    const ball = document.createElement('lotto-ball');
    ball.setAttribute('number', currentNumbers[i]);
    ballContainer.appendChild(ball);
  }

  saveToHistory(currentNumbers);
  copyBtn.style.display = 'grid';
  generateBtn.disabled = false;
}

async function copyToClipboard() {
  if (currentNumbers.length === 0) return;
  
  const text = currentNumbers.join(', ');
  try {
    await navigator.clipboard.writeText(text);
    
    // Simple feedback
    const originalContent = copyBtn.innerHTML;
    copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    copyBtn.style.color = 'oklch(0.7 0.2 145)';
    
    setTimeout(() => {
      copyBtn.innerHTML = originalContent;
      copyBtn.style.color = '';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

// Event Listeners
generateBtn.addEventListener('click', updateUI);
copyBtn.addEventListener('click', copyToClipboard);

// Initial State
window.addEventListener('DOMContentLoaded', () => {
  renderHistory();
});
