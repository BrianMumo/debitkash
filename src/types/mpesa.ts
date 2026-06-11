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

// ─── Transaction Reversal ───────────────────────────────────────

export interface ReversalRequestPayload {
  Initiator: string;
  SecurityCredential: string;
  CommandID: "TransactionReversal";
  TransactionID: string; // the original M-Pesa receipt to reverse
  Amount: number;
  ReceiverParty: string; // shortcode that receives the reversed funds
  RecieverIdentifierType: "11"; // 11 = organization shortcode (spelling per Safaricom spec)
  ResultURL: string;
  QueueTimeOutURL: string;
  Remarks: string;
  Occasion: string;
}

export interface ReversalApiResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface ReversalCallbackResult {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{ Key: string; Value: string | number }>;
    };
  };
}

export type ReversalStatus = "NONE" | "PENDING" | "SUCCESS" | "FAILED" | "TIMED_OUT";

// ─── C2B (incoming deposits) ────────────────────────────────────

// Payload Safaricom POSTs to the confirmation/validation URL.
export interface C2BConfirmationPayload {
  TransactionType: string;
  TransID: string;
  TransTime: string; // yyyyMMddHHmmss
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string;
  InvoiceNumber: string;
  OrgAccountBalance: string;
  ThirdPartyTransID: string;
  MSISDN: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
}

export interface C2BRegisterPayload {
  ShortCode: string;
  ResponseType: "Completed" | "Cancelled";
  ConfirmationURL: string;
  ValidationURL: string;
}

export interface DepositListItem {
  id: string;
  createdAt: string;
  transId: string;
  amount: string;
  msisdn: string | null;
  payerName: string | null;
  billRefNumber: string | null;
  transactionType: string | null;
  transTime: string | null;
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
  reversalStatus: ReversalStatus;
}

export interface TransactionFilters {
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}
