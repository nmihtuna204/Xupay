package com.xupay.user.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xupay.user.dto.response.DailyUsageResponse;
import com.xupay.user.dto.response.LimitCheckResponse;
import com.xupay.user.dto.response.UserLimitsResponse;
import com.xupay.user.entity.DailyUsage;
import com.xupay.user.entity.TransactionLimit;
import com.xupay.user.entity.User;
import com.xupay.user.exception.UserNotFoundException;
import com.xupay.user.repository.DailyUsageRepository;
import com.xupay.user.repository.TransactionLimitRepository;
import com.xupay.user.repository.UserRepository;
import com.xupay.user.service.LimitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

/**
 * LimitServiceImpl
 * Implementation of transaction limit management and enforcement.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LimitServiceImpl implements LimitService {

    private final UserRepository userRepository;
    private final TransactionLimitRepository transactionLimitRepository;
    private final DailyUsageRepository dailyUsageRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public UserLimitsResponse getUserLimits(UUID userId) {
        log.debug("Fetching transaction limits for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Get limits for user's tier
        String tierName = user.getKycTier().name();
        TransactionLimit limits = transactionLimitRepository.findByTierName(tierName)
                .orElseThrow(() -> new RuntimeException("Transaction limits not found for tier: " + tierName));

        return new UserLimitsResponse(
                user.getKycTier(),
                limits.getDailySendLimitCents(),
                limits.getDailyReceiveLimitCents(),
                limits.getMonthlyVolumeLimitCents(),
                limits.getSingleTransactionMaxCents(),
                limits.getMaxTransactionsPerHour(),
                limits.getMaxTransactionsPerDay(),
                limits.getCanSendInternational(),
                limits.getCanReceiveMerchantPayments()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public DailyUsageResponse getDailyUsage(UUID userId) {
        log.debug("Fetching daily usage for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Get limits for user's tier
        String tierName = user.getKycTier().name();
        TransactionLimit limits = transactionLimitRepository.findByTierName(tierName)
                .orElseThrow(() -> new RuntimeException("Transaction limits not found for tier: " + tierName));

        // Get today's usage
        Optional<DailyUsage> usageOpt = dailyUsageRepository.findTodayUsage(userId);
        LocalDate today = LocalDate.now();

        DailyUsage usage = usageOpt.orElse(DailyUsage.builder()
                .user(user)
                .usageDate(today)
                .totalSentCents(0L)
                .totalReceivedCents(0L)
                .totalSentCount(0)
                .totalReceivedCount(0)
                .build());

        Long remaining = limits.getDailySendLimitCents() - usage.getTotalSentCents();
        int transactionCount = (usage.getTotalSentCount() != null ? usage.getTotalSentCount() : 0) + 
                               (usage.getTotalReceivedCount() != null ? usage.getTotalReceivedCount() : 0);

        return new DailyUsageResponse(
                today,
                usage.getTotalSentCents(),
                usage.getTotalReceivedCents(),
                transactionCount,
                limits.getDailySendLimitCents(),
                Math.max(0L, remaining)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public LimitCheckResponse checkTransactionAllowed(UUID userId, Long amountCents, String type) {
        log.debug("Checking if user {} can {} {} cents", userId, type, amountCents);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Check if user can transact
        if (!user.canTransact()) {
            return new LimitCheckResponse(false, "Account not active or KYC not approved", 0L);
        }

        // Get limits
        String tierName = user.getKycTier().name();
        TransactionLimit limits = transactionLimitRepository.findByTierName(tierName)
                .orElseThrow(() -> new RuntimeException("Transaction limits not found for tier: " + tierName));

        // Check single transaction max
        if (!limits.isAmountWithinSingleLimit(amountCents)) {
            return new LimitCheckResponse(
                    false,
                    "Amount exceeds the single transaction limit of " + vnd(limits.getSingleTransactionMaxCents()),
                    0L
            );
        }

        // Get today's usage
        Optional<DailyUsage> usageOpt = dailyUsageRepository.findTodayUsage(userId);
        LocalDate today = LocalDate.now();
        DailyUsage usage = usageOpt.orElse(DailyUsage.builder()
                .user(user)
                .usageDate(today)
                .totalSentCents(0L)
                .totalReceivedCents(0L)
                .totalSentCount(0)
                .totalReceivedCount(0)
                .build());

        // Check daily limit based on type
        if ("send".equalsIgnoreCase(type)) {
            Long remaining = limits.getDailySendLimitCents() - usage.getTotalSentCents();
            if (!limits.isDailySendWithinLimit(usage.getTotalSentCents(), amountCents)) {
                return new LimitCheckResponse(
                        false,
                        "Would exceed the daily send limit of " + vnd(limits.getDailySendLimitCents()),
                        Math.max(0L, remaining)
                );
            }

            // The count and monthly limits each tier advertises (Settings, the
            // landing page) were never checked. They apply to outgoing
            // payments - transfers and withdrawals, both recorded as "send" -
            // not to money received.
            int sentToday = usage.getTotalSentCount() != null ? usage.getTotalSentCount() : 0;
            if (sentToday >= limits.getMaxTransactionsPerDay()) {
                return new LimitCheckResponse(
                        false,
                        "Daily limit reached: " + limits.getMaxTransactionsPerDay() + " outgoing payments per day",
                        Math.max(0L, remaining)
                );
            }
            if (sentInCurrentHour(usage) >= limits.getMaxTransactionsPerHour()) {
                return new LimitCheckResponse(
                        false,
                        "Hourly limit reached: " + limits.getMaxTransactionsPerHour() + " outgoing payments per hour",
                        Math.max(0L, remaining)
                );
            }
            Long sentThisMonth = dailyUsageRepository.getMonthlySentTotal(userId, today.withDayOfMonth(1), today);
            long monthToDate = sentThisMonth != null ? sentThisMonth : 0L;
            if (monthToDate + amountCents > limits.getMonthlyVolumeLimitCents()) {
                return new LimitCheckResponse(
                        false,
                        "Would exceed the monthly send limit of " + vnd(limits.getMonthlyVolumeLimitCents()),
                        Math.max(0L, remaining)
                );
            }

            return new LimitCheckResponse(true, "Transaction allowed", Math.max(0L, remaining - amountCents));
        } else {
            if (!limits.isDailyReceiveWithinLimit(usage.getTotalReceivedCents(), amountCents)) {
                Long remaining = limits.getDailyReceiveLimitCents() - usage.getTotalReceivedCents();
                return new LimitCheckResponse(
                        false,
                        "Would exceed the daily receive limit of " + vnd(limits.getDailyReceiveLimitCents()),
                        Math.max(0L, remaining)
                );
            }
            Long remaining = limits.getDailyReceiveLimitCents() - usage.getTotalReceivedCents() - amountCents;
            return new LimitCheckResponse(true, "Transaction allowed", Math.max(0L, remaining));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canSend(UUID userId, Long amountCents) {
        LimitCheckResponse response = checkTransactionAllowed(userId, amountCents, "send");
        return response.allowed();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canReceive(UUID userId, Long amountCents) {
        LimitCheckResponse response = checkTransactionAllowed(userId, amountCents, "receive");
        return response.allowed();
    }

    /**
     * Outgoing payments recorded in the current clock hour, from the day's
     * hourly_sent_counts ({"14": 3}). Unreadable data counts as none: a
     * corrupt counter must not block every payment.
     */
    private int sentInCurrentHour(DailyUsage usage) {
        String counts = usage.getHourlySentCounts();
        if (counts == null || counts.isBlank()) {
            return 0;
        }
        try {
            return objectMapper.readTree(counts).path(DailyUsage.hourKey(LocalTime.now())).asInt(0);
        } catch (JsonProcessingException e) {
            log.warn("Unreadable hourly_sent_counts for user {}: {}", usage.getUser().getId(), e.getMessage());
            return 0;
        }
    }

    /**
     * Cents -> "1.250.000 ₫". These messages reach the user verbatim (the app
     * shows them in a toast); they used to print the raw cents as dollars,
     * e.g. "limit of 50.0".
     */
    private static String vnd(Long cents) {
        java.text.NumberFormat format = java.text.NumberFormat.getIntegerInstance(java.util.Locale.forLanguageTag("vi-VN"));
        return format.format(cents / 100) + " ₫";
    }
}
