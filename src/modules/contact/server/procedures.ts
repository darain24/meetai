import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const contactRouter = createTRPCRouter({
  sendMessage: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        subject: z.string().min(1, "Subject is required"),
        message: z.string().min(1, "Message is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Email configuration
        const recipientEmail = "darainqamar10@gmail.com";
        const fromEmail = process.env.FROM_EMAIL || "noreply@collabspace.com";
        const fromName = process.env.FROM_NAME || "CollabSpace Contact Form";

        // Prepare email content
        const emailSubject = `Contact Form: ${input.subject}`;
        const emailBody = `
New contact form submission from CollabSpace

Name: ${input.name}
Email: ${input.email}
Subject: ${input.subject}

Message:
${input.message}

---
This message was sent from the CollabSpace contact form.
User ID: ${ctx.auth.user.id}
        `.trim();

        // Try to send email using Resend if available
        if (process.env.RESEND_API_KEY) {
          try {
            const { Resend } = await import("resend");
            const resendClient = new Resend(process.env.RESEND_API_KEY);
            
            const { data, error } = await resendClient.emails.send({
              from: fromEmail.includes('@') ? fromEmail : `${fromName} <${fromEmail}>`,
              to: recipientEmail,
              replyTo: input.email,
              subject: emailSubject,
              text: emailBody,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">New Contact Form Submission</h2>
                  <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${input.name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${input.email}">${input.email}</a></p>
                    <p><strong>Subject:</strong> ${input.subject}</p>
                  </div>
                  <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h3 style="color: #333; margin-top: 0;">Message:</h3>
                    <p style="white-space: pre-wrap; line-height: 1.6;">${input.message.replace(/\n/g, '<br>')}</p>
                  </div>
                  <p style="color: #666; font-size: 12px; margin-top: 20px;">
                    This message was sent from the CollabSpace contact form.<br>
                    User ID: ${ctx.auth.user.id}
                  </p>
                </div>
              `,
            });

            if (error) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to send email: ${error.message}`,
              });
            }

            return { success: true, messageId: data?.id };
          } catch {
            // Fall through to other methods
          }
        }

        // Fallback: Use Nodemailer if RESEND_API_KEY is not available
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          const nodemailer = await import("nodemailer").catch(() => null);
          if (nodemailer?.default) {
            const transporter = nodemailer.default.createTransport({
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT || "587"),
              secure: process.env.SMTP_PORT === "465",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            });

            const info = await transporter.sendMail({
              from: `${fromName} <${fromEmail}>`,
              to: recipientEmail,
              replyTo: input.email,
              subject: emailSubject,
              text: emailBody,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">New Contact Form Submission</h2>
                  <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${input.name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${input.email}">${input.email}</a></p>
                    <p><strong>Subject:</strong> ${input.subject}</p>
                  </div>
                  <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h3 style="color: #333; margin-top: 0;">Message:</h3>
                    <p style="white-space: pre-wrap; line-height: 1.6;">${input.message.replace(/\n/g, '<br>')}</p>
                  </div>
                  <p style="color: #666; font-size: 12px; margin-top: 20px;">
                    This message was sent from the CollabSpace contact form.<br>
                    User ID: ${ctx.auth.user.id}
                  </p>
                </div>
              `,
            });

            return { success: true, messageId: info.messageId };
          }
        }

        // If no email service is configured, log the message (for development)
        if (process.env.NODE_ENV === 'development') {
          console.log("Contact form submission (email not configured):", {
            to: recipientEmail,
            subject: emailSubject,
            body: emailBody,
          });
          return { success: true, messageId: "dev-mode" };
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Email service is not configured. Please set up RESEND_API_KEY or SMTP credentials.",
        });
      } catch (error: unknown) {
        if (error instanceof TRPCError) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send email: ${errorMessage}`,
        });
      }
    }),
});

