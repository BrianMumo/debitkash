// ─── M-Pesa API Types ───────────────────────────────────────────

export interface MpesaTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface B2CRequestPayload {
  InitiatorName: string;
  SecurityCredential: string;
  CommandID: "SalaryPayment" | "BusinessPayment" | "PromotionPayment";
  Amount: number;
  PartyA: string;
  PartyB: string;
  Remarks: string;
  QueueTimeOutURL: string;
  ResultURL: string;
  Occassion: string;
}

export interface B2CApiResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface B2CCallbackResult {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{
        Key: string;
        Value: string | number;
      }>;
    };
  };
}

export interface BalanceRequestPayload {
  Initiator: string;
  SecurityCredential: string;
  CommandID: "AccountBalance";
  PartyA: string;
  IdentifierType: "4";
  Remarks: string;
  QueueTimeOutURL: string;
  ResultURL: string;
}

export interface BalanceCallbackResult {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{
        Key: string;
        Value: string | number;
      }>;
    };
  };
}

// ─── Frontend Types ─────────────────────────────────────────────

export interface PaymentFormData {
  phoneNumber: string;
  amount: number;
  commandId: "SalaryPayment" | "BusinessPayment" | "PromotionPayment";
  remarks: string;
  occasion: string;
}

export interface BalanceData {
  utilityAccountBalance: number | null;
  workingAccountBalance: number | null;
  chargesAccountBalance: number | null;
  lastUpdated: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED" | "TIMED_OUT";
}

export interface TransactionListItem {
  id: string;
  createdAt: string;
  amount: string;
  partyB: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "TIMED_OUT";
  commandId: string;
  remarks: string | null;
  mpesaTransactionId: string | null;
  recipientName: string | null;
}

export interface TransactionFilters {
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}
