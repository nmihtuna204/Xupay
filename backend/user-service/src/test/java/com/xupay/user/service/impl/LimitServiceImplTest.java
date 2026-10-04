package com.xupay.user.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xupay.user.dto.response.LimitCheckResponse;
import com.xupay.user.entity.DailyUsage;
import com.xupay.user.entity.TransactionLimit;
import com.xupay.user.entity.User;
import com.xupay.user.entity.enums.KycStatus;
import com.xupay.user.entity.enums.KycTier;
import com.xupay.user.repository.DailyUsageRepository;
import com.xupay.user.repository.TransactionLimitRepository;
import com.xupay.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Transaction limits per KYC tier. Outgoing payments (transfers and
 * withdrawals, recorded as "send") are capped by amount per transaction, per
 * day and per month, and by count per day and per hour.
 */
@ExtendWith(MockitoExtension.class)
class LimitServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private TransactionLimitRepository transactionLimitRepository;
    @Mock private DailyUsageRepository dailyUsageRepository;

    private LimitServiceImpl limitService;
    private User user;

    // TIER_0 as seeded (V1 counts, V3 VND amounts)
    private final TransactionLimit tier0 = TransactionLimit.builder()
            .tierName("TIER_0")
            .dailySendLimitCents(250_000_000L)
            .dailyReceiveLimitCents(250_000_000L)
            .singleTransactionMaxCents(125_000_000L)
            .monthlyVolumeLimitCents(2_500_000_000L)
            .maxTransactionsPerDay(5)
            .maxTransactionsPerHour(2)
            .build();

    @BeforeEach
    void setUp() {
        limitService = new LimitServiceImpl(userRepository, transactionLimitRepository, dailyUsageRepository,
                new ObjectMapper());
        user = User.builder()
                .id(UUID.randomUUID())
                .kycStatus(KycStatus.PENDING)
                .kycTier(KycTier.TIER_0)
                .build();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(transactionLimitRepository.findByTierName("TIER_0")).thenReturn(Optional.of(tier0));
        lenient().when(dailyUsageRepository.getMonthlySentTotal(eq(user.getId()), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(0L);
    }

    private void usageToday(int sentCount, String hourlySentCounts) {
        DailyUsage usage = DailyUsage.builder()
                .user(user)
                .usageDate(LocalDate.now())
                .totalSentCents(1_000_00L * sentCount)
                .totalSentCount(sentCount)
                .hourlySentCounts(hourlySentCounts)
                .build();
        when(dailyUsageRepository.findTodayUsage(user.getId())).thenReturn(Optional.of(usage));
    }

    /** The same count in every hour, so the test does not depend on the clock. */
    private static String everyHour(int count) {
        return IntStream.range(0, 24)
                .mapToObj(h -> String.format("\"%02d\": %d", h, count))
                .collect(Collectors.joining(", ", "{", "}"));
    }

    @Test
    @DisplayName("A send within every limit is allowed")
    void send_withinLimits_isAllowed() {
        usageToday(1, everyHour(1));

        LimitCheckResponse check = limitService.checkTransactionAllowed(user.getId(), 50_000_00L, "send");

        assertThat(check.allowed()).isTrue();
    }

    @Test
    @DisplayName("The daily count limit is enforced (was only displayed)")
    void send_overDailyCount_isRefused() {
        usageToday(5, everyHour(0));

        LimitCheckResponse check = limitService.checkTransactionAllowed(user.getId(), 1_000_00L, "send");

        assertThat(check.allowed()).isFalse();
        assertThat(check.reason()).contains("5 outgoing payments per day");
    }

    @Test
    @DisplayName("The hourly count limit is enforced (was only displayed)")
    void send_overHourlyCount_isRefused() {
        usageToday(2, everyHour(2));

        LimitCheckResponse check = limitService.checkTransactionAllowed(user.getId(), 1_000_00L, "send");

        assertThat(check.allowed()).isFalse();
        assertThat(check.reason()).contains("2 outgoing payments per hour");
    }

    @Test
    @DisplayName("The monthly volume limit is enforced (was only displayed)")
    void send_overMonthlyVolume_isRefused() {
        usageToday(0, null);
        when(dailyUsageRepository.getMonthlySentTotal(eq(user.getId()), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(2_450_000_000L);

        LimitCheckResponse check = limitService.checkTransactionAllowed(user.getId(), 100_000_000L, "send");

        assertThat(check.allowed()).isFalse();
        assertThat(check.reason()).contains("monthly send limit");
    }

    @Test
    @DisplayName("Count limits apply to money going out, not money coming in")
    void receive_ignoresSendCounts() {
        usageToday(5, everyHour(2));

        LimitCheckResponse check = limitService.checkTransactionAllowed(user.getId(), 1_000_00L, "receive");

        assertThat(check.allowed()).isTrue();
    }

    @Test
    @DisplayName("A corrupt hourly counter does not block every payment")
    void send_unreadableHourlyCounts_countsAsNone() {
        usageToday(1, "not json");

        LimitCheckResponse check = limitService.checkTransactionAllowed(user.getId(), 1_000_00L, "send");

        assertThat(check.allowed()).isTrue();
    }

    @Test
    @DisplayName("A first payment of the day, with no usage row yet, is allowed")
    void send_noUsageYet_isAllowed() {
        when(dailyUsageRepository.findTodayUsage(user.getId())).thenReturn(Optional.empty());

        LimitCheckResponse check = limitService.checkTransactionAllowed(user.getId(), 1_000_00L, "send");

        assertThat(check.allowed()).isTrue();
    }
}
