import { db, notification, user, eq } from "@shared-db";
import { sendEmail } from "./email";

type NotificationType = 'share_file' | 'share_folder' | 'download' | 'system';

interface CreateNotificationParams {
    userId: string; // Recipient
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    // Email specific
    sendEmailNotification?: boolean;
    emailSubject?: string; // If not provided, title is used
    emailHtml?: string; // If not provided, simple message is used
}

export async function createNotification(params: CreateNotificationParams) {
    try {
        // 1. Create DB Notification
        await db.insert(notification).values({
            userId: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            link: params.link,
            isRead: false,
        });

        // 2. Send Email if requested
        if (params.sendEmailNotification) {
            // Fetch user email
            const recipient = await db.query.user.findFirst({
                where: eq(user.id, params.userId),
                columns: { email: true, name: true }
            });

            if (recipient?.email) {
                await sendEmail({
                    to: recipient.email,
                    subject: params.emailSubject || `[Sedia Arcive] ${params.title}`,
                    html: params.emailHtml || `
                        <div style="font-family: sans-serif; padding: 20px;">
                            <h2>Hello ${recipient.name},</h2>
                            <p>${params.message}</p>
                            ${params.link ? `<a href="${process.env.PUBLIC_APP_URL || ''}${params.link}" style="display: inline-block; padding: 10px 20px; background: #0284c7; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View</a>` : ''}
                        </div>
                    `,
                });
            }
        }
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
}
