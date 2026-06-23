import crypto from "node:crypto";
import { env } from "@/lib/env";

export function verifyRazorpaySignature(rawBody: string, signature: string | null) {
  if (!env.razorpayWebhookSecret || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", env.razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
