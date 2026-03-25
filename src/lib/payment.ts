import { supabase } from "@/integrations/supabase/client";

function generateIdempotencyKey(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

async function callPayment(action: string, params: Record<string, any> = {}, useIdempotency = true) {
  const headers: Record<string, string> = {};
  if (useIdempotency) {
    headers["x-idempotency-key"] = generateIdempotencyKey();
  }

  const { data, error } = await supabase.functions.invoke("process-payment", {
    body: { action, ...params },
    headers,
  });

  if (error) throw new Error(error.message || "Payment request failed");
  if (data?.error) throw new Error(data.error);
  return data;
}

export const PaymentService = {
  /** Buyer places a new order with escrow */
  placeOrder: (params: {
    website_id: string;
    title: string;
    description?: string;
    target_url?: string;
    anchor_text?: string;
  }) => callPayment("place_order", params),

  /** Publisher accepts a pending order */
  acceptOrder: (order_id: string) => callPayment("accept_order", { order_id }),

  /** Publisher delivers order with proof */
  deliverOrder: (order_id: string, proof_url?: string, article_content?: string) =>
    callPayment("deliver_order", { order_id, proof_url, article_content }),

  /** Buyer approves delivery → releases escrow */
  completeOrder: (order_id: string) => callPayment("complete_order", { order_id }),

  /** Buyer requests revision on delivered order */
  requestRevision: (order_id: string, reason?: string) =>
    callPayment("request_revision", { order_id, reason }),

  /** Buyer or publisher cancels a pending order */
  cancelOrder: (order_id: string) => callPayment("cancel_order", { order_id }),

  /** Either party files a dispute */
  disputeOrder: (order_id: string, reason: string) =>
    callPayment("dispute_order", { order_id, reason }),

  /** Admin resolves a dispute */
  resolveDispute: (dispute_id: string, resolution_type: "refund_buyer" | "release_publisher", resolution?: string) =>
    callPayment("resolve_dispute", { dispute_id, resolution_type, resolution }),

  /** Admin approves a payout */
  approvePayout: (payout_id: string) => callPayment("approve_payout", { payout_id }),

  /** Admin rejects a payout */
  rejectPayout: (payout_id: string, notes?: string) =>
    callPayment("reject_payout", { payout_id, notes }),

  /** Admin triggers auto-approval of expired deliveries */
  autoApproveExpired: () => callPayment("auto_approve_expired"),

  /** Admin runs reconciliation check */
  runReconciliation: () => callPayment("run_reconciliation"),
};
