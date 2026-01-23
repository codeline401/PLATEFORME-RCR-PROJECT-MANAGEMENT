import nodemailer from "nodemailer";

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// send email
export const sendEmail = async (to, subject, body) => {
  // Send a test email
  const response = await transporter.sendMail({
    from: process.env.SENDER_EMAIL, // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    html: body, // HTML version of the message
    text: body.replace(/<[^>]*>/g, ""), // Strip HTML for text version
  });
  return response; // return the response
};
