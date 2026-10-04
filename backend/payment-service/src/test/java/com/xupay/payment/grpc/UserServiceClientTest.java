package com.xupay.payment.grpc;

import com.xupay.payment.exception.ServiceUnavailableException;
import com.xupay.user.grpc.RecordTransactionRequest;
import com.xupay.user.grpc.RecordTransactionResponse;
import com.xupay.user.grpc.UserServiceGrpc;
import com.xupay.user.grpc.ValidateUserResponse;
import io.grpc.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * How User Service answers reach the REST layer: request errors are 400s,
 * an unreachable or slow User Service is a 503, and no call waits forever.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceClientTest {

    @Mock
    private UserServiceGrpc.UserServiceBlockingStub stub;

    private UserServiceClient client;

    @BeforeEach
    void setUp() {
        client = new UserServiceClient();
        ReflectionTestUtils.setField(client, "userServiceStub", stub);
        lenient().when(stub.withDeadlineAfter(anyLong(), any(TimeUnit.class))).thenReturn(stub);
    }

    @Test
    @DisplayName("Every call carries a deadline")
    void callsHaveADeadline() {
        when(stub.validateUser(any())).thenReturn(ValidateUserResponse.newBuilder().setIsValid(true).build());

        client.validateUser(UUID.randomUUID(), 1_000L, "send");

        verify(stub).withDeadlineAfter(5, TimeUnit.SECONDS);
    }

    @Test
    @DisplayName("An unknown user is a client error (400), not a 500")
    void unknownUser_isIllegalArgument() {
        when(stub.validateUser(any()))
                .thenThrow(Status.NOT_FOUND.withDescription("User not found: x").asRuntimeException());

        assertThatThrownBy(() -> client.validateUser(UUID.randomUUID(), 1_000L, "receive"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");
    }

    @Test
    @DisplayName("A failed validation keeps its reason")
    void invalidUser_isIllegalArgumentWithReason() {
        when(stub.validateUser(any())).thenReturn(ValidateUserResponse.newBuilder()
                .setIsValid(false)
                .setReason("Would exceed the daily send limit")
                .build());

        assertThatThrownBy(() -> client.validateUser(UUID.randomUUID(), 1_000L, "send"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("daily send limit");
    }

    @Test
    @DisplayName("An unreachable User Service is a 503")
    void unavailable_isServiceUnavailable() {
        when(stub.validateUser(any())).thenThrow(Status.UNAVAILABLE.asRuntimeException());

        assertThatThrownBy(() -> client.validateUser(UUID.randomUUID(), 1_000L, "send"))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    @DisplayName("A User Service past its deadline is a 503")
    void deadlineExceeded_isServiceUnavailable() {
        when(stub.validateUser(any())).thenThrow(Status.DEADLINE_EXCEEDED.asRuntimeException());

        assertThatThrownBy(() -> client.validateUser(UUID.randomUUID(), 1_000L, "send"))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    @DisplayName("Usage records carry the transfer's counterparty")
    void recordTransaction_sendsCounterparty() {
        UUID userId = UUID.randomUUID();
        UUID counterparty = UUID.randomUUID();
        when(stub.recordTransaction(any())).thenReturn(RecordTransactionResponse.newBuilder().setSuccess(true).build());

        client.recordTransactionAsync(userId, 1_000L, "send", UUID.randomUUID(), counterparty).join();

        ArgumentCaptor<RecordTransactionRequest> request = ArgumentCaptor.forClass(RecordTransactionRequest.class);
        verify(stub).recordTransaction(request.capture());
        assertThat(request.getValue().getUserId()).isEqualTo(userId.toString());
        assertThat(request.getValue().getCounterpartyUserId()).isEqualTo(counterparty.toString());
    }

    @Test
    @DisplayName("Deposits and withdrawals are recorded without a counterparty")
    void recordTransaction_withoutCounterparty() {
        when(stub.recordTransaction(any())).thenReturn(RecordTransactionResponse.newBuilder().setSuccess(true).build());

        client.recordTransactionAsync(UUID.randomUUID(), 1_000L, "receive", UUID.randomUUID(), null).join();

        ArgumentCaptor<RecordTransactionRequest> request = ArgumentCaptor.forClass(RecordTransactionRequest.class);
        verify(stub).recordTransaction(request.capture());
        assertThat(request.getValue().getCounterpartyUserId()).isEmpty();
    }
}
