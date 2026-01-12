import { Inngest } from "inngest";
import prisma from "../configs/prisma";

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
        imageUrl: data.profile_image_url || null,
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
        imageUrl: data.profile_image_url || null,
      },
    });
  }
);

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];
