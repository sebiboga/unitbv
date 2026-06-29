import { useEffect, useState } from "react";
import Widget from "./Widget";
import { Moon, Sun, Copy, Check } from "lucide-react";

function getWidgetCode() {
  const base = window.location.origin + window.location.pathname.replace(/\/+$/, "");
  return `<iframe
  src="${base}/#/widget?tag=NUME_TAG&title=Titlu&color=culoare"
  width="100%"
  height="650px"
  style="border: none; background: transparent;"
></iframe>`;
}

function HomePage() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("peviitor-theme") || "light";
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("peviitor-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const widgetCode = getWidgetCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(widgetCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-text-h tracking-tight">
            peViitor Widget
          </h1>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/peviitor-ro/jobs-widget"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 rounded-lg text-text hover:text-text-h border border-border hover:border-border/80 flex items-center justify-center transition-colors"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
            </a>
            <button
              onClick={toggleTheme}
              className="h-8 w-8 rounded-lg text-text hover:text-text-h border border-border hover:border-border/80 flex items-center justify-center transition-colors"
              aria-label={theme === "light" ? "Mod întunecat" : "Mod luminos"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-h">
            Integrează widget-ul pe site-ul facultății
          </h2>
          <p className="text-sm leading-relaxed">
            Acest widget afișează locuri de muncă potrivite pentru studenții
            facultății tale. Se integrează pe orice site printr-un simplu
            <code className="bg-code-bg text-accent px-1.5 py-0.5 rounded text-xs mx-1">&lt;iframe&gt;</code>.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-h uppercase tracking-wider">
            1. Obține tag-ul facultății
          </h3>
          <p className="text-sm leading-relaxed">
            Mergi pe{" "}
            <a
              href="https://github.com/peviitor-ro/jobs-widget"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-medium"
            >
              repo-ul principal
            </a>
            , rulează acțiunea <strong>Genereaza Tag Unic Facultate</strong> cu
            numele universității și facultății, apoi salvează tag-ul primit.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-h uppercase tracking-wider">
            2. Fă fork la template
          </h3>
          <p className="text-sm leading-relaxed">
            Creează un nou repository din acest template. În fișierul{" "}
            <code className="bg-code-bg text-accent px-1.5 py-0.5 rounded text-xs">
              conf/local_tag.md
            </code>
            , adaugă tag-ul primit și sursa curriculum-ului facultății tale.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-h uppercase tracking-wider">
            3. Rulează pipeline-ul
          </h3>
          <p className="text-sm leading-relaxed">
            Activează GitHub Pages pe fork-ul tău, apoi rulează acțiunea{" "}
            <strong>Full Pipeline</strong>. După finalizare, widget-ul va fi
            disponibil la URL-ul tău de GitHub Pages.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-h uppercase tracking-wider">
            4. Încorporează pe site-ul facultății
          </h3>
          <p className="text-sm leading-relaxed">
            Adaugă codul de mai jos pe site-ul facultății, înlocuind parametrii
            cu valorile specifice:
          </p>

          <div className="relative">
            <pre className="bg-code-bg border border-border rounded-lg p-4 text-xs leading-relaxed overflow-x-auto">
              <code>{widgetCode}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 h-7 w-7 rounded-md text-text hover:text-text-h border border-border hover:border-border/80 flex items-center justify-center transition-colors bg-code-bg"
              aria-label="Copiază codul"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-bold text-text-h">Parametru</th>
                  <th className="text-left py-2 pr-4 font-bold text-text-h">Descriere</th>
                  <th className="text-left py-2 font-bold text-text-h">Exemplu</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 font-mono text-accent">tag</td>
                  <td className="py-2 pr-4">Tag-ul facultății</td>
                  <td className="py-2 font-mono">UBBFMI</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 font-mono text-accent">title</td>
                  <td className="py-2 pr-4">Titlul afișat în widget</td>
                  <td className="py-2 font-mono">Facultatea de Matematică și Informatică</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 font-mono text-accent">color</td>
                  <td className="py-2 pr-4">Culoarea temei (hex)</td>
                  <td className="py-2 font-mono">%234f46e5</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-h uppercase tracking-wider">
            Previzualizare
          </h3>
          <p className="text-sm leading-relaxed">
            Mai jos poți vedea cum arată widget-ul. Acesta este același cod pe
            care îl vei încorpora pe site-ul facultății.
          </p>
          <Widget />
        </section>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-text/60">
          <span>peViitor.ro — Cluj Hackathon 2026</span>
          <a
            href="https://github.com/peviitor-ro/jobs-widget"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
