import { inngest } from "../inngest/index.js";
import prisma from "../configs/prisma.js";
import { sendEmail } from "../configs/nodemailer.js";

// Create task
export const createTask = async (req, res) => {
  try {
    // Implementation for creating a task
    const { userId } = await req.auth; // get userId from auth middleware
    const {
      projectId,
      title,
      description,
      type,
      status,
      priority,
      assigneeId,
      due_date,
    } = req.body; // get task details from request body

    const origin = req.get("origin"); // get origin from request headers

    // Check if user has admin role for project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      // check if project exists
      res.status(404).json({ message: "Tsy misy na tsy hita io Tekikasa io" });
    } else if (project.team_lead !== userId) {
      // check if user is team lead
      res.status(403).json({
        message: "Tsy manana alalana ianao hanampy Asa ao amin'io Tetikasa io",
      });
    } else if (
      assigneeId &&
      !project.members.some((m) => m.userId === assigneeId)
    ) {
      // check if assignee is a member of the project
      res.status(400).json({
        message:
          "Tsy mpikambana ao amin'io Tetikasa io na tsy ao anaty Tranon'Asa ny olona asaina",
      });
    }

    const task = await prisma.task.create({
      // create the task
      data: {
        projectId,
        title,
        description,
        type,
        status,
        priority,
        assigneeId: assigneeId || null,
        due_date: due_date ? new Date(due_date) : null,
      },
    });

    const taskWithAssignee = await prisma.task.findUnique({
      where: { id: task.id },
      include: { assignee: true, project: true },
    });

    // send email directly if task has an assignee
    if (
      assigneeId &&
      taskWithAssignee?.assignee?.email &&
      taskWithAssignee?.project
    ) {
      try {
        await sendEmail(
          taskWithAssignee.assignee.email,
          `Asa vaovao ho anao ao amin'ilay Tetikasa: ${taskWithAssignee.project.name}`,
          `<div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.6;">
            <p>Salama Kamarady <strong>${taskWithAssignee.assignee.name}</strong> 👋</p>
            <p>Nahazo <strong>asa vaovao</strong> ianao ao amin'ny tetikasa <strong>"${taskWithAssignee.project.name}"</strong>.</p>
            <div style="margin: 16px 0; padding: 12px; background-color: #f9fafb; border-left: 4px solid #2563eb;">
              <p style="margin: 0;">
                <strong>Anarana Asa :</strong><br/>${taskWithAssignee.title}<br/>
                <strong>Daty tokony hahavitan'io asa io :</strong><br/>${taskWithAssignee.due_date ? new Date(taskWithAssignee.due_date).toLocaleDateString() : "Tsy misy"}
              </p>
              <p style="margin: 8px 0 0 0;">
                <strong>Famaritana :</strong><br/>${taskWithAssignee.description || "Tsy misy famaritana"}
              </p>
            </div>
            <p><a href="${origin || "http://localhost:5173"}/projects/${taskWithAssignee.projectId}/tasks/${taskWithAssignee.id}" style="display: inline-block; padding: 10px 16px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">🔎 Hitsidika ilay Tetikasa</a></p>
            <p style="margin-top: 24px; color: #374151;">Mirary soa,<br/><strong>RCR / T.OLO.N.A</strong><br /> Francis R.</p>
          </div>`,
        );
        console.log(
          `✅ Email sent successfully to ${taskWithAssignee.assignee.email}`,
        );
      } catch (emailError) {
        console.error(`❌ Failed to send email:`, emailError.message);
      }
    }

    // Respond with the created task
    res.json({
      message: "Asa voaforonina soa aman-tsara",
      task: taskWithAssignee,
    });
  } catch (error) {
    // Handle error
    console.error("Nisy olana teo amin'ny famoronana an'ilay asa :", error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    // Implementation for updating a task

    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      return res
        .status(404)
        .json({ message: "Tsy hita na Tsy misy io Asa io" });
    }
    const { userId } = await req.auth; // get userId from auth middleware

    // Check if user has admin role for project
    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      // check if project exists
      res.status(404).json({ message: "Tsy misy na tsy hita io Tekikasa io" });
    } else if (project.team_lead !== userId) {
      // check if user is team lead
      res.status(403).json({
        message: "Tsy manana alalana ianao hanampy Asa ao amin'io Tetikasa io",
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
    });

    // Respond with the updated task
    res.json({
      task: updatedTask,
      message: "Asa voavao voaforina soa aman-tsara",
    });
  } catch (error) {
    // Handle error
    console.error("Error updating task:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    // Implementation for deleting a task
    const { userId } = await req.auth; // get userId from auth middleware
    const { taskIds } = req.body; // get task IDs from request body
    const tasks = await prisma.task.findMany({
      // fetch tasks to be deleted
      where: { id: { in: taskIds } },
    });

    if (tasks.length === 0) {
      // no tasks found
      return res.status(404).json({
        message: "Tsy misy na tsy hita ireo Asa nangatahana ho fafana ireo",
      });
    }

    // Check if user has admin role for project
    const project = await prisma.project.findUnique({
      where: { id: tasks[0].projectId }, // assuming all tasks belong to the same project
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      // check if project exists
      res.status(404).json({ message: "Tsy misy na tsy hita io Tekikasa io" });
    } else if (project.team_lead !== userId) {
      // check if user is team lead
      res.status(403).json({
        message:
          "Tsy manana alalana ianao hanampy Asa ao amin'io Tetikasa io ianao",
      });
    }

    await prisma.task.deleteMany({
      // delete the tasks
      where: { id: { in: taskIds } },
    });
    // Respond with the updated task
    res.json({
      message: "Asa voafafa soa aman-tsara",
    });
  } catch (error) {
    // Handle error
    console.error("Error deleting task:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};
