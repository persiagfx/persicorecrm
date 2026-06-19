import prisma from "@/lib/db";
import { triggerWebhook } from "@/lib/webhooks";
import { logger } from "@/lib/logger";

interface TriggerCondition {
  type: string;
  from?: string;
  to?: string;
  formId?: string;
  assigneeId?: string;
}

interface ActionConfig {
  type: string;
  title?: string;
  projectId?: string;
  dueInDays?: number;
  message?: string;
  targetType?: "assignee" | "all_admins" | "specific";
  userId?: string;
  tag?: string;
  field?: string;
  value?: unknown;
  webhookId?: string;
}

function matchesTrigger(trigger: TriggerCondition, event: string, context: Record<string, unknown>): boolean {
  if (trigger.type !== event) return false;

  if (event === "lead_stage_changed") {
    const from = (context.from as string | undefined) ?? undefined;
    const to = (context.to as string | undefined) ?? undefined;
    if (trigger.to && trigger.to !== to) return false;
    if (trigger.from && trigger.from !== from) return false;
    return true;
  }

  if (event === "form_submitted") {
    if (trigger.formId && trigger.formId !== (context.formId as string)) return false;
    return true;
  }

  if (event === "lead_assigned") {
    if (trigger.assigneeId && trigger.assigneeId !== (context.assigneeId as string)) return false;
    return true;
  }

  // invoice_paid, new_lead — no extra conditions
  return true;
}

async function executeAction(
  action: ActionConfig,
  context: Record<string, unknown>,
  tenantId: string
): Promise<void> {
  try {
    switch (action.type) {
      case "create_task": {
        const lead = context.lead as Record<string, unknown> | undefined;
        const projectId = action.projectId ?? (context.projectId as string | undefined);
        if (!projectId) {
          logger.warn("[AutomationEngine] create_task skipped: no projectId");
          break;
        }
        const dueDate = action.dueInDays
          ? new Date(Date.now() + action.dueInDays * 86_400_000)
          : undefined;
        await prisma.task.create({
          data: {
            title: action.title ?? "وظیفه جدید",
            projectId,
            dueDate,
            status: "backlog",
            description: lead
              ? `ایجاد‌شده خودکار برای لید: ${(lead.companyName as string) ?? ""}`
              : "ایجاد‌شده خودکار",
          },
        });
        break;
      }

      case "send_notification": {
        const message = action.message ?? "اعلان خودکار";
        let userIds: string[] = [];

        if (action.targetType === "specific" && action.userId) {
          userIds = [action.userId];
        } else if (action.targetType === "assignee") {
          const lead = context.lead as Record<string, unknown> | undefined;
          const assigneeId = (lead?.assigneeId as string | undefined) ?? (context.assigneeId as string | undefined);
          if (assigneeId) userIds = [assigneeId];
        } else if (action.targetType === "all_admins") {
          const admins = await prisma.user.findMany({
            where: { tenantId, role: "admin" },
            select: { id: true },
          });
          userIds = admins.map((a) => a.id);
        }

        for (const userId of userIds) {
          await prisma.notification.create({
            data: {
              userId,
              type: "automation",
              title: "اعلان خودکار",
              body: message,
            },
          }).catch((err) => logger.error("[automation-engine]", err));
        }
        break;
      }

      case "add_tag": {
        const lead = context.lead as Record<string, unknown> | undefined;
        if (!lead?.id || !action.tag) break;
        const current = await prisma.lead.findUnique({ where: { id: lead.id as string }, select: { tags: true } });
        if (!current) break;
        const tags = Array.isArray(current.tags) ? (current.tags as string[]) : [];
        if (!tags.includes(action.tag)) {
          await prisma.lead.update({
            where: { id: lead.id as string },
            data: { tags: [...tags, action.tag] },
          });
        }
        break;
      }

      case "update_lead_field": {
        const lead = context.lead as Record<string, unknown> | undefined;
        if (!lead?.id || !action.field) break;
        await prisma.lead.update({
          where: { id: lead.id as string },
          data: { [action.field]: action.value },
        });
        break;
      }

      case "trigger_webhook": {
        if (!action.webhookId) break;
        const wh = await prisma.webhook.findUnique({ where: { id: action.webhookId } });
        if (!wh || !wh.isActive) break;
        triggerWebhook(tenantId, "automation.triggered", { context });
        break;
      }

      default:
        logger.warn(`[AutomationEngine] Unknown action type: ${action.type}`);
    }
  } catch (err) {
    logger.error(`[AutomationEngine] Action "${action.type}" failed:`, err);
  }
}

export async function runAutomation(
  event: string,
  context: Record<string, unknown>,
  tenantId: string
): Promise<void> {
  try {
    const rules = await prisma.automationRule.findMany({
      where: { tenantId, isActive: true },
    });

    const matching = rules.filter((rule) => {
      try {
        const trigger = rule.trigger as unknown as TriggerCondition;
        return matchesTrigger(trigger, event, context);
      } catch {
        return false;
      }
    });

    for (const rule of matching) {
      logger.info(`[AutomationEngine] Running rule "${rule.name}" for event "${event}"`);
      const actions = Array.isArray(rule.actions) ? (rule.actions as unknown as ActionConfig[]) : [];

      for (const action of actions) {
        await executeAction(action, context, tenantId);
      }

      await prisma.automationRule.update({
        where: { id: rule.id },
        data: { runCount: { increment: 1 }, lastRunAt: new Date() },
      }).catch((err) => logger.error("[automation-engine]", err));
    }
  } catch (err) {
    logger.error(`[AutomationEngine] runAutomation("${event}") failed:`, err);
  }
}
