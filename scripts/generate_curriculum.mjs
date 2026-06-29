import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const TAG_FILE = 'conf/local_tag.md';

function readTagFile() {
  const text = readFileSync(TAG_FILE, 'utf-8').trim();
  const lines = text.split('\n').map(l => l.trim());
  const tag = lines[0];
  const sourceLine = lines.find(l => /sursa?\s*:/i.test(l.replace(/[*"]/g, '')));
  const source = sourceLine
    ? sourceLine.replace(/^[*\s]*sursa?\s*:\s*/i, '')
    : '';

  if (!tag) throw new Error(`No tag found in ${TAG_FILE}`);
  if (!source) throw new Error(`No sursa found in ${TAG_FILE}`);

  return { tag, source };
}

function runOpencode(prompt, timeoutMs = 900000) {
  const cmd = `opencode run --model opencode/big-pickle --dangerously-skip-permissions`;
  return execSync(cmd,
    { input: prompt, timeout: timeoutMs, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, shell: true });
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findPdfUrls(html, source) {
  const found = new Set();
  // Prioritize full curriculum PDFs (licenta, master, plan)
  const priorityPatterns = [
    /href="([^"]*\b(?:licenta|master|planuri?|curricul|disciplin|programa)\b[^"]*\.pdf)"/gi,
  ];
  for (const pat of priorityPatterns) {
    for (const m of html.matchAll(pat)) {
      if (m[1]) found.add(m[1].startsWith('http') ? m[1] : new URL(m[1], source).href);
    }
  }
  // Fallback: all PDFs if none matched
  if (found.size === 0) {
    for (const m of html.matchAll(/href="([^"]*\.pdf)"/gi)) {
      if (m[1]) found.add(m[1].startsWith('http') ? m[1] : new URL(m[1], source).href);
    }
  }
  return [...found];
}

function downloadAndExtractPdfs(urls, destDir) {
  const texts = [];
  for (const url of urls) {
    const name = url.split('/').pop() || `pdf_${texts.length}.pdf`;
    const pdfPath = join(destDir, name);
    try {
      execSync(`curl -sL "${url}" -o "${pdfPath}"`, { timeout: 30000, shell: true });
      if (existsSync(pdfPath) && readFileSync(pdfPath).length > 1000) {
        const txtPath = join(destDir, name.replace(/\.pdf$/i, '') + '.txt');
        execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, { timeout: 60000, shell: true });
        if (existsSync(txtPath)) {
          const text = readFileSync(txtPath, 'utf-8').trim();
          if (text.length > 50) texts.push(text);
        }
      }
    } catch (e) {
      console.error(`  Failed to process ${name}: ${e.message}`);
    }
  }
  return texts;
}

async function main() {
  const { tag, source } = readTagFile();
  const outputPath = `filter/${tag}.md`;

  console.error(`Tag: ${tag}`);
  console.error(`Source: ${source}`);
  console.error(`Output: ${outputPath}`);

  const tmpDir = mkdtempSync(join(tmpdir(), 'curric-'));
  try {
    console.error('Fetching curriculum page...');
    const raw = execSync(`curl -sL "${source}"`, { encoding: 'utf-8', timeout: 30000, shell: true });

    // Try PDFs first (more structured data)
    const pdfUrls = findPdfUrls(raw, source);
    console.error(`Found ${pdfUrls.length} curriculum PDFs`);
    let curriculumText = '';

    if (pdfUrls.length > 0) {
      console.error('Downloading and extracting PDFs...');
      const pdfTexts = downloadAndExtractPdfs(pdfUrls, tmpDir);
      if (pdfTexts.length > 0) {
        curriculumText = pdfTexts.join('\n\n---\n\n');
        console.error(`Extracted ${curriculumText.length} chars from PDFs`);
      }
    }

    // Fallback: use stripped HTML if no usable PDF text
    if (!curriculumText) {
      console.error('No PDF text, falling back to HTML text extraction...');
      curriculumText = stripHtml(raw);
      console.error(`Stripped HTML: ${curriculumText.length} chars`);
    }

    if (!curriculumText) {
      throw new Error('No curriculum text could be extracted (PDF or HTML)');
    }

    // Phase 1: extract structure as JSON via opencode
    const extractPrompt = `Extract the curriculum data from the text below as a JSON object.

Return ONLY valid JSON with this structure:
{
  "university": "University Name",
  "faculty": "Faculty Name",
  "years": "e.g. 2026-2029",
  "specializations": [
    {
      "name": "Specialization Name",
      "years": [
        {
          "year": 1,
          "semesters": [
            {
              "semester": 1,
              "subjects": [
                {"code": "...", "name": "Subject Name"}
              ]
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Use exact subject/specialization names from the text
- Do NOT invent anything
- Group subjects by year and semester
- Output ONLY the JSON, no other text

Text:
${curriculumText.substring(0, 40000)}`;

    console.error('Phase 1: extracting curriculum structure via opencode...');
    const jsonOut = runOpencode(extractPrompt, 900000);

    const jsonMatch = jsonOut.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from opencode output');
      console.error(`Output preview: ${jsonOut.substring(0, 500)}`);
      process.exit(1);
    }
    const curriculum = JSON.parse(jsonMatch[0]);

    // Phase 2: render markdown locally
    let md = `# ${curriculum.faculty} — ${curriculum.university}\n`;
    md += `# Planuri de învățământ ${curriculum.years} (Licență)\n\n`;
    md += `> **Sursă:** ${source}\n\n`;
    md += `## Cuprins\n`;
    for (const spec of curriculum.specializations || []) {
      const anchor = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      md += `1. [${spec.name}](#${anchor})\n`;
    }

    for (const spec of curriculum.specializations || []) {
      md += `\n---\n\n`;
      md += `## ${spec.name}\n\n`;
      for (const yr of spec.years || []) {
        for (const sem of yr.semesters || []) {
          md += `### Anul ${yr.year}, Semestrul ${sem.semester}\n`;
          md += `| Cod | Denumirea disciplinei |\n`;
          md += `|-----|----------------------|\n`;
          for (const subj of sem.subjects || []) {
            md += `| ${subj.code || '-'} | ${subj.name} |\n`;
          }
          md += `\n`;
        }
      }
    }

    writeFileSync(outputPath, md.trim() + '\n', 'utf-8');
    console.error(`Done — wrote ${outputPath} (${md.length} chars)`);

  } finally {
    execSync(`rm -rf "${tmpDir}"`, { shell: true });
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
