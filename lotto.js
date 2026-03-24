#!/usr/bin/env node

function generateLotto() {
  const numbers = new Set();
  while (numbers.size < 6) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

const colors = [
  '\x1b[33m', // Yellow
  '\x1b[34m', // Blue
  '\x1b[31m', // Red
  '\x1b[90m', // Gray
  '\x1b[32m'  // Green
];

const reset = '\x1b[0m';
const bold = '\x1b[1m';

const numbers = generateLotto();

console.log(`\n ${bold}🍀 Today's Lucky Numbers: ${reset}\n`);

const coloredNumbers = numbers.map(n => {
  let color = colors[4]; // Green for 41-45
  if (n <= 10) color = colors[0];
  else if (n <= 20) color = colors[1];
  else if (n <= 30) color = colors[2];
  else if (n <= 40) color = colors[3];
  
  return `${color}${n.toString().padStart(2, '0')}${reset}`;
});

console.log(`    [ ${coloredNumbers.join('  ')} ]\n`);
console.log(` ${bold}Good Luck!${reset}\n`);
