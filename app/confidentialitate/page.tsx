import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Politica de confidențialitate – CreazaApp",
  description: "Politica de confidențialitate CreazaApp. Află cum colectăm, utilizăm și protejăm datele tale personale.",
};

export default function ConfidentialitatePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 text-[#6366f1] px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Politica de <span className="gradient-text">confidențialitate</span>
          </h1>
          <p className="text-muted-foreground">Ultima actualizare: 4 aprilie 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-muted-foreground leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Introducere</h2>
            <p>
              CreazaApp (&quot;noi&quot;, &quot;al nostru&quot;, &quot;platforma&quot;) operează site-ul web{" "}
              <strong className="text-foreground">creazaapp.com</strong> și serviciile asociate.
              Această politică descrie cum colectăm, utilizăm, stocăm și protejăm datele tale personale
              în conformitate cu Regulamentul General privind Protecția Datelor (GDPR) și legislația
              românească în vigoare.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Date pe care le colectăm</h2>
            <p className="mb-3">Colectăm următoarele categorii de date personale:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Date de cont</strong> — adresa de email, numele
                afișat și avatar-ul (furnizate direct sau prin autentificarea cu Google sau GitHub).
              </li>
              <li>
                <strong className="text-foreground">Date de utilizare</strong> — proiectele create,
                conversațiile cu agentul AI, consumul de credite și istoricul tranzacțiilor.
              </li>
              <li>
                <strong className="text-foreground">Date tehnice</strong> — adresa IP, tipul de
                browser, sistemul de operare, paginile vizitate și durata sesiunii (colectate automat
                prin cookie-uri și tehnologii similare).
              </li>
              <li>
                <strong className="text-foreground">Date de plată</strong> — procesate exclusiv prin
                furnizorul nostru de plăți. Nu stocăm datele cardului tău pe serverele noastre.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Scopul prelucrării datelor</h2>
            <p className="mb-3">Utilizăm datele tale pentru:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Furnizarea și îmbunătățirea serviciilor CreazaApp</li>
              <li>Gestionarea contului tău și a creditelor</li>
              <li>Procesarea plăților și emiterea facturilor</li>
              <li>Comunicarea cu tine (suport tehnic, notificări importante)</li>
              <li>Prevenirea fraudei și asigurarea securității platformei</li>
              <li>Respectarea obligațiilor legale</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Temeiul legal al prelucrării</h2>
            <p className="mb-3">Prelucrăm datele tale pe baza următoarelor temeiuri legale:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Executarea contractului</strong> — pentru a-ți furniza serviciile solicitate.</li>
              <li><strong className="text-foreground">Consimțământul</strong> — pentru cookie-uri non-esențiale și comunicări de marketing.</li>
              <li><strong className="text-foreground">Interesul legitim</strong> — pentru îmbunătățirea platformei și prevenirea fraudei.</li>
              <li><strong className="text-foreground">Obligația legală</strong> — pentru respectarea legislației fiscale și a reglementărilor aplicabile.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Partajarea datelor</h2>
            <p className="mb-3">
              Nu vindem datele tale personale. Putem partaja date cu:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Furnizori de servicii</strong> — companii care ne
                ajută să operăm platforma (hosting, autentificare, procesare plăți, servicii AI).
                Acești furnizori procesează datele exclusiv în numele nostru și în baza unor acorduri
                de prelucrare a datelor (DPA).
              </li>
              <li>
                <strong className="text-foreground">Autorități</strong> — când suntem obligați legal
                să divulgăm informații.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Transferul internațional al datelor</h2>
            <p>
              Unii furnizori de servicii pot procesa date în afara Spațiului Economic European (SEE).
              În aceste cazuri, ne asigurăm că transferul este protejat prin clauze contractuale
              standard aprobate de Comisia Europeană sau alte mecanisme de transfer adecvate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Stocarea și securitatea datelor</h2>
            <p>
              Datele tale sunt stocate pe servere securizate cu criptare în tranzit (TLS) și în repaus.
              Păstrăm datele contului tău atât timp cât contul este activ. Datele proiectelor șterse
              sunt eliminate definitiv după 48 de ore. Poți solicita ștergerea completă a contului
              oricând.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Drepturile tale (GDPR)</h2>
            <p className="mb-3">Conform GDPR, ai următoarele drepturi:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Dreptul de acces</strong> — poți solicita o copie a datelor tale personale.</li>
              <li><strong className="text-foreground">Dreptul la rectificare</strong> — poți corecta datele inexacte sau incomplete.</li>
              <li><strong className="text-foreground">Dreptul la ștergere</strong> — poți solicita ștergerea datelor tale (&quot;dreptul de a fi uitat&quot;).</li>
              <li><strong className="text-foreground">Dreptul la restricționare</strong> — poți limita prelucrarea datelor în anumite circumstanțe.</li>
              <li><strong className="text-foreground">Dreptul la portabilitate</strong> — poți primi datele tale într-un format structurat, utilizat frecvent.</li>
              <li><strong className="text-foreground">Dreptul la opoziție</strong> — te poți opune prelucrării bazate pe interes legitim.</li>
              <li><strong className="text-foreground">Dreptul de retragere a consimțământului</strong> — oricând, fără a afecta legalitatea prelucrării anterioare.</li>
            </ul>
            <p className="mt-4">
              Pentru exercitarea acestor drepturi, contactează-ne la{" "}
              <strong className="text-foreground">contact@creazaapp.com</strong>. Vom răspunde în
              maximum 30 de zile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Cookie-uri</h2>
            <p>
              Folosim cookie-uri pentru funcționarea platformei și analiza utilizării. Pentru detalii
              complete, consultă{" "}
              <a href="/cookies" className="text-[#6366f1] hover:underline">Politica de cookie-uri</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Copiii</h2>
            <p>
              CreazaApp nu este destinat persoanelor sub 16 ani. Nu colectăm cu bună știință date
              personale de la minori sub această vârstă. Dacă aflăm că am colectat astfel de date,
              le vom șterge imediat.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Modificări ale politicii</h2>
            <p>
              Ne rezervăm dreptul de a actualiza această politică. Modificările semnificative vor fi
              comunicate prin email sau notificare pe platformă. Continuarea utilizării serviciului
              după modificări constituie acceptarea noii versiuni.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Contact</h2>
            <p>
              Pentru orice întrebări privind datele tale personale sau această politică:
            </p>
            <p className="mt-2">
              <strong className="text-foreground">Email:</strong> contact@creazaapp.com<br />
              <strong className="text-foreground">Website:</strong> creazaapp.com
            </p>
            <p className="mt-4">
              Dacă consideri că prelucrăm datele tale necorespunzător, ai dreptul de a depune o
              plângere la{" "}
              <strong className="text-foreground">
                Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)
              </strong>
              , cu sediul în București, B-dul G-ral. Gheorghe Magheru 28-30.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
