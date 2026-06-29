# Agenți & Pipeline

## Fluxul datelor

```
conf/local_tag.md  ──►  fetch_agent_jobs.mjs  ──►  opencode (student.md)  ──►  jobs.json
```

1. **Tag**: `conf/local_tag.md` conține tag-ul facultății (ex: `UBBFPSE`) și sursa curriculum-ului.
2. **Script**: `scripts/fetch_agent_jobs.mjs` citește profilul agentului, generează cuvinte cheie, interoghează API-ul peviitor, extrage descrierile joburilor și le trimite agentului AI.
3. **Agent AI**: `agents/student.md` analizează fiecare job și decide dacă se potrivește cu skill-urile persoanei.
4. **Rezultat**: Joburile potrivite sunt salvate în `jobs.json` cu `f_tag`, `matchPercentage` și `reason`.

---

## Agent curent

| Agent | Fișier profil | `f_tag` | Facultatea |
|-------|---------------|---------|------------|
| **Student** | `agents/student.md` | `UBBFPSE` | Psihologie și Științe ale Educației, UBB |

### Student

- Student la **Facultatea de Psihologie și Științe ale Educației, Universitatea Babeș-Bolyai**
- Skill-uri: competențe socio-emoționale, comunicare & rezolvare conflicte, dezvoltare personală, abilități sociale
- Rulează prin `scripts/fetch_agent_jobs.mjs` și filtrează joburi potrivite pentru nivel internship/junior/mid

---

## Cum se adaugă un agent nou

Vezi `INSTRUCTIONS.md` — pașii sunt:

1. Creează fișierul de profil în `filter/NUME.md` (competențele persoanei / curriculum)
2. Creează agentul în `agents/NUME.md` (prompt + skill-uri)
3. Actualizează `conf/local_tag.md` cu tag-ul corespunzător
4. Rulează `node scripts/fetch_agent_jobs.mjs` pentru a genera `jobs.json`

---

## Fișiere relevante

| Fișier | Rol |
|--------|-----|
| `scripts/fetch_agent_jobs.mjs` | Script principal: generează keywords, interoghează API, rulează agentul, salvează `jobs.json` |
| `agents/student.md` | Profilul agentului Student (prompt + skill-uri) |
| `filter/UBBFPSE.md` | Curriculum-ul Facultății de Psihologie și Științe ale Educației, UBB |
| `conf/local_tag.md` | Tag-ul facultății și sursa curriculum-ului |
| `jobs.json` | Joburi matcheate cu `f_tag`, `matchPercentage` și `reason` |
