import prisma from "../configs/prisma.js";

// Add Comments
export const addComment = async (req, res) => {
  try {
    const userId = req.userId; // get userId from auth middleware
    const { content, taskId } = req.body; // get comment details from request body

    if (!content || !taskId) {
      return res
        .status(400)
        .json({ message: "Content and taskId are required" });
    }

    console.log(`💬 Adding comment for task: ${taskId}, user: ${userId}`);

    // Check if user is ProjectMember
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      console.log(`❌ Task not found: ${taskId}`);
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await prisma.project.findUnique({
      // fetch project details
      where: { id: task.projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      // check if project exists
      console.log(`❌ Project not found: ${task.projectId}`);
      return res
        .status(404)
        .json({ message: "Tsy misy na tsy hita io Tekikasa io" });
    }

    const member = project.members.find((m) => m.userId === userId); // check if user is a member of the project

    if (!member) {
      console.log(`❌ User ${userId} is not a member of project ${project.id}`);
      return res.status(403).json({
        message:
          "Tsy mpikambana ao amin'io Tetikasa io ianao ka tsy afaka mandroso hevitra",
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId,
      }, // create the comment
      include: { user: true }, // include user details in the response
    });

    console.log(`✅ Comment created: ${comment.id}`);

    res.json({
      comment,
      message: "Hevitra nasoro ao amin'ny Tetikasa soa aman-tsara",
    });
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    res.status(500).json({
      message: error.code || error.message,
      details: error.toString(),
    });
  }
};

// Get Comments for a Task
export const getCommentsForTask = async (req, res) => {
  try {
    const { taskId } = req.params; // get taskId from request params

    if (!taskId) {
      return res.status(400).json({ message: "TaskId is required" });
    }

    console.log(`📝 Fetching comments for task: ${taskId}`);

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      console.log(`❌ Task not found: ${taskId}`);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`✅ Task found: ${task.id}`);

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: { user: true }, // include user details in the response
      orderBy: { createdAt: "desc" }, // order comments by creation date descending
    });

    console.log(`✅ Comments retrieved: ${comments.length} comments`);
    res.json({ comments }); // respond with the comments
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    res.status(500).json({
      message: error.code || error.message,
      details: error.toString(),
    });
  }
};
