import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const TARGET_MATCHED = 30;
const BATCH = 25;
const TAG_PATH = 'conf/local_tag.md';
const AGENT_PATH = 'agents/student.md';
const OUTPUT_PATH = 'jobs.json';

function readTag() {
  const text = readFileSync(TAG_PATH, 'utf-8').trim();
  const line = text.split('\n')[0].trim();
  return line.replace(/ sursa:.*$/, '');
}

function readAgentPrompt() {
  return readFileSync(AGENT_PATH, 'utf-8').trim();
}

function runOpencode(promptText, timeout = 180000) {
  const stdout = execSync(
    `opencode run --model opencode/big-pickle --format json --dangerously-skip-permissions`,
    { input: promptText, timeout, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, shell: true });

  let text = '';
  for (const line of stdout.split('\n').filter(l => l.trim())) {
    try { const ev = JSON.parse(line); if (ev.type === 'text') text += ev.part?.text || ''; } catch {}
  }
  return text.trim();
}

function extractJsonArray(text) {
  const stripped = text.replace(/```json\s*|\s*```/g, '');
  const match = stripped.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try { return JSON.parse(match[0]); } catch { return []; }
}

function generateKeywords(agentPrompt) {
  const prompt = `${agentPrompt}

Based on the skills and profile above, generate a JSON array of 30 single-word or short-phrase search keywords to find suitable job opportunities for this student on a Romanian job search API (peviitor.ro).

Rules:
- Each keyword should be a short string (1-3 words)
- Include specific skills from the profile (e.g. languages, tools, domains)
- Include general entry-level keywords: "internship", "junior", "entry level", "student"
- Include broad categories: "administrativ", "call center", "customer support", "data entry", "content"
- Cover diverse areas a humanities student could work in: "translator", "editor", "redactor", "scriitor", "PR", "marketing", "resurse umane", "secretara", "operator"
- Focus on finding ANY suitable jobs, not just perfect matches

Return ONLY the JSON array, no other text. Example: ["internship", "junior", "translator", "editor", "administrativ"]`;

  const result = runOpencode(prompt);
  return extractJsonArray(result);
}

async function getDesc(job) {
  try {
    const url = job.job_link || job.url;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (ldMatch) { try { const ld = JSON.parse(ldMatch[1]); if (ld.description) return ld.description; } catch {} }
    const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    if (metaMatch) return metaMatch[1];
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const idx = text.search(/about.?the.?job|descrierea.?postului|descriere/i);
    return idx > 0 ? text.slice(idx, idx + 2000) : text.slice(0, 1500);
  } catch (e) { process.stderr.write(`    getDesc error for ${job.title}: ${e}\n`); return ''; }
}

const tag = readTag();
let agentPrompt = readAgentPrompt();

// Taie sectiunea ## Output Format ca sa nu contrazica instructiunile de evaluare
agentPrompt = agentPrompt.replace(/\n## Output Format[\s\S]*$/, '');

process.stdout.write(`Tag: ${tag}\n`);

process.stdout.write('Generating keywords from student profile...\n');
const keywords = generateKeywords(agentPrompt);
process.stdout.write(`Generated ${keywords.length} keywords: ${keywords.join(', ')}\n`);

const seen = new Set();
const allJobs = [];
for (const q of keywords) {
  try {
    const r = await fetch(`https://api.peviitor.ro/v1/search/?q=${encodeURIComponent(q)}&page=1`);
    const d = await r.json();
    for (const doc of d.response?.docs || []) {
      const key = doc.url || doc.title || JSON.stringify(doc);
      if (!seen.has(key)) { seen.add(key); allJobs.push(doc); }
    }
    } catch (e) { process.stderr.write(`  API error for keyword "${q}": ${e}\n`); }
}

if (allJobs.length < 50) {
  const fallback = ['internship', 'junior', 'entry level', 'angajam', 'student', 'tester', 'operator', 'asistent', 'call center', 'customer support', 'data entry'];
  process.stdout.write(`Only ${allJobs.length} jobs found, trying fallback keywords...\n`);
  for (const q of fallback) {
    try {
      const r = await fetch(`https://api.peviitor.ro/v1/search/?q=${encodeURIComponent(q)}&page=1`);
      const d = await r.json();
      for (const doc of d.response?.docs || []) {
        const key = doc.url || doc.title || JSON.stringify(doc);
        if (!seen.has(key)) { seen.add(key); allJobs.push(doc); }
      }
    } catch (e) { process.stderr.write(`  API error for fallback "${q}": ${e}\n`); }
  }
}
process.stdout.write(`Found ${allJobs.length} unique jobs total\n`);

const matchedJobs = [];

for (let start = 0; start < allJobs.length && matchedJobs.length < TARGET_MATCHED; start += BATCH) {
  const batch = allJobs.slice(start, start + BATCH);
  process.stdout.write(`\nBatch ${start/BATCH + 1}: fetching ${batch.length} descriptions...\n`);
  const descs = await Promise.all(batch.map(j => getDesc(j)));

  const jobList = batch.map((j, i) =>
    `${i+1}. ${j.title} @ ${j.company}
   Loc: ${JSON.stringify(j.location)} | Salariu: ${JSON.stringify(j.salary)}
   ${(descs[i] || '(fara descriere)').slice(0, 1200)}`
  ).join('\n');

  const evalPrompt = `${agentPrompt}

Pentru fiecare job de mai jos, decide dacă e potrivit pentru un student ca tine (internship/junior/mid).
Raspunde DOAR cu JSON array:
[{"title":"...", "match":bool, "matchPercentage":0-100, "reason":"..."}]

---
${jobList}`;

  process.stdout.write(`  Evaluating ${batch.length} jobs...\n`);
  const results = extractJsonArray(runOpencode(evalPrompt));

  for (let i = 0; i < Math.min(results.length, batch.length); i++) {
    if (results[i]?.match && matchedJobs.length < TARGET_MATCHED) {
      matchedJobs.push({
        url: batch[i].url,
        title: batch[i].title,
        company: batch[i].company,
        location: batch[i].location,
        salary: batch[i].salary,
        date: batch[i].date,
        status: batch[i].status,
        _version_: batch[i]._version_,
        _root_: batch[i]._root_,
        f_tag: [tag],
        matchPercentage: results[i].matchPercentage,
        reason: results[i].reason,
      });
    }
  }
  process.stdout.write(`  Matched so far: ${matchedJobs.length}/${TARGET_MATCHED}\n`);
}

writeFileSync(OUTPUT_PATH, JSON.stringify(matchedJobs, null, 2));
process.stdout.write(`\nDone! ${matchedJobs.length} matched jobs saved to ${OUTPUT_PATH}\n`);
