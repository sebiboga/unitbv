# Structura fișierului `jobs.json`

`jobs.json` este un array JSON care conține joburile matcheate de agentul AI. Fiecare obiect reprezintă un anunț de loc de muncă agregat din API-ul peviitor.ro.

---

## Câmpurile unui obiect job

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `url` | `string[]` | da | Link-ul direct către anunțul original (array cu un singur element) |
| `title` | `string` | da | Titlul postului |
| `company` | `string` | da | Numele companiei angajatoare |
| `location` | `string[]` | da | Lista de orașe/locații |
| `salary` | `string[]` | nu | Salariul exprimat ca string (ex: `"4000-6000 RON"`) |
| `date` | `string` (ISO 8601) | nu | Data publicării anunțului (ex: `"2026-05-22T00:00:00Z"`) |
| `status` | `string` | da | Starea anunțului (ex: `"activ"`, `"published"`) |
| `f_tag` | `string[]` | da | Tag-ul (tag-urile) de filtrare — vezi secțiunea dedicată |
| `matchPercentage` | `number` | da | Scorul de potrivire (0-100) calculat de agentul AI |
| `reason` | `string` | da | Explicația agentului pentru potrivire |

### Exemplu

```json
{
  "url": ["https://www.bestjobs.eu/loc-de-munca/..."],
  "title": "Internship Insurance Officer",
  "company": "TOYOTA STAR SRL",
  "location": ["Voluntari, Romania"],
  "salary": ["de la 785 până la 865 EUR/lună"],
  "date": "2026-05-14T00:00:00Z",
  "status": "activ",
  "f_tag": ["UBBFPSE"],
  "matchPercentage": 55,
  "reason": "Rol implică interacțiune cu clienți, comunicare și negociere — skill-uri din aria mea (comunicare eficientă, relaționare)."
}
```

---

## Câmpul `f_tag` în detaliu

Câmpul `f_tag` (array de string-uri) asociază fiecare job cu una sau mai multe **persoane (agenți)** care caută activ un loc de muncă. Fiecare valoare din array corespunde numelui unui fișier Markdown din directorul `filter/` (fără extensia `.md`).

### Cum funcționează

1. În `filter/` există fișiere de tip `NUME.md` care descriu **competențele** unei persoane (curriculum universitar, skill-uri).
2. Agentul AI (definit în `agents/student.md`) analizează fiecare anunț de job și, dacă skill-urile persoanei se potrivesc, adaugă tag-ul respectiv în `f_tag`.
3. Joburile pot primi multiple tag-uri dacă se potrivesc cu mai multe persoane.

### Valorile curente

| `f_tag` | Fișier filtru | Persoană / Profil |
|---------|---------------|-------------------|
| `"UBBFPSE"` | `filter/UBBFPSE.md` | Student al **Facultății de Psihologie și Științe ale Educației, UBB** — profil psiho-pedagogic |

---

## Câmpurile `matchPercentage` și `reason`

Aceste câmpuri sunt adăugate de agentul AI după analizarea fiecărui job:

- **`matchPercentage`** — scor de la 0 la 100 care indică cât de bine se potrivește jobul cu skill-urile persoanei
- **`reason`** — explicație narativă a agentului, menționând skill-urile potrivite și cele lipsă

---

## Generare

Joburile sunt generate automat prin scriptul `scripts/fetch_agent_jobs.mjs` care:

1. Citește tag-ul din `conf/local_tag.md`
2. Citește profilul agentului din `agents/student.md`
3. Generează cuvinte cheie de căutare pe baza profilului
4. Interoghează API-ul peviitor.ro (`https://api.peviitor.ro/v1/search/`)
5. Extrage descrierile joburilor
6. Trimite fiecare batch la agentul AI pentru evaluare
7. Salvează joburile potrivite în `jobs.json`
