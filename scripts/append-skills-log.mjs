import fs from 'node:fs';
import path from 'node:path';

function usage() {
  console.error('Usage: node scripts/append-skills-log.mjs "<task_summary>" "<primary_skill>" ["<secondary_skills>"] ["<outcome>"]');
}

function escapeCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

const [taskSummary, primarySkill, secondarySkills = '-', outcome = 'Completed'] = process.argv.slice(2);

if (!taskSummary || !primarySkill) {
  usage();
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), 'docs', 'skills-usage-log.md');
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const dateUtc = new Date().toISOString().slice(0, 10);
const row = `| ${escapeCell(dateUtc)} | ${escapeCell(taskSummary)} | ${escapeCell(primarySkill)} | ${escapeCell(secondarySkills)} | ${escapeCell(outcome)} |`;

let content = fs.readFileSync(filePath, 'utf8');
if (!content.endsWith('\n')) {
  content += '\n';
}

content += `${row}\n`;
fs.writeFileSync(filePath, content, 'utf8');

console.log(`Appended skills usage row: ${row}`);
