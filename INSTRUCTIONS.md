# How to Add a New Job Seeker Agent

Acest document descrie procesul complet pentru a defini un **agent** care reprezintă o persoană (student/absolvent) aflată în căutarea unui loc de muncă. Agentul va analiza job descriptions și va verifica dacă skills-urile persoanei se potrivesc.

---

## 1. Creează fișierul cu profilul persoanei

În folderul `filter/`, creează un fișier `NUME.md` care conține **competențele** persoanei (de ex. curriculum-ul universitar, skill-uri tehnice, certificări etc.)

**Exemplu:** `filter/UTCNAC.md` — conține planul de învățământ al Facultății de Automatică și Calculatoare, UTCN.

Acest fișier va fi sursa de adevăr pentru skill-urile persoanei.

---

## 2. Creează agentul în opencode

Rulează comanda:

```bash
opencode agent create \
  --path repo/folder \
  --description "Descrierea agentului: ce studii are, ce caută, cum analizează joburile" \
  --mode subagent \
  --model opencode/big-pickle \
  --tools "read, grep, glob"
```

Aceasta va genera un agent config în baza de date opencode, pe baza descrierii și a fișierului din `--path`.

---

## 3. Actualizează workflow-ul n8n

În nodul **Prepare Skills Check** din workflow, înlocuiește `adaSkills` cu skill-urile persoanei extrase din fișierul `filter/NUME.md`. Structura:

```javascript
const skills = [
  {
    category: 'Nume Categorie',
    courses: [
      'Skill / Curs 1',
      'Skill / Curs 2',
    ]
  },
  // ...
];

const skillsText = skills.map(s =>
  `## ${s.category}\n${s.courses.map(c => `- ${c}`).join('\n')}`
).join('\n\n');
```

---

## 4. Adaugă f_tag în jobs.json

Pentru fiecare job din `jobs.json` care e **potrivit** pentru această persoană, adaugă:

```json
"f_tag": ["NUME"]
```

Unde `NUME` e exact numele fișierului din `filter/` (fără `.md`). Joburile pot primi multiple tag-uri dacă se potrivesc cu mai multe persoane:

```json
"f_tag": ["UTCNAC", "NUME"]
```

---

## 5. Rulează agentul local

Testează agentul direct cu opencode CLI:

```bash
opencode run --agent NUME "Analyze this job: <job_description>"
```

Sau procesează un job din `jobs.json`:

```bash
opencode run --agent NUME --file /tmp/job.txt \
  "Does this job match my skills? Return JSON."
```

---

## 6. Arhitectura completă

```
                    ┌─────────────────┐
                    │  jobs.json  │
                    │  (job listings) │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  filter/NUME.md │
                    │  (skills)       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────────┐
                    │  opencode agent     │
                    │  (local CLI)        │
                    │  sau n8n workflow   │
                    └─────────┬───────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Match result:      │
                    │  - matchPercentage  │
                    │  - matchingSkills   │
                    │  - missingSkills    │
                    │  - explanation      │
                    └─────────────────────┘
```

---

## 7. Convenții

| Fișier | Rol |
|--------|-----|
| `filter/NUME.md` | Skills / curriculum pentru persoana NUME |
| `agents/NUME.md` | Prompt pentru opencode agent (generat din comanda `opencode agent create`) |
| `jobs.json` | Datele cu joburile și `f_tag`-urile asociate |
| `INSTRUCTIONS.md` | Acest document — ghidul complet |

---

**Procesul e gata. Acum poți adăuga următorul agent în 5 minute.**
