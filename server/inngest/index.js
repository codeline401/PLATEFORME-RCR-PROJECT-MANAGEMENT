import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import { sendEmail } from "../configs/nodemailer.js";
import { emailTemplates } from "../controllers/helpers/contributionHelpers.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "RCR PROJECT MANAGEMENT" });

// Inngest functions to save user date to a db
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    // Function logic to sync user data to the database goes here
    const { data } = event;
    console.log("New user created:", data);
    await prisma.user.create({
      data: {
        id: data.id,
        email: data.email_addresses[0]?.email_address || null,
        name: data.first_name + " " + data.last_name,
        image: data.profile_image_url || null,
      },
    });
  },
);

// Inngest functions to delete user date to a db
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    // Function logic to sync user data to the database goes here
    const { data } = event;
    console.log("New user created:", data);
    await prisma.user.delete({
      where: {
        id: data.id,
      },
    });
  },
);

// Inngest function to update user data in the db
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    // Function logic to sync user data to the database goes here
    const { data } = event;
    console.log("New user created:", data);
    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        email: data.email_addresses[0]?.email_address || null,
        name: data.first_name + " " + data.last_name,
        image: data.profile_image_url || null,
      },
    });
  },
);

// Inngest function to save worksapce data to a db
const syncWorkspaceCreation = inngest.createFunction(
  { id: "sync-workspace-from-clerk" },
  { event: "clerk/organization.created" },
  async ({ event }) => {
    const { data } = event;
    console.log("New workspace created:", data);
    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url || null,
      },
    });
    // Add creator as ADMIN member
    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN",
      },
    });
  },
);

// Inngest function to update worksapce data to a db
const syncWorkspaceUpdation = inngest.createFunction(
  { id: "update-workspace-from-clerk" },
  { event: "clerk/organization.updated" },
  async ({ event }) => {
    const { data } = event;
    console.log("Workspace updated:", data);
    await prisma.workspace.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url || null,
      },
    });
  },
);

// Inngest function to delete worksapce data from a db
const syncWorkspaceDeletion = inngest.createFunction(
  { id: "delete-workspace-with-clerk" },
  { event: "clerk/organization.deleted" },
  async ({ event }) => {
    const { data } = event;
    console.log("Workspace deleted:", data);
    await prisma.workspace.delete({
      where: {
        id: data.id,
      },
    });
  },
);

// Inngest functions to save workspace member data to a db
const syncWorkSpaceMemberCreation = inngest.createFunction(
  { id: "sync-workspace-member-from-clerk" },
  { event: "clerk/organizationInvitation.accepted" },
  async ({ event }) => {
    const { data } = event;
    console.log("🔍 Workspace member invitation accepted:", {
      user_id: data.user_id,
      organization_id: data.organization_id,
      role_name: data.role_name,
      fullData: data,
    });

    try {
      // Vérifier si la relation n'existe pas déjà
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          userId: data.user_id,
          workspaceId: data.organization_id,
        },
      });

      if (existingMember) {
        console.log("✅ WorkspaceMember already exists, skipping creation");
        return;
      }

      const newMember = await prisma.workspaceMember.create({
        data: {
          userId: data.user_id,
          workspaceId: data.organization_id,
          role: String(data.role_name).toUpperCase() || "MPIKAMBANA",
        },
      });

      console.log("✅ WorkspaceMember created successfully:", newMember);
    } catch (error) {
      console.error("❌ Error creating workspace member:", error);
      throw error;
    }
  },
);

// Inngest function to Send Email on Task Creation
const sendTaskAssignmentEmail = inngest.createFunction(
  { id: "send-task-assignment-email" },
  { event: "app/task.assigned" },
  async ({ event, step }) => {
    const { taskId, origin } = event.data;
    console.log(`🔍 Processing task assignment for taskId: ${taskId}`);

    // Fetch task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, project: true },
    });

    console.log(`📝 Task found:`, {
      id: task?.id,
      title: task?.title,
      assigneeId: task?.assigneeId,
      assignee: task?.assignee
        ? {
            id: task.assignee.id,
            email: task.assignee.email,
            name: task.assignee.name,
          }
        : null,
      project: task?.project
        ? { id: task.project.id, name: task.project.name }
        : null,
    });

    if (!task) {
      console.error(`❌ Task ${taskId} not found`);
      return;
    }

    if (!task.assignee) {
      console.log(`⏭️ Task ${taskId} has no assignee`);
      return;
    }

    if (!task.assignee.email) {
      console.error(`❌ Assignee ${task.assignee.id} has no email`);
      return;
    }

    try {
      console.log(`📧 Email to: "${task.assignee.email}"`);
      console.log(
        `📧 Subject: "Asa vaovao ho anao ao amin'ilay Tetikasa: ${task.project.name}"`,
      );

      // Validate email before sending
      if (
        !task.assignee.email ||
        typeof task.assignee.email !== "string" ||
        task.assignee.email.trim() === ""
      ) {
        throw new Error(`Invalid email: ${task.assignee.email}`);
      }

      const emailResult = await sendEmail(
        task.assignee.email,
        `Asa vaovao ho anao ao amin'ilay Tetikasa: ${task.project.name}`,
        `<div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.6;">
              <p>
                Salama Kamarady <strong>${task.assignee.name}</strong> 👋
              </p>
              <p>
                Nahazo <strong>asa vaovao</strong> ianao ao amin'ny tetikasa
                <strong>"${task.project.name}"</strong>.
              </p>

              <div style="margin: 16px 0; padding: 12px; background-color: #f9fafb; border-left: 4px solid #2563eb;">
                <p style="margin: 0;">
                  <strong>Anarana Asa :</strong><br />
                  ${task.title}
                  <strong>Daty tokony hahavitan'io asa io:</strong><br/>
                  ${task.due_date ? new Date(task.due_date).toLocaleDateString() : "Tsy misy"}
                </p>

                <p style="margin: 8px 0 0 0;">
                  <strong>Famaritana :</strong><br />
                  ${task.description || "Tsy misy famaritana"}
                </p>
              </div>
                <p>
                  Azonao jerena ny antsipiriany sy ny fanavaozana rehetra amin'ny alalan'ity rohy ity :
                </p>

                <p>
                  <a
                    href="${origin}/projects/${task.projectId}/tasks/${task.id}"
                    style="
                      display: inline-block;
                      padding: 10px 16px;
                      background-color: #2563eb;
                      color: #ffffff;
                      text-decoration: none;
                      border-radius: 6px;
                      font-weight: bold;
                    "
                  >
                    🔎 Hitsidika ilay Tetikasa
                  </a>
                </p>

                <p style="margin-top: 24px; color: #374151;">
                  Mirary soa,<br />
                  <strong>RCR / T.OLO.N.A</strong> <br />
                  Francis R.
                </p>
              </div>`,
      );
      console.log(`✅ Email sent successfully to ${task.assignee.email}`);
    } catch (emailError) {
      console.error(
        `❌ Failed to send email to ${task.assignee.email}:`,
        emailError.message,
      );
      throw emailError;
    }

    if (
      new Date(task.due_date).toLocaleDateString() !== new Date().toDateString()
    ) {
      await step.sleepUntil("wait-for-the-due-date", new Date(task.due_date)); // wait until due date

      await step.run("check-if-task-is-completed", async () => {
        // check if task is completed
        const currentTask = await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: true, project: true },
        });

        if (!currentTask) return; // task not found

        if (currentTask.status !== "DONE") {
          await step.run("send-task-reminder-mail", async () => {
            // send reminder email
            await sendEmail(
              currentTask.assignee.email,
              `Fampatsiahivana anao ilay asa ${task.project.name} mbola tsy vita`,
              `<div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.6;">
                      <p>
                        Salama Kamarady <strong>${currentTask.assignee.name}</strong> 👋
                      </p>
                      <p>
                        Ity dia fampatsiahivana fotsiny fa mbola misy asa tsy vita ao amin'ny tetikasa
                        <strong>"${currentTask.project.name}"</strong>.
                      </p>
                      <div style="margin: 16px 0; padding: 12px; background-color: #f9fafb; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0;">
                          <strong>Anarana Asa :</strong><br />
                          ${currentTask.title}
                          <strong>Daty :</strong><br/>
                          ${new Date(currentTask.due_date).toLocaleDateString()}
                        </p>
                        <p style="margin: 8px 0 0 0;">
                          <strong>Famaritana :</strong><br />
                          ${currentTask.description || "Tsy misy famaritana"}
                        </p>
                      </div>
                      <p>
                        Azonao jerena ny antsipiriany sy ny fanavaozana rehetra amin'ny alalan'ity rohy ity :
                      </p>
                      <p>
                        <a
                          href="${origin}/projects/${currentTask.projectId}/tasks/${currentTask.id}"
                          style="
                            display: inline-block;
                            padding: 10px 16px;
                            background-color: #2563eb;
                            color: #ffffff;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: bold;
                          "
                        >
                          🔎 Hitsidika ilay Tetikasa
                        </a>
                      </p>
                      <p style="margin-top: 24px; color: #374151;">
                        Mirary soa,<br />
                        <strong>RCR / T.OLO.N.A</strong>
                      </p>
                    </div>`,
            );
          });
        }
      });
    }
  },
);

// =============================================================================
// EMAIL FUNCTIONS - CONTRIBUTIONS
// =============================================================================

// Financial Contribution - Pending (to Lead & Admins)
const sendFinancialContributionPendingEmail = inngest.createFunction(
  { id: "send-financial-contribution-pending-email" },
  { event: "app/contribution.financial.pending" },
  async ({ event }) => {
    const { emails, contributorName, projectName, amount, reference } = event.data;
    
    const emailContent = emailTemplates.financialContributionPending({
      contributorName,
      projectName,
      amount,
      reference,
    });

    for (const email of emails) {
      try {
        await sendEmail(
          email,
          `[${projectName}] Fanohanana ara-bola miandry`,
          emailContent,
        );
        console.log(`✅ Email sent to ${email} for financial contribution pending`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error.message);
      }
    }
  },
);

// Financial Contribution - Approved (to Contributor)
const sendFinancialContributionApprovedEmail = inngest.createFunction(
  { id: "send-financial-contribution-approved-email" },
  { event: "app/contribution.financial.approved" },
  async ({ event }) => {
    const { contributorEmail, contributorName, projectName, amount, reference } = event.data;
    
    try {
      await sendEmail(
        contributorEmail,
        `✓ Voaray ny fanampianao ara-bola`,
        emailTemplates.financialContributionApproved({
          contributorName,
          projectName,
          amount,
          reference,
        }),
      );
      console.log(`✅ Email sent to ${contributorEmail} for financial contribution approved`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${contributorEmail}:`, error.message);
    }
  },
);

// Material Contribution - Pending (to Lead & Admins)
const sendMaterialContributionPendingEmail = inngest.createFunction(
  { id: "send-material-contribution-pending-email" },
  { event: "app/contribution.material.pending" },
  async ({ event }) => {
    const { emails, contributorName, projectName, resourceName, quantity, message } = event.data;
    
    const emailContent = emailTemplates.materialContributionPending({
      contributorName,
      projectName,
      resourceName,
      quantity,
      message,
    });

    for (const email of emails) {
      try {
        await sendEmail(
          email,
          `[${projectName}] Fanolorana materialy miandry`,
          emailContent,
        );
        console.log(`✅ Email sent to ${email} for material contribution pending`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error.message);
      }
    }
  },
);

// Material Contribution - Approved (to Contributor)
const sendMaterialContributionApprovedEmail = inngest.createFunction(
  { id: "send-material-contribution-approved-email" },
  { event: "app/contribution.material.approved" },
  async ({ event }) => {
    const { contributorEmail, contributorName, projectName, resourceName, quantity } = event.data;
    
    try {
      await sendEmail(
        contributorEmail,
        `Nekene ilay fanampianao !`,
        emailTemplates.materialContributionApproved({
          contributorName,
          projectName,
          resourceName,
          quantity,
        }),
      );
      console.log(`✅ Email sent to ${contributorEmail} for material contribution approved`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${contributorEmail}:`, error.message);
    }
  },
);

// Material Contribution - Rejected (to Contributor)
const sendMaterialContributionRejectedEmail = inngest.createFunction(
  { id: "send-material-contribution-rejected-email" },
  { event: "app/contribution.material.rejected" },
  async ({ event }) => {
    const { contributorEmail, contributorName, projectName, resourceName, quantity, reason } = event.data;
    
    try {
      await sendEmail(
        contributorEmail,
        `Contribution non retenue`,
        emailTemplates.materialContributionRejected({
          contributorName,
          projectName,
          resourceName,
          quantity,
          reason,
        }),
      );
      console.log(`✅ Email sent to ${contributorEmail} for material contribution rejected`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${contributorEmail}:`, error.message);
    }
  },
);

// Human Participation - Confirmed (to Participant)
const sendHumanParticipationConfirmedEmail = inngest.createFunction(
  { id: "send-human-participation-confirmed-email" },
  { event: "app/contribution.human.confirmed" },
  async ({ event }) => {
    const { participantEmail, participantName, projectName, resourceName } = event.data;
    
    try {
      await sendEmail(
        participantEmail,
        `Firotsahana voamarina - ${projectName}`,
        emailTemplates.humanParticipationConfirmed({
          participantName,
          projectName,
          resourceName,
        }),
      );
      console.log(`✅ Email sent to ${participantEmail} for human participation confirmed`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${participantEmail}:`, error.message);
    }
  },
);

// Human Participation - Notify Lead
const sendHumanParticipationNotifyLeadEmail = inngest.createFunction(
  { id: "send-human-participation-notify-lead-email" },
  { event: "app/contribution.human.notify-lead" },
  async ({ event }) => {
    const { leadEmail, leadName, participantName, participantEmail, projectName, resourceName, message } = event.data;
    
    try {
      await sendEmail(
        leadEmail,
        `[${projectName}] Mpikambana vaovao nirotsaka`,
        emailTemplates.humanParticipationNotifyLead({
          leadName,
          participantName,
          participantEmail,
          projectName,
          resourceName,
          message,
        }),
      );
      console.log(`✅ Email sent to ${leadEmail} for human participation notification`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${leadEmail}:`, error.message);
    }
  },
);

// Guest Form - Contact
const sendGuestFormEmail = inngest.createFunction(
  { id: "send-guest-form-email" },
  { event: "app/contact.guest-form" },
  async ({ event }) => {
    const { recipientEmail, anarana, faritra, distrika, whatsapp, antony, mpikambana } = event.data;
    
    const emailBody = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
            <h1 style="color: #1e293b; margin: 0;">🎯 RCR / T.OLO.N.A</h1>
            <p style="color: #64748b; margin: 5px 0;">Formulaire d'inscription Guest</p>
          </div>
          <div style="margin: 20px 0;">
            <h2 style="color: #1e293b; font-size: 20px; margin-top: 0;">Informations du Candidat</h2>
            <div style="margin: 15px 0; padding: 12px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong style="color: #1e293b;">Anarana sy Fanampiny (Nom et Prénom):</strong><br>
              <span style="color: #475569;">${anarana}</span>
            </div>
            <div style="margin: 15px 0; padding: 12px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong style="color: #1e293b;">Faritra Hipetrahana (Région):</strong><br>
              <span style="color: #475569;">${faritra}</span>
            </div>
            <div style="margin: 15px 0; padding: 12px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong style="color: #1e293b;">Distrika hipetrahana (District):</strong><br>
              <span style="color: #475569;">${distrika}</span>
            </div>
            <div style="margin: 15px 0; padding: 12px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong style="color: #1e293b;">📱 Numéro WhatsApp:</strong><br>
              <span style="color: #475569;">${whatsapp}</span>
            </div>
            <div style="margin: 15px 0; padding: 12px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong style="color: #1e293b;">Antony Hitsidihana ny Pejy (Raison de visiter la page):</strong><br>
              <span style="color: #475569;">${antony.replace(/\n/g, "<br>")}</span>
            </div>
            <div style="margin: 15px 0; padding: 12px; background-color: ${mpikambana === "OUI" ? "#dcfce7" : "#fee2e2"}; border-left: 4px solid ${mpikambana === "OUI" ? "#22c55e" : "#ef4444"}; border-radius: 4px;">
              <strong style="color: #1e293b;">Efa Mpikambana RCR ve ? (Déjà membre RCR ?):</strong><br>
              <span style="color: #475569; font-weight: bold; font-size: 16px;">${mpikambana}</span>
            </div>
          </div>
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

    try {
      const result = await sendEmail(
        recipientEmail,
        `🎉 Mpandray Anjara Vaovao Nandefa Fangatahana hiditra - ${anarana} | RCR / T.OLO.N.A`,
        emailBody,
      );
      console.log(`✅ Guest form email sent to ${recipientEmail}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send guest form email to ${recipientEmail}:`, error.message);
      throw error;
    }
  },
);

// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceUpdation,
  syncWorkspaceDeletion,
  syncWorkSpaceMemberCreation,
  sendTaskAssignmentEmail,
  // Email functions - Contributions
  sendFinancialContributionPendingEmail,
  sendFinancialContributionApprovedEmail,
  sendMaterialContributionPendingEmail,
  sendMaterialContributionApprovedEmail,
  sendMaterialContributionRejectedEmail,
  sendHumanParticipationConfirmedEmail,
  sendHumanParticipationNotifyLeadEmail,
  sendGuestFormEmail,
];
