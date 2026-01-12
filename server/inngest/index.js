import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

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
  }
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
  }
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
  }
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
  }
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
  }
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
  }
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
  }
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
];
