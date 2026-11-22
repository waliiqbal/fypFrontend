import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentReturn } from "@/modules/patient/components/payment-return";

export const metadata: Metadata = { title: "Payment status | Askare" };

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center" role="status">Loading payment details...</p>}>
      <PaymentReturn />
    </Suspense>
  );
}