import prisma from "../../configs/prisma.js";

/**
 * Chercher un utilisateur par id ou clerkId
 * @param {string} userId - ID de l'utilisateur (peut être id ou clerkId)
 * @returns {Promise<Object|null>} - Utilisateur trouvé ou null
 */
export const findUserByIdOrClerkId = async (userId, selectFields = { id: true, name: true, email: true }) => {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: selectFields,
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: selectFields,
    });
  }

  return user;
};

/**
 * Vérifier si l'utilisateur est Lead ou Admin du projet
 * @param {Object} project - Projet avec workspace.members
 * @param {string} userId - ID de l'utilisateur
 * @returns {{ isLead: boolean, isAdmin: boolean }}
 */
export const checkProjectPermissions = (project, userId) => {
  const isLead = project.team_lead === userId;
  const isAdmin = project.workspace?.members?.some(
    (member) => member.userId === userId && member.role === "ADMIN"
  );
  return { isLead, isAdmin };
};

/**
 * Collecter les emails des admins du workspace (excluant un email spécifique)
 * @param {Array} members - Membres du workspace avec role ADMIN
 * @param {string} excludeEmail - Email à exclure (généralement le lead)
 * @returns {string[]} - Liste des emails
 */
export const getAdminEmails = (members, excludeEmail) => {
  return members
    .filter((m) => m.user && m.user.email !== excludeEmail)
    .map((m) => m.user.email);
};

/**
 * Templates d'emails pour les contributions
 */
export const emailTemplates = {
  // Email pour contribution matérielle en attente
  materialContributionPending: ({ contributorName, projectName, resourceName, quantity, message }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">📦 Fanolorana materialy vaovao miandry</h2>
      <p>Miarahaba,</p>
      <p>Ny Kamarady <strong>${contributorName}</strong> dia mikasa hanome fanampiana ao amin'ilay tetikasa <strong>${projectName}</strong>.</p>
      
      <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Ressource:</strong> ${resourceName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Quantité proposée:</strong> ${quantity}</p>
        ${message ? `<p style="margin: 0;"><strong>Message:</strong> ${message}</p>` : ""}
      </div>
      
      <p>Jereo mivantana ao amin'ny Ivo-toerana raha ekenao na tsia izany fanampiana izany.</p>
      
      <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
        — Francis - RCR Project Management
      </p>
    </div>
  `,

  // Email pour contribution matérielle approuvée
  materialContributionApproved: ({ contributorName, projectName, resourceName, quantity }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">✓ Nekena ilay fanampianao</h2>
      <p>Miarahaba Kamarady ${contributorName},</p>
      <p>Vaoray ary nekena ny fanampianao ao amin'ny ilay tetikasa <strong>${projectName}</strong>.</p>
      
      <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #22c55e;">
        <p style="margin: 0 0 8px 0;"><strong>Ressource:</strong> ${resourceName}</p>
        <p style="margin: 0;"><strong>Quantité:</strong> ${quantity}</p>
      </div>
      
      <p>Misaotra betsaka amin'ny fanampianao !</p>
      
      <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
        — Francis - RCR Project Management
      </p>
    </div>
  `,

  // Email pour contribution matérielle rejetée
  materialContributionRejected: ({ contributorName, projectName, resourceName, quantity, reason }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Contribution non retenue</h2>
      <p>Salama Kamarady ${contributorName},</p>
      <p>Tsy voaray ny fanampiana <strong>${projectName}</strong> kasainao atolotra</p>
      
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0 0 8px 0;"><strong>Ressource:</strong> ${resourceName}</p>
        <p style="margin: 0;"><strong>Quantité:</strong> ${quantity}</p>
        ${reason ? `<p style="margin: 8px 0 0 0;"><strong>Raison:</strong> ${reason}</p>` : ""}
      </div>
      
      <p>Misaotra betsaka ny amin'ny fandraisanao anjara. Jereo ireo tetikasa hafa izay mbola mila fanampiana.</p>
      
      <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
        Francis — L'équipe RCR Project Management
      </p>
    </div>
  `,

  // Email pour contribution financière en attente
  financialContributionPending: ({ contributorName, projectName, amount, reference }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">💰 Fanohanana ara-bola miandry</h2>
      <p>Miarahaba,</p>
      <p>Ny Kamarady <strong>${contributorName}</strong> dia nandefa fanohanana ara-bola ho an'ny tetikasa <strong>${projectName}</strong>.</p>

      <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Vola:</strong> ${amount.toLocaleString()} Ar</p>
        <p style="margin: 0;"><strong>Reference:</strong> ${reference}</p>
      </div>

      <p>Azafady hamarino ao amin'ny Ivo-toerana raha voaray.</p>

      <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
        — Francis - RCR Project Management
      </p>
    </div>
  `,

  // Email pour contribution financière approuvée
  financialContributionApproved: ({ contributorName, projectName, amount, reference }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">✓ Voaray ny fanampianao</h2>
      <p>Miarahaba Kamarady ${contributorName},</p>
      <p>Voaray ary nekena ny fanampianao ara-bola ho an'ny tetikasa <strong>${projectName}</strong>.</p>
      
      <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #22c55e;">
        <p style="margin: 0 0 8px 0;"><strong>Vola:</strong> ${amount.toLocaleString()} Ar</p>
        <p style="margin: 0;"><strong>Reference:</strong> ${reference || "N/A"}</p>
        <p style="margin: 8px 0 0 0;"><strong>Daty:</strong> ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
      
      <p>Misaotra betsaka amin'ny fanohanana !</p>
      
      <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
        — Francis - RCR Project Management
      </p>
    </div>
  `,

  // Email pour participation humaine confirmée (au participant)
  humanParticipationConfirmed: ({ participantName, projectName, resourceName }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">✓ Voamarina ny firotsahanao</h2>
      <p>Miarahaba ${participantName},</p>
      <p>Voaray soa aman-tsara ny firotsahanao ho <strong>${resourceName}</strong> ao amin'ny tetikasa <strong>${projectName}</strong>.</p>
      
      <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #22c55e;">
        <p style="margin: 0 0 8px 0;"><strong>Andraikitra:</strong> ${resourceName}</p>
        <p style="margin: 0;"><strong>Tetikasa:</strong> ${projectName}</p>
      </div>
      
      <p>Misaotra anao noho ny fandraisanao anjara!</p>
      
      <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
        — L'équipe RCR Project Management
      </p>
    </div>
  `,

  // Email notification au lead pour nouvelle participation
  humanParticipationNotifyLead: ({ leadName, participantName, participantEmail, projectName, resourceName, message }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Mpikambana vaovao</h2>
      <p>Miarahaba ${leadName},</p>
      <p><strong>${participantName}</strong> dia nirotsaka ho <strong>${resourceName}</strong> ao amin'ny tetikasanao <strong>${projectName}</strong>.</p>
      
      <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Andraikitra:</strong> ${resourceName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Anarana:</strong> ${participantName}</p>
        <p style="margin: 0;"><strong>Email:</strong> ${participantEmail}</p>
        ${message ? `<p style="margin: 8px 0 0 0;"><strong>Hafatra:</strong> ${message}</p>` : ""}
      </div>
      
      <p style="color: #71717a; font-size: 12px; margin-top: 32px;">
        — L'équipe RCR Project Management
      </p>
    </div>
  `,
};
