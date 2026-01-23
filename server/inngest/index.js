import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import { sendEmail } from "../configs/nodemailer.js";

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
    console.log("Workspace member created:", data);
    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: String(data.role_name).toUpperCase() || "MPIKAMBANA",
      },
    });
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
];
