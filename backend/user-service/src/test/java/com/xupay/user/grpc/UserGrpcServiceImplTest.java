package com.xupay.user.grpc;

import com.xupay.user.repository.DailyUsageRepository;
import com.xupay.user.repository.TransactionLimitRepository;
import com.xupay.user.repository.UserContactRepository;
import com.xupay.user.repository.UserRepository;
import com.xupay.user.service.LimitService;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.matches;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserGrpcServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private LimitService limitService;
    @Mock private DailyUsageRepository dailyUsageRepository;
    @Mock private TransactionLimitRepository transactionLimitRepository;
    @Mock private UserContactRepository userContactRepository;
    @Mock private StreamObserver<RecordTransactionResponse> observer;

    @InjectMocks private UserGrpcServiceImpl service;

    private final UUID sender = UUID.randomUUID();
    private final UUID recipient = UUID.randomUUID();

    @BeforeEach
    void userExists() {
        when(userRepository.existsById(any())).thenReturn(true);
    }

    private RecordTransactionRequest.Builder record(UUID userId, String type) {
        return RecordTransactionRequest.newBuilder()
                .setUserId(userId.toString())
                .setAmountCents(1_000L)
                .setTransactionType(type)
                .setTransactionId(UUID.randomUUID().toString());
    }

    @Test
    @DisplayName("A send to a contact counts towards that contact's stats")
    void send_updatesSendersContactStats() {
        service.recordTransaction(record(sender, "send").setCounterpartyUserId(recipient.toString()).build(), observer);

        verify(dailyUsageRepository).incrementSentAmount(eq(sender), any(LocalDate.class), eq(1_000L), matches("[0-2][0-9]"));
        verify(userContactRepository).recordTransfer(eq(sender), eq(recipient), any(OffsetDateTime.class));
        verify(observer).onNext(argThat(RecordTransactionResponse::getSuccess));
        verify(observer).onCompleted();
    }

    @Test
    @DisplayName("The receiving side and withdrawals leave contacts alone")
    void receiveAndWithdraw_doNotTouchContacts() {
        service.recordTransaction(record(recipient, "receive").setCounterpartyUserId(sender.toString()).build(), observer);
        service.recordTransaction(record(sender, "send").build(), observer); // withdrawal: no counterparty

        verify(dailyUsageRepository).incrementReceivedAmount(eq(recipient), any(LocalDate.class), anyLong());
        verify(userContactRepository, never()).recordTransfer(any(), any(), any());
    }

    @Test
    @DisplayName("A contact-stats failure does not fail the usage record")
    void contactStatsFailure_isNotFatal() {
        when(userContactRepository.recordTransfer(any(), any(), any())).thenThrow(new RuntimeException("db hiccup"));

        service.recordTransaction(record(sender, "send").setCounterpartyUserId(recipient.toString()).build(), observer);

        verify(observer).onNext(argThat(RecordTransactionResponse::getSuccess));
        verify(observer, never()).onError(any());
    }
}
