package com.xupay.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xupay.payment.dto.DepositRequest;
import com.xupay.payment.dto.TransactionDetailResponse;
import com.xupay.payment.dto.TransactionListResponse;
import com.xupay.payment.dto.TransferRequest;
import com.xupay.payment.dto.TransferResponse;
import com.xupay.payment.entity.enums.TransactionStatus;
import com.xupay.payment.security.JwtVerifier;
import com.xupay.payment.security.UnauthorizedException;
import com.xupay.payment.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TransactionController.class)
@AutoConfigureMockMvc(addFilters = false)
class TransactionControllerTest {

    private static final String TOKEN = "test-token";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private TransactionService transactionService;
    @MockBean private JwtVerifier jwtVerifier;

    /** The user the test token belongs to. */
    private UUID caller;

    @BeforeEach
    void authenticate() {
        caller = UUID.randomUUID();
        when(jwtVerifier.verify(TOKEN)).thenReturn(caller);
    }

    private static MockHttpServletRequestBuilder authed(MockHttpServletRequestBuilder request) {
        return request.header("Authorization", "Bearer " + TOKEN);
    }

    private MockHttpServletRequestBuilder postJson(String url, Object body) throws Exception {
        return authed(post(url))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
    }

    // ------------------------------------------------------------ happy paths

    @Test
    @DisplayName("POST /api/payments/transfer - Should create transaction when completed")
    void processTransfer_returnsCreated_whenCompleted() throws Exception {
        UUID idempotency = UUID.randomUUID();
        UUID toUser = UUID.randomUUID();

        TransferRequest req = new TransferRequest(idempotency, caller, toUser, 10000L, "Test", "127.0.0.1", "UA");

        TransferResponse resp = TransferResponse.builder()
            .transactionId(UUID.randomUUID())
            .idempotencyKey(idempotency)
            .fromUserId(caller)
            .toUserId(toUser)
            .amountCents(10000L)
            .amount(BigDecimal.valueOf(100.00))
            .currency("VND")
            .status(TransactionStatus.COMPLETED)
            .build();

        when(transactionService.processTransfer(any(TransferRequest.class))).thenReturn(resp);

        mockMvc.perform(postJson("/api/payments/transfer", req))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("COMPLETED"))
            .andExpect(jsonPath("$.idempotencyKey").value(idempotency.toString()));
    }

    @Test
    @DisplayName("POST /api/payments/transfer - Should return OK when processing")
    void processTransfer_returnsOk_whenProcessing() throws Exception {
        UUID idempotency = UUID.randomUUID();
        UUID toUser = UUID.randomUUID();

        TransferRequest req = new TransferRequest(idempotency, caller, toUser, 5000L, "Test", null, null);

        TransferResponse resp = TransferResponse.builder()
            .transactionId(UUID.randomUUID())
            .idempotencyKey(idempotency)
            .fromUserId(caller)
            .toUserId(toUser)
            .amountCents(5000L)
            .status(TransactionStatus.PROCESSING)
            .build();

        when(transactionService.processTransfer(any(TransferRequest.class))).thenReturn(resp);

        mockMvc.perform(postJson("/api/payments/transfer", req))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PROCESSING"));
    }

    @Test
    @DisplayName("GET /api/payments/{transactionId} - Should return details to a party")
    void getTransactionDetail_returnsOk_whenFound() throws Exception {
        UUID txId = UUID.randomUUID();

        TransactionDetailResponse detail = TransactionDetailResponse.builder()
            .transactionId(txId)
            .type("TRANSFER")
            .status("COMPLETED")
            .amountCents(10000L)
            .currency("VND")
            .description("Test")
            .fromUserId(caller)
            .toUserId(UUID.randomUUID())
            .createdAt(LocalDateTime.now())
            .build();

        when(transactionService.getTransactionDetail(eq(txId))).thenReturn(detail);

        mockMvc.perform(authed(get("/api/payments/" + txId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.transactionId").value(txId.toString()))
            .andExpect(jsonPath("$.amountCents").value(10000));
    }

    @Test
    @DisplayName("GET /api/payments/idempotency/{key} - Should return 404 when missing")
    void getByIdempotency_returnsNotFound_whenMissing() throws Exception {
        UUID key = UUID.randomUUID();
        when(transactionService.getTransactionByIdempotencyKey(key)).thenReturn(null);

        mockMvc.perform(authed(get("/api/payments/idempotency/" + key)))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/payments/idempotency/{key} - Should return the caller's transaction")
    void getByIdempotency_returnsOk_whenExists() throws Exception {
        UUID key = UUID.randomUUID();
        TransferResponse resp = TransferResponse.builder()
            .transactionId(UUID.randomUUID())
            .idempotencyKey(key)
            .toUserId(caller)
            .status(TransactionStatus.COMPLETED)
            .amountCents(2000L)
            .build();

        when(transactionService.getTransactionByIdempotencyKey(key)).thenReturn(resp);

        mockMvc.perform(authed(get("/api/payments/idempotency/" + key)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.idempotencyKey").value(key.toString()));
    }

    @Test
    @DisplayName("GET /api/payments without userId - Lists the caller's own transactions")
    void listTransactions_defaultsToCaller() throws Exception {
        when(transactionService.listTransactions(eq(caller), anyInt(), anyInt()))
            .thenReturn(TransactionListResponse.builder().items(List.of()).total(0L).page(0).size(20).build());

        mockMvc.perform(authed(get("/api/payments")))
            .andExpect(status().isOk());

        verify(transactionService).listTransactions(eq(caller), anyInt(), anyInt());
    }

    // ---------------------------------------------------------- authentication

    @Test
    @DisplayName("No bearer token - 401, service never reached")
    void deposit_withoutToken_isUnauthorized() throws Exception {
        DepositRequest req = new DepositRequest(UUID.randomUUID(), caller, 100L, "x", null, null);

        mockMvc.perform(post("/api/payments/deposit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isUnauthorized());

        verify(transactionService, never()).processDeposit(any());
    }

    @Test
    @DisplayName("Forged or expired token - 401")
    void list_withBadToken_isUnauthorized() throws Exception {
        when(jwtVerifier.verify(anyString())).thenThrow(new UnauthorizedException("Invalid or expired token"));

        mockMvc.perform(get("/api/payments").header("Authorization", "Bearer forged"))
            .andExpect(status().isUnauthorized());
    }

    // ----------------------------------------------------------- authorisation

    @Test
    @DisplayName("Transfer FROM another user's wallet - 403")
    void transfer_fromSomeoneElse_isForbidden() throws Exception {
        TransferRequest req = new TransferRequest(UUID.randomUUID(), UUID.randomUUID(), caller, 5000L, "steal", null, null);

        mockMvc.perform(postJson("/api/payments/transfer", req))
            .andExpect(status().isForbidden());

        verify(transactionService, never()).processTransfer(any());
    }

    @Test
    @DisplayName("Deposit into another user's wallet - 403")
    void deposit_forSomeoneElse_isForbidden() throws Exception {
        DepositRequest req = new DepositRequest(UUID.randomUUID(), UUID.randomUUID(), 100L, null, null, null);

        mockMvc.perform(postJson("/api/payments/deposit", req))
            .andExpect(status().isForbidden());

        verify(transactionService, never()).processDeposit(any());
    }

    @Test
    @DisplayName("Listing another user's history - 403")
    void listTransactions_ofSomeoneElse_isForbidden() throws Exception {
        mockMvc.perform(authed(get("/api/payments").param("userId", UUID.randomUUID().toString())))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Reading a transaction the caller is not a party to - 403")
    void getTransactionDetail_ofStrangers_isForbidden() throws Exception {
        UUID txId = UUID.randomUUID();
        when(transactionService.getTransactionDetail(eq(txId))).thenReturn(TransactionDetailResponse.builder()
            .transactionId(txId)
            .fromUserId(UUID.randomUUID())
            .toUserId(UUID.randomUUID())
            .build());

        mockMvc.perform(authed(get("/api/payments/" + txId)))
            .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------- error mapping

    @Test
    @DisplayName("Transfer blocked by a fraud rule - 422 with the reason, not a 500")
    void transfer_blockedByFraud_isUnprocessable() throws Exception {
        TransferRequest req = new TransferRequest(UUID.randomUUID(), caller, UUID.randomUUID(), 5000L, null, null, null);
        when(transactionService.processTransfer(any(TransferRequest.class)))
            .thenThrow(new SecurityException("Transaction blocked due to fraud risk: Velocity Block"));

        mockMvc.perform(postJson("/api/payments/transfer", req))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.message").value("Transaction blocked due to fraud risk: Velocity Block"));
    }

    @Test
    @DisplayName("Non-UUID path variable - 400, not a 500")
    void getTransactionDetail_withBadId_isBadRequest() throws Exception {
        mockMvc.perform(authed(get("/api/payments/not-a-uuid")))
            .andExpect(status().isBadRequest());
    }
}
