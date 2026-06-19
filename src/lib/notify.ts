import prisma from "@/lib/db";
import { sendEventToUser } from "@/lib/sse";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  entityId?: string,
  entityType?: string
) {
  try {
    const notif = await prisma.notification.create({
      data: { userId, type, title, body, entityId, entityType },
    });
    sendEventToUser(userId, { type: "notification", data: notif });
    return notif;
  } catch {
    // notification failure should not crash the main operation
  }
}

export async function notifyAssignee(
  assigneeId: string,
  actorName: string,
  entityType: string,
  entityName: string,
  entityId: string
) {
  const labels: Record<string, string> = {
    lead: "سرنخ",
    task: "تسک",
    ticket: "تیکت",
    project: "پروژه",
  };
  await createNotification(
    assigneeId,
    `${entityType}_assigned`,
    `واگذاری ${labels[entityType] ?? entityType}`,
    `${actorName} "${entityName}" را به شما واگذار کرد`,
    entityId,
    entityType
  );
}
