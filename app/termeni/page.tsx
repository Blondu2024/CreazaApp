import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Termeni și condiții – CreazaApp",
  description: "Termenii și condițiile de utilizare a platformei CreazaApp.",
};

export default function TermeniPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 text-[#6366f1] px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FileText className="w-4 h-4" />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Termeni și <span className="gradient-text">condiții</span>
          </h1>
          <p className="text-muted-foreground">Ultima actualizare: 4 aprilie 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-muted-foreground leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptarea termenilor</h2>
            <p>
              Prin accesarea și utilizarea platformei CreazaApp (&quot;Serviciul&quot;), disponibilă la{" "}
              <strong className="text-foreground">creazaapp.com</strong>, accepți acești Termeni și
              condiții în totalitate. Dacă nu ești de acord cu oricare dintre prevederi, te rugăm să
              nu utilizezi Serviciul.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Descrierea serviciului</h2>
            <p>
              CreazaApp este o platformă de construire a aplicațiilor web cu asistență AI. Serviciul
              include un agent AI conversațional, un editor de cod, previzualizare live, API-uri AI
              integrate și opțiuni de hosting. Funcționalitățile disponibile depind de planul ales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Contul de utilizator</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Trebuie să ai cel puțin 16 ani pentru a crea un cont.</li>
              <li>Ești responsabil pentru păstrarea confidențialității datelor de autentificare.</li>
              <li>Informațiile furnizate la înregistrare trebuie să fie exacte și actuale.</li>
              <li>Ne rezervăm dreptul de a suspenda sau închide conturile care încalcă acești termeni.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Sistemul de credite</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Serviciile CreazaApp funcționează pe bază de credite.</li>
              <li>Fiecare plan include un număr de credite lunare care se resetează la începutul fiecărei luni calendaristice.</li>
              <li>Creditele neutilizate din alocarea lunară <strong className="text-foreground">nu se cumulează</strong> de la o lună la alta.</li>
              <li>Creditele achiziționate prin top-up <strong className="text-foreground">nu expiră</strong> și se consumă după epuizarea creditelor lunare.</li>
              <li>Consumul de credite variază în funcție de modelul AI utilizat, tipul de API și complexitatea operațiunii.</li>
              <li>Costul în credite pentru fiecare operație este afișat înainte de executare.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Plăți și abonamente</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prețurile sunt afișate în RON (lei românești) și includ TVA unde este aplicabil.</li>
              <li>Abonamentele se reînnoiesc automat lunar, cu excepția cazului în care sunt anulate înainte de data reînnoirii.</li>
              <li>Plățile sunt procesate prin furnizori terți de plăți securizați.</li>
              <li>Poți anula abonamentul oricând din pagina de cont. Anularea intră în vigoare la sfârșitul perioadei de facturare curente.</li>
              <li>Rambursările sunt disponibile în primele 14 zile de la prima achiziție, conform legislației europene privind protecția consumatorului.</li>
              <li>Creditele achiziționate prin top-up nu sunt rambursabile după utilizare.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Proprietatea intelectuală</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Conținutul tău:</strong> Deții toate drepturile
                asupra codului și proiectelor pe care le creezi folosind CreazaApp. Platforma nu
                revendică nicio proprietate asupra conținutului generat.
              </li>
              <li>
                <strong className="text-foreground">Platforma:</strong> Codul sursă, designul,
                marca CreazaApp și toate materialele asociate sunt proprietatea noastră și sunt
                protejate de legislația privind drepturile de autor.
              </li>
              <li>
                <strong className="text-foreground">AI-ul:</strong> Codul generat de agentul AI este
                furnizat &quot;as-is&quot;. Ești responsabil pentru revizuirea și testarea codului
                generat înainte de utilizarea în producție.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Utilizare acceptabilă</h2>
            <p className="mb-3">Nu este permisă utilizarea platformei pentru:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Activități ilegale sau frauduloase</li>
              <li>Generarea de conținut care încalcă drepturile altora</li>
              <li>Încercări de a exploata, ataca sau compromite securitatea platformei</li>
              <li>Crearea de aplicații malițioase (malware, phishing, spam)</li>
              <li>Revânzarea accesului la platformă sau a creditelor fără autorizare</li>
              <li>Generarea de conținut ilegal, discriminatoriu sau care incită la violență</li>
              <li>Utilizarea automatizată excesivă (bots) fără acordul nostru prealabil</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Disponibilitatea serviciului</h2>
            <p>
              Ne străduim să menținem platforma disponibilă 24/7, dar nu garantăm funcționare
              neîntreruptă. Serviciul poate fi temporar indisponibil din cauza mentenanței planificate,
              actualizărilor sau circumstanțelor în afara controlului nostru. Nu suntem responsabili
              pentru pierderi cauzate de întreruperile serviciului.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Limitarea răspunderii</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Serviciul este furnizat &quot;ca atare&quot; (&quot;as-is&quot;), fără garanții exprese sau implicite.</li>
              <li>Nu garantăm că codul generat de AI este corect, complet sau potrivit pentru un scop anume.</li>
              <li>Răspunderea noastră totală este limitată la suma plătită de tine în ultimele 3 luni.</li>
              <li>Nu suntem răspunzători pentru daune indirecte, incidentale sau consecvente.</li>
              <li>Ești responsabil pentru backup-ul proiectelor tale. Deși oferim funcții de salvare automată, recomandăm exportul regulat al proiectelor.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Hosting și deploy</h2>
            <p>
              Dacă planul tău include funcționalitatea de deploy, aplicațiile tale vor fi găzduite pe
              serverele CreazaApp. Ne rezervăm dreptul de a elimina aplicații care încalcă acești
              termeni sau care consumă resurse excesive. Proiectele hostate în modul &quot;sleep&quot;
              pot avea un timp de încărcare inițial mai mare.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Modificări ale termenilor</h2>
            <p>
              Putem actualiza acești termeni periodic. Modificările semnificative vor fi comunicate cu
              cel puțin 30 de zile înainte de intrarea în vigoare, prin email sau notificare pe
              platformă. Continuarea utilizării după notificare constituie acceptarea noilor termeni.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Rezilierea</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Poți închide contul oricând din setările contului sau contactându-ne.</li>
              <li>La închiderea contului, datele tale vor fi șterse în conformitate cu Politica de confidențialitate.</li>
              <li>Ne rezervăm dreptul de a suspenda sau închide conturile care încalcă acești termeni, cu notificare prealabilă când este posibil.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Legislația aplicabilă</h2>
            <p>
              Acești termeni sunt guvernați de legislația României. Orice litigiu va fi soluționat de
              instanțele competente din România. Se aplică, de asemenea, legislația Uniunii Europene
              privind protecția consumatorilor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Contact</h2>
            <p>
              Pentru întrebări privind acești termeni:
            </p>
            <p className="mt-2">
              <strong className="text-foreground">Email:</strong> contact@creazaapp.com<br />
              <strong className="text-foreground">Website:</strong> creazaapp.com
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
