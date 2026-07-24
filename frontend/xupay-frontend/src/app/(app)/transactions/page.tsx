import { Suspense } from "react";
import { TransactionsClient } from "./TransactionsClient";

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsClient />
    </Suspense>
  );
}
