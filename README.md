# Job Widget — Filtrare inteligentă a locurilor de muncă

**Filtrare inteligentă a locurilor de muncă folosind AI**

## Ideea proiectului

Colectăm toate locurile de muncă de pe [peviitor.ro](https://peviitor.ro) și, pe baza unor tag-uri generate automat cu ajutorul AI, determinăm ce joburi se potrivesc pentru fiecare facultate și școală profesională din România.

## Stack tehnologic

- **n8n** – orchestrare workflow-uri și colectare date
- **OpenCode** – agenți AI pentru procesare și taguire
- **AI (LLM)** – generare tag-uri și matching inteligent
- **Peviitor.ro** – sursa principală de date (joburi)

## Cum funcționează

1. Extragem joburile din API-ul Peviitor
2. Analizăm fiecare job cu ajutorul AI pentru a extrage tag-uri relevante (domeniu, tehnologii, skill-uri, nivel)
3. Mapăm facultățile și școlile profesionale pe baza profilelor lor de studiu
4. Match-uim tag-urile joburilor cu profilurile instituțiilor de învățământ
5. Generăm recomandări personalizate per instituție

## Local tag:

După ce am făcut fork la repo, în conf/local_tag.md, în root, scriem tag-ul folosit de această facultate.
Tot aici punem si sursa de unde isi va lua agentul materiile si va deduce si skillurile studentului.

Formatul pentru local_tag.md este urmatorul:
TAG
sursa: exemplu.com

## Lista materii:

In dir filter/ punem un fisier .md care are ca nume tagul mentionat in conf/local_tag.md, cu lista de materii, folosind sursa sa extragem materiile + cursurile + sa deducem skillurile studentului.
Acest fisier din filter/ va fi generat cu un prompt in opencode prin GitHUB AGENTS

## Cream un student.md
student.md va fi in folderul agents si va contine un prompt care va fi inspirat din Ada,md si Medeea.md si va fi personalizat pe baza celor extrase in folderul filter/
student.md va fi generat cu un prompt de catre opencode si rulat in GitHUB Actions.

## Widget Incorporabil

Widget-ul de joburi **poate fi încorporat pe site-ul oricărei facultăți** printr-un simplu `<iframe>`. O singură linie de cod este suficientă:

Înlocuiește `URL_DEPLOY` cu URL-ul propriu de GitHub Pages (ex: `https://peviitor-ro.github.io/ClujHackathon2026`).

```html
<iframe
  src="URL_DEPLOY/#/widget?tag=FACULTATE_TAG&title=Titlu&color=culoare"
  width="100%"
  height="650px"
></iframe>
```

Parametrii se personalizează în funcție de facultate: `tag` pentru filtrarea joburilor, `title` pentru titlul afișat, `color` pentru tema vizuală. Vezi [documentația tehnică](docs/tehnica.md) pentru detalii complete.

## Articole & mențiuni

- **[Asociația Oportunități și Cariere — Cluj Hackathon 2026](https://www.linkedin.com/posts/asociatia-oportunitati-si-cariere_clujhackathon-clujhackathon2026-opensource-activity-7463907374190309376--UUN)** — Postare LinkedIn despre participarea echipei la hackathon
- **[Andreea Radu — Experiența la Cluj Hackathon 2026](https://www.linkedin.com/posts/andreea-radu-379205302_clujhackathon-techforgood-voluntariat-share-7463915729734774784-4bjC/)** — Postare LinkedIn a unei studente în practică despre echipă și misiunea asociației
- **[Carina Bancila — Mândră de echipă](https://www.linkedin.com/posts/carina-bancila_clujhackathon-clujhackathon2026-opensource-share-7463910730103365634-AzH2/)** — Postare LinkedIn a HR & OD Managerului despre implicarea echipei la hackathon


## Licență

Acest proiect este distribuit sub licența **MIT**. Vezi fișierul [LICENSE](LICENSE).

## Contribuții

Contribuțiile sunt binevenite! Vezi [CONTRIBUTING.md](CONTRIBUTING.md) și [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) pentru detalii.
