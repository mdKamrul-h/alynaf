import type { FbConversation, Order } from "./types";

export interface Escalation {
  type: "order" | "conversation";
  id: string;
  reason: string;
  urgency: "high" | "medium";
  ageHours: number;
  label: string;
}

function hoursAgo(isoString: string): number {
  return (Date.now() - new Date(isoString).getTime()) / 3_600_000;
}

export function computeEscalations(
  orders: Order[],
  conversations: FbConversation[]
): Escalation[] {
  const result: Escalation[] = [];

  for (const order of orders) {
    const age = hoursAgo(order.updatedAt);

    if (order.status === "pending" && age > 48) {
      result.push({
        type: "order",
        id: order.orderNumber,
        reason: "No quote sent in over 48 hours",
        urgency: "high",
        ageHours: age,
        label: order.customerName,
      });
    } else if (order.status === "quoted" && age > 72) {
      result.push({
        type: "order",
        id: order.orderNumber,
        reason: "Quote sent but no response in 72 hours",
        urgency: "medium",
        ageHours: age,
        label: order.customerName,
      });
    } else if (
      (order.status === "confirmed" || order.status === "purchased") &&
      age > 168
    ) {
      result.push({
        type: "order",
        id: order.orderNumber,
        reason: `Order ${order.status} but not progressing for 7+ days`,
        urgency: "medium",
        ageHours: age,
        label: order.customerName,
      });
    }
  }

  for (const conv of conversations) {
    if (
      conv.isLikelyOrder &&
      !conv.linkedOrderNumber &&
      hoursAgo(conv.lastMessageAt) > 24
    ) {
      result.push({
        type: "conversation",
        id: conv.id,
        reason: "Likely order message unanswered for 24+ hours",
        urgency: "high",
        ageHours: hoursAgo(conv.lastMessageAt),
        label: conv.customerName,
      });
    }
  }

  // Sort: high urgency first, then oldest
  return result.sort((a, b) => {
    if (a.urgency !== b.urgency) return a.urgency === "high" ? -1 : 1;
    return b.ageHours - a.ageHours;
  });
}
