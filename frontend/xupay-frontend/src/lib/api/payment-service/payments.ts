import { paymentServiceClient } from "../client-factory";

export type TransactionStatus = "PROCESSING" | "COMPLETED" | "FAILED" | "BLOCKED" | "REVIEW";

export interface TransferRequest {
  idempotencyKey: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  description?: string;
}

export interface DepositRequest {
  idempotencyKey: string;
  userId: string;
  amountCents: number;
  description?: string;
}

export interface WithdrawRequest {
  idempotencyKey: string;
  userId: string;
  amountCents: number;
  description?: string;
}

export interface TransferResponse {
  transactionId: string;
  idempotencyKey?: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  amount?: number;
  currency?: string;
  status: TransactionStatus;
  createdAt?: string;
}

export interface TransactionDetailResponse {
  transactionId: string;
  type: string;
  status: TransactionStatus;
  amountCents: number;
  currency: string;
  description?: string;
  createdAt?: string;
}

export interface ListTransactionsParams {
  userId?: string;
  page?: number;
  size?: number;
}

export interface PagedTransactions {
  items: TransactionDetailResponse[];
  total?: number;
}

function withIdempotencyHeader(idempotencyKey: string) {
  return { headers: { "X-Idempotency-Key": idempotencyKey } };
}

export async function transfer(payload: TransferRequest): Promise<TransferResponse> {
  const { data } = await paymentServiceClient.post<TransferResponse>(
    "/api/payments/transfer",
    payload,
    withIdempotencyHeader(payload.idempotencyKey)
  );
  return data;
}

export async function deposit(payload: DepositRequest): Promise<TransferResponse> {
  const { data } = await paymentServiceClient.post<TransferResponse>(
    "/api/payments/deposit",
    payload,
    withIdempotencyHeader(payload.idempotencyKey)
  );
  return data;
}

export async function withdraw(payload: WithdrawRequest): Promise<TransferResponse> {
  const { data } = await paymentServiceClient.post<TransferResponse>(
    "/api/payments/withdraw",
    payload,
    withIdempotencyHeader(payload.idempotencyKey)
  );
  return data;
}

export async function getTransaction(transactionId: string): Promise<TransactionDetailResponse> {
  const { data } = await paymentServiceClient.get<TransactionDetailResponse>(
    `/api/payments/${transactionId}`
  );
  return data;
}

export async function listTransactions(
  params: ListTransactionsParams = {}
): Promise<PagedTransactions> {
  const { data } = await paymentServiceClient.get<PagedTransactions>("/api/payments", { params });
  return data;
}
