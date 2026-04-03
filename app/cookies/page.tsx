import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Cookie } from "lucide-react";

export const metadata = {
  title: "Politica de cookie-uri",
  description: "Politica de cookie-uri CreazaApp. Ce cookie-uri folosim, tipuri, cum le gestionezi.",
  alternates: { canonical: "https://creazaapp.com/cookies" },
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 text-[#6366f1] px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Cookie className="w-4 h-4" />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Politica de <span className="gradient-text">cookie-uri</span>
          </h1>
          <p className="text-muted-foreground">Ultima actualizare: 4 aprilie 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-muted-foreground leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Ce sunt cookie-urile?</h2>
            <p>
              Cookie-urile sunt fișiere text mici stocate pe dispozitivul tău atunci când vizitezi un
              site web. Acestea permit site-ului să-ți recunoască dispozitivul și să rețină
              informații despre vizita ta, cum ar fi preferințele de limbă sau starea de autentificare.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Cookie-uri pe care le folosim</h2>

            {/* Cookie table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 text-foreground font-semibold">Cookie</th>
                    <th className="text-left p-3 text-foreground font-semibold">Tip</th>
                    <th className="text-left p-3 text-foreground font-semibold">Scop</th>
                    <th className="text-left p-3 text-foreground font-semibold">Durată</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 font-mono text-xs text-foreground">sb-*-auth-token</td>
                    <td className="p-3">Esențial</td>
                    <td className="p-3">Sesiunea de autentificare — te menține logat</td>
                    <td className="p-3">Sesiune / 7 zile</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs text-foreground">sb-*-auth-token-code-verifier</td>
                    <td className="p-3">Esențial</td>
                    <td className="p-3">Securitate PKCE pentru fluxul OAuth</td>
                    <td className="p-3">Sesiune</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs text-foreground">theme</td>
                    <td className="p-3">Funcțional</td>
                    <td className="p-3">Salvează preferința ta de temă (light/dark)</td>
                    <td className="p-3">1 an</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs text-foreground">cookie-consent</td>
                    <td className="p-3">Esențial</td>
                    <td className="p-3">Reține alegerea ta privind cookie-urile</td>
                    <td className="p-3">1 an</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Tipuri de cookie-uri</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Cookie-uri esențiale</h3>
                <p>
                  Necesare pentru funcționarea platformei. Fără acestea, nu te poți autentifica sau
                  utiliza serviciul. Nu necesită consimțământul tău deoarece sunt strict necesare.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Cookie-uri funcționale</h3>
                <p>
                  Îmbunătățesc experiența ta pe platformă prin salvarea preferințelor (ex: tema
                  light/dark). Nu sunt strict necesare, dar îmbunătățesc utilizabilitatea.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Cookie-uri analitice</h3>
                <p>
                  Ne ajută să înțelegem cum este utilizată platforma pentru a o îmbunătăți. Datele
                  sunt anonimizate și agregate. Aceste cookie-uri sunt activate doar cu
                  consimțământul tău.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Cookie-uri terțe</h2>
            <p>
              Când te autentifici prin Google sau GitHub, acești furnizori pot seta propriile
              cookie-uri conform politicilor lor de confidențialitate. CreazaApp nu controlează
              aceste cookie-uri. Te încurajăm să consulți politicile de cookie-uri ale acestor
              servicii.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Cum gestionezi cookie-urile</h2>
            <p className="mb-3">Ai mai multe opțiuni pentru gestionarea cookie-urilor:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Setările browser-ului:</strong> Poți bloca sau
                șterge cookie-urile din setările browser-ului tău. Consultă documentația browser-ului
                pentru instrucțiuni specifice.
              </li>
              <li>
                <strong className="text-foreground">Cookie-uri esențiale:</strong> Dacă blochezi
                cookie-urile esențiale, platforma nu va funcționa corect (nu te vei putea autentifica).
              </li>
              <li>
                <strong className="text-foreground">Cookie-uri non-esențiale:</strong> Poți refuza
                cookie-urile funcționale și analitice fără impact asupra funcționalității de bază.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Local storage și session storage</h2>
            <p>
              Pe lângă cookie-uri, utilizăm și mecanismele de stocare ale browser-ului (localStorage
              și sessionStorage) pentru a salva preferințe locale, starea proiectului în curs de
              editare și date de sesiune. Aceste date rămân pe dispozitivul tău și nu sunt
              transmise serverelor noastre.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Modificări ale politicii</h2>
            <p>
              Această politică poate fi actualizată pentru a reflecta modificări ale cookie-urilor pe
              care le folosim. Data ultimei actualizări este afișată în partea de sus a paginii.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Contact</h2>
            <p>
              Pentru întrebări despre cookie-urile noastre:
            </p>
            <p className="mt-2">
              <strong className="text-foreground">Email:</strong> contact@creazaapp.com<br />
              <strong className="text-foreground">Website:</strong> creazaapp.com
            </p>
            <p className="mt-4">
              Pentru informații detaliate despre cum protejăm datele tale, consultă{" "}
              <a href="/confidentialitate" className="text-[#6366f1] hover:underline">
                Politica de confidențialitate
              </a>.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
