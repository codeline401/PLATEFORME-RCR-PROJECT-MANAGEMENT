import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../configs/api";
import Footer from "./Footer";

const SignUp = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false); // État pour afficher la modale de confirmation
  const [isLoading, setIsLoading] = useState(false); // État pour le chargement lors de la soumission

  // État du formulaire avec tous les champs
  const [formData, setFormData] = useState({
    anarana: "", // Nom et Prénom
    email: "", // Email personnel
    faritra: "", // Région/Province
    distrika: "", // District
    whatsapp: "", // Numéro WhatsApp
    antony: "", // Raison de visiter la page
    mpikambana: "", // Efa Mpikambana RCR ve ? (OUI/NON)
  });

  // emails des admins qui gère les inscriptions guests
  const adminEmails = [
    "f6randrianarivony@gmail.com",
    "rijarantoanina444@gmail.com",
  ];

  /**
   * 🔹 Gestion du changement de champs
   */
  const handleInputChange = (e) => {
    // Gérer les changements pour tous les champs du formulaire
    const { name, value } = e.target; // Récupérer le nom et la valeur du champ modifié
    setFormData((prev) => ({
      // Mettre à jour l'état du formulaire de manière dynamique
      ...prev, // Conserver les autres champs inchangés
      [name]: value, // Mettre à jour le champ modifié
    }));
  };

  /**
   * 🔹 Validation du formulaire
   */
  const validateForm = () => {
    // Vérifier que tous les champs sont remplis
    if (
      !formData.anarana.trim() ||
      !formData.email.trim() ||
      !formData.faritra.trim() ||
      !formData.distrika.trim() ||
      !formData.whatsapp.trim() ||
      !formData.antony.trim() ||
      !formData.mpikambana
    ) {
      toast.error("Mila fenoina avokoa izy rehetra");
      return false; // Arrêter la validation si un champ est vide
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex basique pour valider les emails
    if (!emailRegex.test(formData.email.trim())) {
      // Trim pour éviter les espaces avant/après
      toast.error("Tsy mety io adiresy mailaka io");
      return false; // Arrêter la validation si l'email est invalide
    }

    // Valider le numéro WhatsApp (format basique)
    const whatsappRegex = /^[\d+\-\s]{10,20}$/; // Accepte les chiffres, +, -, espaces, et une longueur de 10 à 20 caractères
    if (!whatsappRegex.test(formData.whatsapp.trim())) {
      toast.error("Tsy mety io nomerao WhatsApp io");
      return false; // Arrêter la validation si le numéro WhatsApp est invalide
    }

    return true; // Tous les champs sont valides, continuer la soumission
  };

  /**
   * 🔹 Soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valider avant d'envoyer
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 📧 Envoyer les données au backend
      const response = await api.post("/api/contact/send-guest-form", {
        ...formData,
        recipientEmail: adminEmails.join(","), // Envoyer à tous les admins, séparés par des virgules
      });

      // ✅ Si succès, afficher la modale de confirmation
      if (response.status === 200 || response.status === 201) {
        // Accepter aussi 201 Created
        setShowModal(true); // Afficher la modale de confirmation
      }
    } catch (error) {
      // ❌ Gestion des erreurs
      console.error("Erreur lors de l'envoi:", error);
      toast.error(
        error.response?.data?.message ||
          "Nisy zavatra tsy nety tamin'ny fandefasana ilay fangatahana, andramo averina hoe azafady",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🔹 Fermer la modale et rediriger vers la page d'accueil
   */
  const handleCloseModal = () => {
    setShowModal(false);
    // Réinitialiser le formulaire
    setFormData({
      anarana: "",
      email: "",
      faritra: "",
      distrika: "",
      whatsapp: "",
      antony: "",
      mpikambana: "",
    });
    // Rediriger vers la page d'accueil
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* 🔹 Navigation avec bouton retour */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm hover:text-blue-400 transition"
            >
              <ArrowLeft size={20} />
              HIVERINA
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold">
                RCR
              </div>
              <span className="font-bold text-lg">T.OLO.N.A</span>
            </div>
          </div>
        </div>
      </nav>

      {/* 🔹 Contenu principal */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* 🔹 En-tête */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Lihana ny amin'ny RCR / T.OLO.N.A
            </h1>
            <p className="text-xl text-slate-300">
              Ampidiro eto ny mombanao dia andao hiara-hiasa
            </p>
          </div>

          {/* 🔹 Formulaire principal */}
          <form
            onSubmit={handleSubmit}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 space-y-6"
          >
            {/* 🔹 Champ 1: Anarana sy Fanampiny */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Anarana sy Fanampiny *
              </label>
              <input
                type="text"
                name="anarana"
                value={formData.anarana}
                onChange={handleInputChange}
                placeholder="Ampidiro eto ny anaranao feno"
                className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 🔹 Champ 2: Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Mailaka *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Ampidiro eto ny adiresy mailaka"
                className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 🔹 Champ 3: Faritra */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Faritra Hipetrahana *
              </label>
              <input
                type="text"
                name="faritra"
                value={formData.faritra}
                onChange={handleInputChange}
                placeholder="Ampidiro ny Faritra misy anao"
                className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 🔹 Champ 4: Distrika */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Distrika Hipetrahana *
              </label>
              <input
                type="text"
                name="distrika"
                value={formData.distrika}
                onChange={handleInputChange}
                placeholder="Ampidiro ny Distrika misy anao"
                className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 🔹 Champ 5: Numéro WhatsApp */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Numéro WhatsApp *
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                placeholder="+261 33 XX XX XX"
                className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 🔹 Champ 6: Antony Hitsidihana */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Antony Fangatahana *
              </label>
              <textarea
                name="antony"
                value={formData.antony}
                onChange={handleInputChange}
                placeholder="Inona ny anton'ny fangathanao hitsidika ny Ivo-toerana"
                rows="4"
                className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
              ></textarea>
            </div>

            {/* 🔹 Champ 7: Efa Mpikambana RCR ve ? (OUI/NON) */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Efa Mpikambana RCR ve ? *
              </label>
              <div className="flex gap-6">
                {/* Option OUI */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mpikambana"
                    value="OUI"
                    checked={formData.mpikambana === "OUI"}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-300">OUI</span>
                </label>

                {/* Option NON */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mpikambana"
                    value="NON"
                    checked={formData.mpikambana === "NON"}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-300">NON</span>
                </label>
              </div>
            </div>

            {/* 🔹 Bouton de soumission */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Eo Ampandefasana" : "Ampidiro ny Fangatahana"}
            </button>
          </form>

          {/* 🔹 Petit texte en bas */}
          <p className="text-center text-sm text-slate-400 mt-6">
            * Tsy maintsy fenoina avokoa ny toerana rehetra misy ny marika
          </p>
        </div>
      </div>

      {/* 🔹 MODALE DE CONFIRMATION */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-8 max-w-md w-full text-center animate-fadeInUp">
            {/* 🎯 Icône de succès */}
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* 🔹 Titre de succès */}
            <h2 className="text-2xl font-bold text-white mb-4">
              Voaray ny Fangatahanao
            </h2>

            {/* 🔹 Message principal */}
            <p className="text-slate-300 mb-6">
              Hisy Mpikambana hanantona anao Afaka fotoana fohy any @ WhatsApp
            </p>

            {/* 🔹 Bouton de confirmation */}
            <button
              onClick={handleCloseModal}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-semibold text-white transition"
            >
              Manaiky
            </button>
          </div>
        </div>
      )}

      {/* 🔹 FOOTER */}
      <Footer />

      {/* 🎨 Styles d'animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SignUp;
