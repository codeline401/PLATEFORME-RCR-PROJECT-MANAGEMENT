import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { ArrowRight, CheckCircle, Users, Zap } from "lucide-react";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import Footer from "../components/Footer";

const LandingPage = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const toastIdRef = useRef(null);

  // Rediriger les utilisateurs authentifiés vers le dashboard
  useEffect(() => {
    if (!isLoaded) {
      // Afficher le loading toast
      toastIdRef.current = toast.loading("Eo ampanokafana ny pejy");
    } else {
      // Fermer le toast quand la page est chargée
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      // Rediriger si authentifié vers le dashboard protégé
      if (isSignedIn) {
        navigate("/dashboard");
      }
    }

    return () => {
      // Cleanup: fermer le toast si le composant est unmounté
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-slate-400 mt-4">Eo ampanokafana ny pejy</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold">
                RCR
              </div>
              <span className="font-bold text-lg">T.OLO.N.A</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#features"
                className="text-sm hover:text-blue-400 transition"
              >
                Zavatra hita ato
              </a>
              <a
                href="#about"
                className="text-sm hover:text-blue-400 transition"
              >
                Momban'ny tranokala
              </a>
              <a
                href="/sign-in"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
              >
                Hiditra Handray Andraikitra
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                ✨ Tongasoa eto amin'ny RCR / TOLONA PROJECT MANAGEMENT!
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Hatsangano ny Tetikasa, Raiso ny Andraikitra, Araho Maso ireo Asa
            </h1>

            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Ivo-toerana natokana ho an'ny mpikambana sy ny mpanohana ny RCR /
              T.OLO.N.A hiasa miaraka amin'ny fomba mahomby sy milamina.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <a
                href="/sign-up"
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-semibold flex items-center justify-center gap-2 transition"
              >
                'Ndao Atomboka <ArrowRight size={20} />
              </a>
              <a
                href="/explore/projects"
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 font-semibold flex items-center justify-center gap-2 transition"
              >
                Jereo ny Tetikasa Ivelany <ArrowRight size={20} />
              </a>
              <a
                href="#features"
                className="px-8 py-3 rounded-lg border border-slate-500 hover:border-slate-400 font-semibold transition"
              >
                Hamantatra bebe kokoa
              </a>
            </div>

            {/* Hero Image/Illustration - Dashboard Mockup Animé */}
            <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm h-96">
              <div className="h-full bg-gradient-to-br from-blue-600/10 to-cyan-600/10 flex flex-col p-6">
                {/* En-tête du Dashboard */}
                <div className="mb-4 pb-4 border-b border-slate-700/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg"></div>
                      <span className="text-sm font-semibold text-slate-300">
                        RCR / T.OLO.N.A TANA II
                      </span>
                    </div>
                    {/* Indicateurs de statut (pulsent) */}
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Grille de statistiques animées */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* Statistique 1 - Projets */}
                  <div
                    className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 animate-fadeInUp"
                    style={{ animationDelay: "0s" }}
                  >
                    <p className="text-xs text-slate-400 mb-1">Tetiksasa</p>
                    <p className="text-lg font-bold text-blue-400">24</p>
                  </div>

                  {/* Statistique 2 - Tâches */}
                  <div
                    className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 animate-fadeInUp"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <p className="text-xs text-slate-400 mb-1">Asa</p>
                    <p className="text-lg font-bold text-cyan-400">143</p>
                  </div>

                  {/* Statistique 3 - Équipe */}
                  <div
                    className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 animate-fadeInUp"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <p className="text-xs text-slate-400 mb-1">
                      Mpikambana / Mpandray Anjara
                    </p>
                    <p className="text-lg font-bold text-blue-400">12</p>
                  </div>
                </div>

                {/* Barre de progression animée */}
                <div className="space-y-2">
                  {/* Progression 1 */}
                  <div
                    className="animate-fadeInUp"
                    style={{ animationDelay: "0.3s" }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-slate-400">
                        FORMATION Politique
                      </p>
                      <span className="text-xs font-semibold text-cyan-400">
                        75%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full"
                        style={{
                          width: "75%",
                          animation: "slideIn 0.8s ease-out forwards",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Progression 2 */}
                  <div
                    className="animate-fadeInUp"
                    style={{ animationDelay: "0.4s" }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-slate-400">
                        Organisation Tournoi de Foot
                      </p>
                      <span className="text-xs font-semibold text-blue-400">
                        45%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full"
                        style={{
                          width: "45%",
                          animation: "slideIn 0.8s ease-out forwards",
                          animationDelay: "0.1s",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Petite note en bas */}
                <div
                  className="mt-auto pt-3 border-t border-slate-700/30 animate-fadeInUp"
                  style={{ animationDelay: "0.5s" }}
                >
                  <p className="text-xs text-slate-500">
                    ✨ Interface réelle de votre dashboard RCR / T.OLO.N.A
                  </p>
                </div>
              </div>
            </div>

            {/* Styles d'animation personnalisés */}
            <style>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              @keyframes slideIn {
                from {
                  width: 0;
                }
                to {
                  width: var(--width, 100%);
                }
              }

              .animate-fadeInUp {
                animation: fadeInUp 0.6s ease-out forwards;
                opacity: 0;
              }
            `}</style>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-700/50"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Ireo Zavatra Hita Ato
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition">
              <Zap size={32} className="text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">
                Fandridrana ireo Tetikasa
              </h3>
              <p className="text-slate-300">
                Forony sy Hatsangano ny Tetikasanao Miaraka Amini'ireo
                Mpikambana na Mpandray Anjara.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition">
              <Users size={32} className="text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">
                Fandridrana ireo Mpikambana
              </h3>
              <p className="text-slate-300">
                Asao ireo Mpikambana, Zarao ary Omeo Andraikitra ireo Mpikambana
                Ary Tanterao Miaraka Ireo Tetiksana
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition">
              <CheckCircle size={32} className="text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">
                Fanarahana Maso Ireo Asa
              </h3>
              <p className="text-slate-300">
                Araho Amin'ny Atsakany Sy Andavany Ireo Asa Rehetra Ao Anaty
                Tetikasa Ary Jereo Ao Ny Antsipirihany Sy Ny Fizotrany.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition">
              <Zap size={32} className="text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Tetiandro</h3>
              <p className="text-slate-300">
                Jereo ny Asa sy ny daty manan-danja miaraka amin'ny tetiandro
                Isaky ny Asa.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition">
              <CheckCircle size={32} className="text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Kajy</h3>
              <p className="text-slate-300">
                Hitanao ireo Tarehimarika rehetra momba ireo Tetiksanao sy ireo
                Mpikambana ao Anaty Tetikasa.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition">
              <Users size={32} className="text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Fiara-miasa</h3>
              <p className="text-slate-300">
                les mises à jour en direct. Raiso ny Andraikitra : midira anaty
                Tetikasa, Manasà Mpikambana Tolory Tanana Ireo Asa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-700/50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Momban'ny Antoko Politika RCR / T.OLO.N.A
              </h2>
              <p className="text-slate-300 mb-4">
                RCR / T.OLO.N.A dia Antoko Politika izay mino ny mangarahara, ny
                fiaraha-miasa ary ny fanavaozana amin'ny fitantanana
                ampahibemaso.
              </p>
              <p className="text-slate-300 mb-4">
                Ity Ivo-toerana ity dia natao ho an'ny mpikambana sy ny
                mpanohana ny RCR / T.OLO.N.A hifandraisana, hifampizara hevitra,
                ary hitantana ireo tetikasa sy andraikitra isan-karazany.
              </p>
              <p className="text-slate-300">
                Ari-fenitra ary manaraka ny soatoavina fototra amin'ny asany
                rehetra ny RCR / T.OLO.N.A. Izany no antony namoronana ity
                sehatra ity mba hanamora ny fiaraha-miasa sy ny fitantanana
                tetikasa ao anatin'ny antoko.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-8 border border-slate-700/50">
              <h3 className="text-2xl font-bold mb-4">
                Anto-pijoroan'ny RCR / T.OLO.N.A
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-blue-400" />
                  <span>Neutralité</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-blue-400" />
                  <span>Tsy Miandany Fivavahana</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-blue-400" />
                  <span>Fifamenoina</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-blue-400" />
                  <span>Andraikitra</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Vonona Hanatevin-daharana ny RCR / T.OLO.N.A?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Mamoròna kaonty anio ary atombohy ny fitantanana ny tetikasanao.
          </p>
          <a
            href="/sign-up"
            className="inline-block px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-semibold transition"
          >
            Hangataka Hitsidika ny Ivo-toerana
          </a>
        </div>
      </section>

      {/* 🔹 Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
