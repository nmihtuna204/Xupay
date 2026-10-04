package com.xupay.user.repository;

import com.xupay.user.entity.DailyUsage;
import com.xupay.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * DailyUsageRepository - Spring Data JPA Repository for DailyUsage entity
 * Tracks daily transaction volumes with custom UPSERT logic for concurrent updates.
 */
@Repository
public interface DailyUsageRepository extends JpaRepository<DailyUsage, UUID> {

    /**
     * Find daily usage for a user on a specific date
     */
    Optional<DailyUsage> findByUserIdAndUsageDate(UUID userId, LocalDate usageDate);

    /**
     * Find all daily usage records for a user
     */
    List<DailyUsage> findByUserId(UUID userId);

    /**
     * Find daily usage for a user within a date range
     */
    @Query("SELECT d FROM DailyUsage d WHERE d.user.id = :userId " +
           "AND d.usageDate BETWEEN :startDate AND :endDate " +
           "ORDER BY d.usageDate DESC")
    List<DailyUsage> findByUserIdAndDateRange(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Get today's usage for a user
     */
    default Optional<DailyUsage> findTodayUsage(UUID userId) {
        return findByUserIdAndUsageDate(userId, LocalDate.now());
    }

    /**
     * Increment sent amount (UPSERT logic with native query)
     * This is thread-safe for concurrent updates.
     *
     * @Transactional here, not on the caller: the only caller is the gRPC
     * RecordTransaction handler, which runs outside any transaction, and a
     * @Modifying query without one fails with TransactionRequiredException.
     * The columns are the per-direction counters the table actually has
     * (there is no transaction_count column).
     *
     * hourly_sent_counts keeps one counter per clock hour of the day,
     * {"09": 2, "14": 1}, keyed by {@link com.xupay.user.entity.DailyUsage#hourKey}:
     * it is what the per-hour transaction limit is checked against.
     */
    @Transactional
    @Modifying
    @Query(value = """
        INSERT INTO daily_usage (id, user_id, usage_date, total_sent_cents, total_sent_count,
                                 total_received_cents, total_received_count, hourly_sent_counts,
                                 created_at, updated_at)
        VALUES (gen_random_uuid(), :userId, :usageDate, :amountCents, 1, 0, 0,
                jsonb_build_object(CAST(:hourKey AS text), 1),
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, usage_date)
        DO UPDATE SET
            total_sent_cents = daily_usage.total_sent_cents + :amountCents,
            total_sent_count = daily_usage.total_sent_count + 1,
            hourly_sent_counts = jsonb_set(
                COALESCE(daily_usage.hourly_sent_counts, CAST('{}' AS jsonb)),
                ARRAY[CAST(:hourKey AS text)],
                to_jsonb(COALESCE(CAST(daily_usage.hourly_sent_counts ->> CAST(:hourKey AS text) AS integer), 0) + 1)
            ),
            updated_at = CURRENT_TIMESTAMP
        """, nativeQuery = true)
    void incrementSentAmount(
        @Param("userId") UUID userId,
        @Param("usageDate") LocalDate usageDate,
        @Param("amountCents") Long amountCents,
        @Param("hourKey") String hourKey
    );

    /**
     * Increment received amount (UPSERT logic with native query)
     */
    @Transactional
    @Modifying
    @Query(value = """
        INSERT INTO daily_usage (id, user_id, usage_date, total_sent_cents, total_sent_count,
                                 total_received_cents, total_received_count,
                                 created_at, updated_at)
        VALUES (gen_random_uuid(), :userId, :usageDate, 0, 0, :amountCents, 1,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, usage_date)
        DO UPDATE SET 
            total_received_cents = daily_usage.total_received_cents + :amountCents,
            total_received_count = daily_usage.total_received_count + 1,
            updated_at = CURRENT_TIMESTAMP
        """, nativeQuery = true)
    void incrementReceivedAmount(
        @Param("userId") UUID userId,
        @Param("usageDate") LocalDate usageDate,
        @Param("amountCents") Long amountCents
    );

    /**
     * Delete old usage records (for data retention policy)
     */
    @Modifying
    @Query("DELETE FROM DailyUsage d WHERE d.usageDate < :cutoffDate")
    void deleteOldUsageRecords(@Param("cutoffDate") LocalDate cutoffDate);

    /**
     * Get monthly total sent for a user
     */
    @Query("SELECT COALESCE(SUM(d.totalSentCents), 0) FROM DailyUsage d " +
           "WHERE d.user.id = :userId " +
           "AND d.usageDate BETWEEN :startDate AND :endDate")
    Long getMonthlySentTotal(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Get monthly total received for a user
     */
    @Query("SELECT COALESCE(SUM(d.totalReceivedCents), 0) FROM DailyUsage d " +
           "WHERE d.user.id = :userId " +
           "AND d.usageDate BETWEEN :startDate AND :endDate")
    Long getMonthlyReceivedTotal(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
