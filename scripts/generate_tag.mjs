import { readFileSync, appendFileSync } from 'fs';
import { execSync } from 'child_process';
import { parseArgs } from 'util';

const args = parseArgs({
  options: {
    facultate: { type: 'string', required: true },
    universitate: { type: 'string', required: true },
  },
});

const facultate = args.values.facultate;
const universitate = args.values.universitate;

const CSV_PATH = 'centralized/unicodes.csv';

function readExistingTags() {
  try {
    const text = readFileSync(CSV_PATH, 'utf-8').trim();
    const lines = text.split('\n').slice(1).filter(l => l.trim());
    return lines.map(l => {
      const [tag, ...rest] = l.split(',');
      return { tag, name: rest.join(',') };
    });
  } catch {
    return [];
  }
}

function runOpencode(promptText) {
  const args = [
    'run', '--model', 'opencode/big-pickle', '--format', 'json',
    '--dangerously-skip-permissions', promptText,
  ];
  const cmd = `opencode ${args.map(a => JSON.stringify(a)).join(' ')}`;
  const stdout = execSync(cmd,
    { timeout: 180000, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, shell: true });

  let text = '';
  for (const line of stdout.split('\n').filter(l => l.trim())) {
    try {
      const ev = JSON.parse(line);
      if (ev.type === 'text') text = ev.part?.text || '';
    } catch {}
  }
  return text.trim();
}

const existingTags = readExistingTags();
const existingTagValues = existingTags.map(t => t.tag);
console.error(`Existing tags: ${existingTagValues.join(', ') || '(none)'}`);

let tag = '';

for (let attempt = 0; attempt < 5; attempt++) {
  const prompt = `Esti un generator de tag-uri unice pentru facultati.

Formuleaza tag-ul astfel:
1. Abreviaza universitatea: ia prima litera doar din cuvintele care numesc universitatea (ignora "din", "de", "si", orase/locatii)
2. Adauga "F" pentru "Facultatea"
3. Abreviaza facultatea: ia prima litera din cuvintele care numesc facultatea (ignora "Facultatea", "de", "si", "din", "ale", "a")

Exemple:
- Universitatea Babes-Bolyai din Cluj-Napoca + Facultatea de Psihologie si Stiinte ale Educatiei = UBBFPSE
- Universitatea Babes-Bolyai din Cluj-Napoca + Facultatea de Matematica si Informatica = UBBFMI
- Universitatea Babes-Bolyai din Cluj-Napoca + Facultatea de Litere = UBBFL
- Universitatea Tehnica din Cluj-Napoca + Facultatea de Automatica si Calculatoare = UTCNAC (NU "F" aici)
- Universitatea Transilvania din Brasov + Facultatea de Matematica si Informatica Aplicata = UBVFMIIA

Exista deja aceste tag-uri:
${existingTagValues.map(t => `- ${t}`).join('\n')}

Acum genereaza un tag unic pentru:
Universitate: "${universitate}"
Facultate: "${facultate}"

Raspunde DOAR cu tag-ul generat (doar litere mari, fara spatii sau caractere speciale).`;

  const result = runOpencode(prompt);
  const generated = result.replace(/[^A-Za-z0-9]/g, '').toUpperCase().trim();

  if (!generated || generated.length < 3) {
    console.error(`Attempt ${attempt + 1}: invalid tag "${result}"`);
    continue;
  }

  if (existingTagValues.includes(generated)) {
    console.error(`Attempt ${attempt + 1}: tag "${generated}" already exists, retrying...`);
    continue;
  }

  tag = generated;
  break;
}

if (!tag) {
  let counter = 1;
  const base = universitate
    .split(/[\s-]+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 4) + 'F' + facultate
    .replace(/^facultatea\s+de\s+/i, '')
    .split(/[\s-]+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 4);

  while (existingTagValues.includes(base + (counter > 1 ? counter : ''))) {
    counter++;
  }
  tag = base + (counter > 1 ? counter : '');
  console.error(`Fallback: generated "${tag}" algorithmically`);
}

const existing = readFileSync(CSV_PATH, 'utf-8');
const sep = existing.endsWith('\n') ? '' : '\n';
const newLine = `${sep}${tag},${universitate},${facultate}`;
appendFileSync(CSV_PATH, newLine, 'utf-8');
console.error(`Appended to ${CSV_PATH}: ${tag},${universitate},${facultate}`);
console.log(tag);
