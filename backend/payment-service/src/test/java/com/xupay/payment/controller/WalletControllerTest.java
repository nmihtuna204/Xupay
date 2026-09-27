package com.xupay.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xupay.payment.dto.CreateWalletRequest;
import com.xupay.payment.dto.CreateWalletResponse;
import com.xupay.payment.dto.FreezeWalletRequest;
import com.xupay.payment.dto.WalletBalanceResponse;
import com.xupay.payment.entity.enums.WalletType;
import com.xupay.payment.security.JwtVerifier;
import com.xupay.payment.service.WalletService;
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
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WalletController.class)
@AutoConfigureMockMvc(addFilters = false)
class WalletControllerTest {

    private static final String TOKEN = "test-token";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private WalletService walletService;
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

    private static WalletBalanceResponse walletOf(UUID walletId, UUID ownerId, long balanceCents) {
        return WalletBalanceResponse.builder()
            .walletId(walletId)
            .userId(ownerId)
            .balanceCents(balanceCents)
            .balanceAmount(BigDecimal.valueOf(balanceCents, 2))
            .currency("VND")
            .isActive(true)
            .isFrozen(false)
            .build();
    }

    @Test
    @DisplayName("POST /api/wallets - Should create the caller's wallet")
    void createWallet_returnsCreated_withValidRequest() throws Exception {
        CreateWalletRequest req = new CreateWalletRequest(caller, WalletType.PERSONAL, "VND");

        CreateWalletResponse resp = CreateWalletResponse.builder()
            .walletId(UUID.randomUUID())
            .userId(caller)
            .glAccountCode("GL-100")
            .walletType(WalletType.PERSONAL)
            .currency("VND")
            .balanceCents(0L)
            .isActive(true)
            .createdAt(LocalDateTime.now())
            .build();

        when(walletService.createWallet(any(CreateWalletRequest.class))).thenReturn(resp);

        mockMvc.perform(authed(post("/api/wallets"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.walletId").exists())
            .andExpect(jsonPath("$.userId").value(caller.toString()));
    }

    @Test
    @DisplayName("GET /api/wallets/user/{userId} - Should return the caller's wallet")
    void getWalletByUserId_returnsOk() throws Exception {
        when(walletService.getWalletByUserId(eq(caller))).thenReturn(walletOf(UUID.randomUUID(), caller, 500000L));

        mockMvc.perform(authed(get("/api/wallets/user/" + caller)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.balanceCents").value(500000));
    }

    @Test
    @DisplayName("GET /api/wallets/{walletId}/balance - Should return the caller's balance")
    void getWalletBalance_returnsOk() throws Exception {
        UUID walletId = UUID.randomUUID();
        when(walletService.getWalletBalance(eq(walletId))).thenReturn(walletOf(walletId, caller, 250000L));

        mockMvc.perform(authed(get("/api/wallets/" + walletId + "/balance")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.balanceCents").value(250000));
    }

    @Test
    @DisplayName("PUT /api/wallets/{walletId}/freeze - Should freeze the caller's wallet")
    void freezeWallet_returnsOk() throws Exception {
        UUID walletId = UUID.randomUUID();
        when(walletService.getWalletBalance(eq(walletId))).thenReturn(walletOf(walletId, caller, 0L));
        doNothing().when(walletService).freezeWallet(eq(walletId), any(FreezeWalletRequest.class));

        mockMvc.perform(authed(put("/api/wallets/" + walletId + "/freeze"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new FreezeWalletRequest(true, "Lost my phone"))))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Unfreeze with no reason (what the app sends) - 200, used to be a 400")
    void unfreezeWallet_withoutReason_returnsOk() throws Exception {
        UUID walletId = UUID.randomUUID();
        when(walletService.getWalletBalance(eq(walletId))).thenReturn(walletOf(walletId, caller, 0L));

        mockMvc.perform(authed(put("/api/wallets/" + walletId + "/freeze"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"freeze\":false}"))
            .andExpect(status().isOk());

        verify(walletService).freezeWallet(eq(walletId), any(FreezeWalletRequest.class));
    }

    @Test
    @DisplayName("No bearer token - 401")
    void getWallet_withoutToken_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/wallets/user/" + caller))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Reading another user's wallet - 403")
    void getWalletByUserId_ofSomeoneElse_isForbidden() throws Exception {
        mockMvc.perform(authed(get("/api/wallets/user/" + UUID.randomUUID())))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Freezing another user's wallet - 403, nothing changed")
    void freezeWallet_ofSomeoneElse_isForbidden() throws Exception {
        UUID walletId = UUID.randomUUID();
        when(walletService.getWalletBalance(eq(walletId))).thenReturn(walletOf(walletId, UUID.randomUUID(), 0L));

        mockMvc.perform(authed(put("/api/wallets/" + walletId + "/freeze"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"freeze\":true}"))
            .andExpect(status().isForbidden());

        verify(walletService, never()).freezeWallet(any(), any());
    }
}
