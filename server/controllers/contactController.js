import { inngest } from "../inngest/index.js";

/**
 * 🔹 Contrôleur pour envoyer le formulaire de contact (guest) par email
 * Reçoit les données du formulaire SignUp et les envoie via Inngest
 */

/**
 * 📧 Envoyer le formulaire d'inscription (guest) par email
 * POST /api/contact/send-guest-form
 */
export const sendGuestForm = async (req, res) => {
  try {
    // 🔹 Récupérer les données du formulaire du body
    const {
      anarana, // Nom et Prénom
      faritra, // Région/Province
      distrika, // District
      whatsapp, // Numéro WhatsApp
      antony, // Raison de visiter la page
      mpikambana, // Efa Mpikambana RCR ve ? (OUI/NON)
      recipientEmail, // Email destinataire
    } = req.body;

    // 🔹 Validation basique - vérifier que tous les champs sont présents
    if (
      !anarana ||
      !faritra ||
      !distrika ||
      !whatsapp ||
      !antony ||
      !mpikambana ||
      !recipientEmail
    ) {
      return res.status(400).json({
        success: false,
        message: "Vérifier que tous les champs sont remplis",
      });
    }

    // 🔹 Envoyer l'email via Inngest
    await inngest.send({
      name: "app/contact.guest-form",
      data: {
        recipientEmail,
        anarana,
        faritra,
        distrika,
        whatsapp,
        antony,
        mpikambana,
      },
    });

    // ✅ Répondre avec succès
    return res.status(200).json({
      success: true,
      message:
        "Voaray ny Fangatahanao, Hisy Mpikambana Hifandray Aminao rehefa avy eo ao Amin'ny Whatsapp-nao",
      data: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // ❌ Gestion des erreurs
    console.error("Erreur lors de l'envoi du formulaire:", error);
    return res.status(500).json({
      success: false,
      message: "Nisy Zavatra Tsy Nety Teo Amin'ny Fangatahanao, andao averina",
      error: error.message,
    });
  }
};
