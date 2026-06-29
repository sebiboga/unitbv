import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

const TAG_PATH = 'conf/local_tag.md';
const AGENTS_DIR = 'agents';
const AGENT_FILE = `${AGENTS_DIR}/student.md`;

const tag = readFileSync(TAG_PATH, 'utf-8').split('\n')[0].trim().replace(/ sursa:.*$/, '');
const filterPath = `filter/${tag}.md`;

if (!existsSync(filterPath)) {
  console.error(`Filter file not found: ${filterPath}`);
  process.exit(1);
}

if (!existsSync(AGENTS_DIR)) {
  mkdirSync(AGENTS_DIR, { recursive: true });
}

const curriculum = readFileSync(filterPath, 'utf-8');

const prompt = `You are a generator of student agent markdown files.

Your task: generate ONLY the markdown content for a student agent file, based on the curriculum below.

RULES - READ CAREFULLY:
- Output ONLY the raw markdown content. NO greetings, NO explanations, NO "here is your file", NO "am generat", NO conversational text.
- Do NOT say you wrote or generated anything. Just output the file content directly.
- The output will be saved directly to a file. Any extra text will break the file.

Follow this structure EXACTLY, replacing placeholders with real data from the curriculum:

# Student Agent

You are **Student**, a student at the **FACULTATEA SI UNIVERSITATEA**.

## Your Profile

You are a hard-working student looking for job opportunities that match your studies.

## Your Skills (from the ${tag} curriculum)

### Category Name
- skill from curriculum
- skill from curriculum

### Another Category
- skill from curriculum

## Your Mission

When given a job description: analyze, match against your skills, score 0-100%, identify matching/missing skills, explain.

## Output Format

\`\`\`json
{
  "match": true/false,
  "matchPercentage": 0-100,
  "matchingSkills": ["skill1"],
  "missingSkills": ["skill1"],
  "explanation": "text"
}
\`\`\`

NOW, based on this curriculum:

${curriculum}

Extract skills from the subjects above and group them into logical categories. Use English. Remember: output ONLY the markdown, nothing else.`;

console.error(`Generating student agent for ${tag}...`);
const stdout = execSync(
  `opencode run --model opencode/big-pickle --format json --dangerously-skip-permissions`,
  { input: prompt, timeout: 900000, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, shell: true }
);

let content = '';
for (const line of stdout.split('\n').filter(l => l.trim())) {
  try {
    const ev = JSON.parse(line);
    if (ev.type === 'text') content += ev.part?.text || '';
  } catch {}
}

if (!content) {
  console.error('No output generated from opencode');
  process.exit(1);
}

content = content.trim();

// Strip markdown code block wrapper if present (```markdown ... ```)
content = content.replace(/^```markdown\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

// Validate content — reject conversational responses
const conversations = ['am generat', 'here is your', 'i have generated', 'i wrote', 'fisierul a fost generat', 'you can find'];
if (!content.startsWith('#') || conversations.some(c => content.toLowerCase().includes(c))) {
  console.error(`Output looks like a conversational response, not file content. First 200 chars:\n${content.slice(0, 200)}`);
  process.exit(1);
}

writeFileSync(AGENT_FILE, content, 'utf-8');
console.error(`Done — wrote ${AGENT_FILE} (${content.length} chars)`);
