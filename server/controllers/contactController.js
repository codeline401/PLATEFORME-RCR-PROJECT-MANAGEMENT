import { sendEmail } from "../configs/nodemailer.js";

/**
 * 🔹 Contrôleur pour envoyer le formulaire de contact (guest) par email
 * Reçoit les données du formulaire SignUp et les envoie à la boîte mail spécifiée
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

    // 🔹 Créer le contenu HTML de l'email
    const emailBody = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          {/* En-tête avec logo */}
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
            <h1 style="color: #1e293b; margin: 0;">🎯 RCR / T.OLO.N.A</h1>
            <p style="color: #64748b; margin: 5px 0;">Formulaire d'inscription Guest</p>
          </div>

          {/* Contenu du formulaire */}
          <div style="margin: 20px 0;">
            <h2 style="color: #1e293b; font-size: 20px; margin-top: 0;">Informations du Candidat</h2>
            
            {/* Nom et Prénom */}
            <div style="margin: 15px 0; padding: 12px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong style="color: #1e293b;">Anarana sy Fanampiny (Nom et Prénom):</strong><br>
              <span style="color: #475569;">${anarana}</span>
            </div>

            {/* Région */}
            <div style="margin: 15px 0; padding: 12px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong style="color: #1e293b;">Faritra Hipetrahana (Région):</strong><br>
              <span style="color: #475569;">${faritra}</span>
            </div>

            {/* District */}
            <div style="margin: 15px 0; padding: 12px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong style="color: #1e293b;">Distrika hipetrahana (District):</strong><br>
              <span style="color: #475569;">${distrika}</span>
            </div>

            {/* Numéro WhatsApp */}
            <div style="margin: 15px 0; padding: 12px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong style="color: #1e293b;">📱 Numéro WhatsApp:</strong><br>
              <span style="color: #475569;">${whatsapp}</span>
            </div>

            {/* Raison de visite */}
            <div style="margin: 15px 0; padding: 12px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong style="color: #1e293b;">Antony Hitsidihana ny Pejy (Raison de visiter la page):</strong><br>
              <span style="color: #475569;">${antony.replace(/\n/g, "<br>")}</span>
            </div>

            {/* Statut Membre */}
            <div style="margin: 15px 0; padding: 12px; background-color: ${
              mpikambana === "OUI" ? "#dcfce7" : "#fee2e2"
            }; border-left: 4px solid ${
              mpikambana === "OUI" ? "#22c55e" : "#ef4444"
            }; border-radius: 4px;">
              <strong style="color: #1e293b;">Efa Mpikambana RCR ve ? (Déjà membre RCR ?):</strong><br>
              <span style="color: #475569; font-weight: bold; font-size: 16px;">${mpikambana}</span>
            </div>
          </div>

          {/* Pied de page */}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 5px 0;">
              📨 Formulaire envoyé automatiquement par la plateforme RCR / T.OLO.N.A
            </p>
            <p style="color: #64748b; font-size: 12px; margin: 5px 0;">
              Date: ${new Date().toLocaleString("fr-FR")}
            </p>
          </div>
        </div>
      </div>
    `;

    // 🔹 Envoyer l'email
    const result = await sendEmail(
      recipientEmail, // Email destinataire
      `🎉 Mpandray Anjara Vaovao Nandefa Fangatahana hiditra - ${anarana} | RCR / T.OLO.N.A`, // Sujet
      emailBody, // Contenu HTML
    );

    // ✅ Répondre avec succès
    return res.status(200).json({
      success: true,
      message:
        "Voaray ny Fangatahanao, Hisy Mpikambana Hifandray Aminao rehefa avy eo ao Amin'ny Whatsapp-nao",
      data: {
        messageId: result.messageId,
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
