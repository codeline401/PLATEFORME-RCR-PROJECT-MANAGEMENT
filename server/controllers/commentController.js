// Add Comments
export const addComment = async (req, res) => {
  try {
    const { userId } = await req.auth; // get userId from auth middleware
    const { content, taskId } = req.body; // get comment details from request body

    // Check if user is ProjectMember
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    const project = await prisma.project.findUnique({
      // fetch project details
      where: { id: task.projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project) {
      // check if project exists
      res.status(404).json({ message: "Tsy misy na tsy hita io Tekikasa io" });
    }

    const member = project.members.find((m) => m.userId === userId); // check if user is a member of the project

    if (!member) {
      res.status(403).json({
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

    res.json({
      comment,
      message: "Hevitra nasoro ao amin'ny Tetikasa soa aman-tsara",
    });
  } catch (error) {
    console.error("Nisy olana teo amin'ny famoronana ny hevitra :", error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Get Comments for a Task
export const getCommentsForTask = async (req, res) => {
  try {
    const { taskId } = req.params; // get taskId from request params
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: { user: true }, // include user details in the response
      orderBy: { createdAt: "desc" }, // order comments by creation date descending
    });

    res.json({ comments }); // respond with the comments
  } catch (error) {
    console.error("Nisy olana teo amin'ny fakana ny hevitra rehetra:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};
