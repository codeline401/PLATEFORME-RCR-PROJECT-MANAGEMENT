import { inngest } from "../inngest/index.js";
import prisma from "../configs/prisma.js";

// Helper function to get progress from status
const getProgressFromStatus = (status) => {
  switch (status) {
    case "TODO":
      return 0;
    case "IN_PROGRESS":
      return 50;
    case "DONE":
      return 100;
    default:
      return 0;
  }
};

// Helper function to update project progress based on tasks average
const updateProjectProgress = async (projectId) => {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { progress: true },
  });

  if (tasks.length === 0) {
    await prisma.project.update({
      where: { id: projectId },
      data: { progress: 0 },
    });
    return 0;
  }

  const totalProgress = tasks.reduce(
    (sum, task) => sum + (task.progress || 0),
    0,
  );
  const averageProgress = Math.round(totalProgress / tasks.length);

  await prisma.project.update({
    where: { id: projectId },
    data: { progress: averageProgress },
  });

  return averageProgress;
};

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
      objective, // Tanjona
      result, // Vokatra
      risk, // Loza
      keyFactor, // Singa fototra / Antony manosika
      keyFactorAcquired, // Efa azo ve ny singa fototra?
    } = req.body; // get task details from request body

    const origin = req.get("origin"); // get origin from request headers

    // Validate required fields
    if (!projectId || !title || !assigneeId) {
      return res.status(400).json({
        message: "projectId, title, et assigneeId sont obligatoires",
      });
    }

    // Check if user has admin role for project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      // check if project exists
      return res
        .status(404)
        .json({ message: "Tsy misy na tsy hita io Tekikasa io" });
    } else if (project.team_lead !== userId) {
      // check if user is team lead
      return res.status(403).json({
        message: "Tsy manana alalana ianao hanampy Asa ao amin'io Tetikasa io",
      });
    } else if (
      assigneeId &&
      !project.members.some((m) => m.userId === assigneeId)
    ) {
      // check if assignee is a member of the project
      return res.status(400).json({
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
        assigneeId,
        due_date: new Date(due_date) || null,
        objective,
        result,
        risk,
        keyFactor,
        keyFactorAcquired: keyFactorAcquired || false,
        progress: getProgressFromStatus(status || "TODO"),
      },
    });

    const taskWithAssignee = await prisma.task.findUnique({
      where: { id: task.id },
      include: { assignee: true },
    });

    // send
    await inngest.send({
      name: "app/task.assigned",
      data: { taskId: task.id, origin },
    });

    // Update project progress
    const projectProgress = await updateProjectProgress(projectId);

    // Respond with the created task
    res.json({
      message: "Asa voaforonina soa aman-tsara",
      task: taskWithAssignee,
      projectProgress,
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
      // check if task exists
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
      return res
        .status(404)
        .json({ message: "Tsy misy na tsy hita io Tekikasa io" });
    } else if (project.team_lead !== userId) {
      // check if user is team lead
      return res.status(403).json({
        message: "Tsy manana alalana ianao hanampy Asa ao amin'io Tetikasa io",
      });
    }

    // Auto-update progress if status is changed
    const updateData = { ...req.body };
    if (updateData.status) {
      updateData.progress = getProgressFromStatus(updateData.status);
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Update project progress
    const projectProgress = await updateProjectProgress(task.projectId);

    // Respond with the updated task
    res.json({
      task: updatedTask,
      message: "Asa voavao voaforina soa aman-tsara",
      projectProgress,
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
      return res
        .status(404)
        .json({ message: "Tsy misy na tsy hita io Tekikasa io" });
    } else if (project.team_lead !== userId) {
      // check if user is team lead
      return res.status(403).json({
        message:
          "Tsy manana alalana ianao hanampy Asa ao amin'io Tetikasa io ianao",
      });
    }

    await prisma.task.deleteMany({
      // delete the tasks
      where: { id: { in: taskIds } },
    });

    // Update project progress after deletion
    const projectProgress = await updateProjectProgress(project.id);

    // Respond with the updated task
    res.json({
      message: "Asa voafafa soa aman-tsara",
      projectProgress,
    });
  } catch (error) {
    // Handle error
    console.error("Error deleting task:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};
