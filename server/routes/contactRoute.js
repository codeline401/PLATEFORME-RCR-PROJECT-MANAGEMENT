import express from "express";
import { sendGuestForm } from "../controllers/contactController.js";

const contactRouter = express.Router();

/**
 * 🔹 Routes pour le contact/formulaires
 */

/**
 * 📧 POST /api/contact/send-guest-form
 * Envoyer le formulaire d'inscription guest par email
 * Body:
 * {
 *   anarana: string,      // Nom et Prénom
 *   faritra: string,      // Région/Province
 *   distrika: string,     // District
 *   whatsapp: string,     // Numéro WhatsApp
 *   antony: string,       // Raison de visiter la page
 *   mpikambana: string,   // OUI ou NON
 *   recipientEmail: string // Email destinataire
 * }
 */
contactRouter.post("/send-guest-form", sendGuestForm);

export default contactRouter;
