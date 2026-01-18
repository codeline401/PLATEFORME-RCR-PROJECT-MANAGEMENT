import prisma from "../configs/prisma.js";

// create project
export const createProject = async (req, res) => {
  // Logic to create a project
  try {
    const { userId } = await req.auth; // get userId from auth middleware

    const {
      worksapceId,
      description,
      name,
      status,
      start_date,
      end_date,
      team_members,
      team_lead,
      progress,
      priority,
    } = req.body; // get project details from request body

    // Check is user has admin role for workspace
    const workspace = await prisma.worksapce.findUnique({
      where: { id: worksapceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      // workspace not found
      return res
        .status(404)
        .json({ message: "Tsy hita na Tsy misy io tranon'Asa io" });
    }

    if (
      !workspace.members.some(
        (member) => member.userId === userId && member.role === "admin"
      )
    ) {
      // user is not admin
      return res.status(403).json({
        message:
          "Tsy Mety: Tsy afaka mamorona tetikasa ao amin'ity tranon'asa ity ianao. Ny Mpandrindra no mahazo manao izany.",
      });
    }

    // Get team lead  using email
    const teamLeadUser = await prisma.user.findUnique({
      where: { email: team_lead },
      select: { id: true },
    });

    const project = await prisma.project.create({
      data: {
        worksapceId,
        name,
        description,
        status,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        progress,
        priority,
        team_leadId: teamLeadUser ? teamLeadUser.id : null,
      },
    });

    // Add member to project if they are in the workspace
    if (team_members.length > 0) {
      /// check if team_members is not empty
      const memberToAdd = []; // array to hold members to add
      workspace.members.array.forEach((member) => {
        // loop through workspace members
        if (team_members.includes(member.user.email)) {
          // check if member email is in team_members
          memberToAdd.push(member.user.id); // add member to array
        }
      });
    }

    await prisma.projectMember.createMany({
      data: memberToAdd.map((memberId) => ({
        projectId: project.id,
        userId: memberId,
      })),
    });

    // Fetch the created project with members and tasks
    const projectWithMembers = await prisma.project.findUnique({
      // fetch the created project
      where: { id: project.id }, // by project id
      include: {
        // include members and tasks
        members: { include: { user: true } }, // include user details for members
        tasks: {
          // include tasks
          include: {
            // include assignee and comments for tasks
            assignee: true, // include assignee details
            comments: {
              include: { user: true },
            },
          },
        },
        owner: true, // include project owner details
      },
    });

    res.json({
      project: projectWithMembers,
      message: "Tetikasa voaforina soa aman-tsara",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// update project
export const updateProject = async (req, res) => {
  // Logic to update a project
  try {
    const { userId } = await req.auth; // get userId from auth middleware

    const {
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      progress,
      priority,
      team_lead,
    } = req.body; // get project details from request body

    // Check if user has admin role for workspace
    const workspace = await prisma.worksapce.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    // workspace not found
    if (!workspace) {
      return res
        .status(404)
        .json({ message: "Tsy hita na Tsy misy io tranon'Asa io" });
    }

    if (
      !workspace.members.some(
        (member) => member.userId === userId && member.role === "admin"
      )
    ) {
      const project = await prisma.project.findUnique({
        where: { id },
      });
      if (!project) {
        return res
          .status(404)
          .json({ message: "Tsy hita na Tsy misy io tetikasa io" });
      } else if (project.team_leadId !== userId) {
        return res.status(403).json({
          message:
            "Tsy Mety: Tsy manana alalana manova ity tetikasa ity ianao.",
        });
      }
    }

    // proceed to update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        status,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        progress,
        priority,
      },
    });

    //
    res.json({ project, message: "Tetikasa voavao soa aman-tsara" });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Add member to project
export const addMemberToProject = async (req, res) => {
  try {
    // Logic to add member to a project
    const { userId } = await req.auth; // get userId from auth middleware
    const { projectId } = req.params; // get projectId from request params
    const { memberEmail } = req.body; // get member email from request body

    // Check if user is project team lead
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    // project not found
    if (!project) {
      return res
        .status(404)
        .json({ message: "Tsy hita na Tsy misy io tetikasa io" });
    }

    if (project.team_lead !== userId) {
      return res.status(403).json({
        message:
          "Tsy Mety: Ny Mpandindra ny tentikasa ihany no afaka manampy mpikambana vaovao.",
      });
    }

    //Check if member to add exists
    const existingMember = await prisma.members.find(
      (member) => member.user.email === memberEmail
    );

    if (existingMember) {
      return res.status(400).json({
        message: "Efa mpikamabana ao anaty Tetikasa io kasainao ampidirina io",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: memberEmail },
    });

    if (!user) {
      return res.status(404).json({
        message: "Tsy hita na Tsy misy io mpikambana io kasainao ampidirina io",
      });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
      },
    });

    res.json({
      member,
      message: "Mpikambana tafiditra soa aman-tsaraao anaty tetikasa",
    });
  } catch (error) {
    console.error("Error adding member to project:", error);
    res.status(500).json({ message: error.code || error.message });
  }
};
