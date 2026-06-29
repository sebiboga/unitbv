# Documentație Tehnică — Widget Joburi

Dezvoltat de **Andrei Barari** — FrontEND Developer

## Arhitectură

Widget-ul este un micro-serviciu frontend conceput pentru a fi injectat **cross-domain** pe platformele educaționale (site-urile universităților), livrând studenților conținut filtrat contextual.

### Rutare

Aplicația folosește **hash-based routing** cu trei rute principale:

| Rută | Destinație |
|------|------------|
| `#/` | Pagina principală — selectorul de universități |
| `#/utcn-*` | Pagina dedicată UTCN (clonează site-ul facultății) |
| `#/unitbv-*` | Pagina dedicată UniTBv (clonează site-ul facultății) |
| `#/widget?tag=...&title=...&color=...` | Widget embeddable — consumat prin iframe |

Rutele se parsează în `App.jsx` via `window.location.hash` și un `hashchange` listener.

## Integrare (Embedding)

Widget-ul este arhitecturat pentru a fi randat **izolat**, expunând ruta `#/widget` care este consumată de site-urile universităților printr-un element `<iframe>`. Integrarea necesită doar o **singură linie de cod HTML**:

Înlocuiește `URL_DEPLOY` cu URL-ul propriu de GitHub Pages (ex: `https://peviitor-ro.github.io/ClujHackathon2026`).

```html
<iframe
  src="URL_DEPLOY/#/widget?tag=NUME_TAG&title=Titlu&color=culoare&rounded=clasa"
  width="100%"
  height="650px"
  class="border-none bg-transparent"
></iframe>
```

### Parametrii query string

| Parametru | Descriere | Exemplu |
|-----------|-----------|---------|
| `tag` | Tag-ul facultății după care se filtrează joburile | `UTCNAC` / `UBVFMIIA` |
| `title` | Titlul afișat în banner-ul widget-ului | `Facultatea de Automatică și Calculatoare UTCN` |
| `color` | Culoarea temei (hex) | `%234261e4` (#4261e4) |
| `rounded` | Clasa Tailwind pentru colțuri | `rounded-xl` / `rounded-none` |

### Avantajul Major al Arhitecturii

Prin injectarea parametrului de facultate direct în instanța de iframe, putem asocia automat joburile din baza de date exact cu domeniul de lucru aferent facultății pe care apare widget-ul. Astfel, **platforma gazdă dictează contextul**, iar algoritmul restrânge rezultatele strict la oportunitățile compatibile cu specializarea studenților (ex: IT pentru FMI, inginerie mecanică pentru UTCN).

### Comunicare Cross-Origin

Widget-ul comunică dimensiunea sa cu părintele prin `postMessage`:

```js
// Widget → Parent
window.parent.postMessage(
  { type: 'resize-iframe', height: wrapperRef.current.offsetHeight },
  '*',
);
```

Paginile gazdă (UTCN, UniTBv) ascultă acest mesaj și ajustează dinamic înălțimea iframe-ului:

```js
// Parent → ascultă resize
window.addEventListener('message', (event) => {
  if (event.data?.type === 'resize-iframe') {
    setIframeHeight(event.data.height);
  }
});
```

## Tehnologii Utilizate

### Frontend — React (via Vite)

React a fost selectat pentru **performanța Virtual DOM-ului** în manipularea și re-randarea rapidă a listelor mari de date agregate. Este optimizat pentru **State Management complex**, reușind să gestioneze simultan stările de loading, preferințele de temă (Dark/Light) și payload-urile JSON, oferind un UI instantaneu.

Stack-ul folosește React 19 cu Vite 8 ca build tool, oferind HMD (Hot Module Replacement) rapid în development și bundle-uri optimizate la producție.

### Styling — Tailwind CSS

Utilizat pentru o abordare **utility-first**, asigurând bundle-uri CSS de dimensiuni reduse, performanță la compilare și consistență în crearea unor componente complet responsive (**Mobile-First**).

Tema suportă modurile **Light** și **Dark**, persistate în `localStorage` sub cheia `peviitor-theme`. Culorile sunt definite prin variabile CSS în `index.css`:

| Variabilă | Light | Dark |
|-----------|-------|------|
| `--bg` | `#fefbf7` | `#1b1b1f` |
| `--text` | `#3a3a3a` | `#bcbcbc` |
| `--text-h` | `#0f0f0f` | `#e8e8e8` |
| `--border` | `#e5e7eb` | `#2e2e32` |

### Izolare Vizuală

Componentizarea curată și rularea în iframe previn **style leaking** în DOM-ul site-ului gazdă, garantând că widget-ul arată impecabil indiferent de platforma pe care este implementat. Widget-ul setează `document.body.style.background = "transparent"` pentru a se integra vizual perfect pe orice fundal.

### CI/CD — GitHub Actions

Automatizare completă a procesului de **build și deployment pe GitHub Pages**, validând capacitatea de livrare a codului într-un mediu de tip producție.

Workflow-ul din `.github/workflows/deploy.yml`:
1. **Checkout** — preia codul din branch-ul `main`
2. **Setup Node** — configurează Node 20 cu cache npm
3. **Instalare dependințe** — `npm install`
4. **Build** — `npm run build` produce `/dist`
5. **Upload artifact** — încarcă `/dist` ca GitHub Pages artifact
6. **Deploy** — publică pe GitHub Pages

Se declanșează la fiecare push pe `main` și poate fi rulat manual din Actions tab.

## Design UI/UX

Arhitectura de design este orientată spre **performanță și utilitate pură**:

- **Performanță percepută**: micro-tranziții (sub 300ms) și **schelete de încărcare** (loading states cu spinner animat) care maschează asincronicitatea apelurilor de rețea.
- **Responsive**: layout-ul se adaptează de la 320px (mobile) până la desktop, folosind breakpoint-urile Tailwind (`sm`, `md`, `lg`).
- **Maxim 320px lățime**: widget-ul este constrâns la `max-w-[320px]` pentru a se potrivi în coloanele laterale ale site-urilor universităților.
- **Scroll infinit**: lista de joburi are `max-h-[420px]` cu scroll intern, permițând randarea a zeci de joburi fără a afecta layout-ul paginii gazdă.

## Baza de Date

Joburile sunt stocate în `jobs.json` și încărcate de API-ul din `src/services/api.js`:

1. Se încearcă fetch din repository-ul GitHub (raw)
2. La eșec (`fetch` nu e disponibil sau HTTP error), se face **fallback la fișierul local** importat direct
3. Fiecare job este mapat cu un ID unic, logo gradient generat din numele companiei și câmpuri normalizate

### Structura unui job în JSON

```json
{
  "url": "https://...",
  "title": "Job Title",
  "company": "Company Name",
  "location": ["Cluj-Napoca"],
  "salary": ["3000-5000 RON"],
  "date": "2026-05-20T12:00:00Z",
  "status": "published",
  "_version_": 1234567890,
  "_root_": "https://...",
  "f_tag": ["UTCNAC"]
}
```

Câmpul `f_tag` (array de string-uri) este esențial pentru filtrare:
- `UTCNAC` — UTCN, Facultatea de Automatică și Calculatoare (agentul Ada)
- `UBVFMIIA` — UniTBv, Facultatea de Matematică și Informatică (agentul Medeea)

## Paginile Gazdă (Skin-uri)

Pentru a demonstra integrarea, am creat două pagini care clonează site-urile reale ale facultăților:

- **UTCN** (`src/pages/utcn.jsx`): oglindește site-ul Facultății de Automatică și Calculatoare, incluzând slider-ul hero, meniul de navigare, secțiunea de contact/anunțuri și widget-ul embedat cu tag-ul `UTCNAC`, culoarea `#4261e4` și colțuri drepte (`rounded-none`).

- **UniTBv** (`src/pages/unitbv.jsx`): oglindește site-ul Facultății de Matematică și Informatică, cu widget-ul embedat cu tag-ul `UBVFMIIA`, culoarea `#007A87` și colțuri rotunjite (`rounded-xl`).

Ambele pagini demonstrează **comunicarea cross-origin** dintre widget și părinte prin `postMessage`, ajustând dinamic înălțimea iframe-ului pe măsură ce conținutul se încarcă.

## Licență

MIT — vezi [LICENSE](../LICENSE).
