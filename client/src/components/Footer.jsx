/**
 * 🔹 Composant Footer réutilisable
 * Footer avec infos du parti et liens utiles
 */

const Footer = () => {
  return (
    <footer className="border-t border-slate-700/50 py-12 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
      <div className="max-w-7xl mx-auto">
        {/* 🔹 Contenu du Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* 🔹 Colonne 1: À propos */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white">
                RCR
              </div>
              <span className="font-bold text-slate-300">T.OLO.N.A</span>
            </div>
            <p className="text-sm text-slate-400">
              Plateforme de gestion pour le Parti RCR / TOLONA
            </p>
          </div>

          {/* 🔹 Colonne 2: Liens */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">
              Lien Utiles
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="text-sm text-slate-400 hover:text-blue-400 transition"
                >
                  Accueil
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-sm text-slate-400 hover:text-blue-400 transition"
                >
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="text-sm text-slate-400 hover:text-blue-400 transition"
                >
                  À propos
                </a>
              </li>
            </ul>
          </div>

          {/* 🔹 Colonne 3: Support */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@tolona.mg"
                  className="text-sm text-slate-400 hover:text-blue-400 transition"
                >
                  Hanome Fanampiana
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-400 hover:text-blue-400 transition"
                >
                  Mila Fanampiana
                </a>
              </li>
            </ul>
          </div>

          {/* 🔹 Colonne 4: Réseaux sociaux */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Réseau</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/50 flex items-center justify-center hover:bg-blue-600/40 transition"
                title="Facebook"
              >
                <span className="text-blue-400 font-bold">f</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/50 flex items-center justify-center hover:bg-blue-600/40 transition"
                title="Twitter"
              >
                <span className="text-blue-400 font-bold">X</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/50 flex items-center justify-center hover:bg-blue-600/40 transition"
                title="LinkedIn"
              >
                <span className="text-blue-400 font-bold">in</span>
              </a>
            </div>
          </div>
        </div>

        {/* 🔹 Séparateur */}
        <div className="border-t border-slate-700/50 py-8"></div>

        {/* 🔹 Pied de page */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-slate-400 text-sm">
          <p>
            &copy; 2026 by{" "}
            <a
              href="https://portfolio-francis-codeline401.vercel.app"
              className="hover:text-blue-400 transition"
            >
              codeline401
            </a>
            . Tous les droits réservés.
          </p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-blue-400 transition">
              Fepetra Fampiasana
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
