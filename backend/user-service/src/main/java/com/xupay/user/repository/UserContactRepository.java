package com.xupay.user.repository;

import com.xupay.user.entity.UserContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * UserContactRepository - Spring Data JPA Repository for UserContact entity
 * Manages user's frequent recipient contacts for quick transfers.
 */
@Repository
public interface UserContactRepository extends JpaRepository<UserContact, UUID> {

    /**
     * Find all contacts for a specific user
     */
    List<UserContact> findByUserId(UUID userId);

    /**
     * Find a specific contact relationship
     */
    Optional<UserContact> findByUserIdAndContactUserId(UUID userId, UUID contactUserId);

    /**
     * Check if contact relationship already exists
     */
    boolean existsByUserIdAndContactUserId(UUID userId, UUID contactUserId);

    /**
     * Find all favorite contacts for a user
     */
    List<UserContact> findByUserIdAndIsFavoriteTrue(UUID userId);

    /**
     * Find contacts ordered by transaction count (most frequent first)
     */
    List<UserContact> findByUserIdOrderByTotalTransactionsDesc(UUID userId);

    /**
     * Find contacts ordered by last transaction (most recent first)
     */
    List<UserContact> findByUserIdOrderByLastTransactionAtDesc(UUID userId);

    /**
     * Find recently used contacts (within last N days)
     */
    @Query("SELECT c FROM UserContact c WHERE c.user.id = :userId " +
           "AND c.lastTransactionAt > :cutoffDate " +
           "ORDER BY c.lastTransactionAt DESC")
    List<UserContact> findRecentlyUsedContacts(
        @Param("userId") UUID userId,
        @Param("cutoffDate") OffsetDateTime cutoffDate
    );

    /**
     * Search contacts by nickname or contact's name
     */
    @Query("SELECT c FROM UserContact c WHERE c.user.id = :userId AND " +
           "(LOWER(c.nickname) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.contactUser.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.contactUser.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<UserContact> searchContacts(
        @Param("userId") UUID userId,
        @Param("searchTerm") String searchTerm
    );

    /**
     * Get top N most used contacts
     */
    @Query("SELECT c FROM UserContact c WHERE c.user.id = :userId " +
           "ORDER BY c.totalTransactions DESC")
    List<UserContact> findTopContacts(
        @Param("userId") UUID userId,
        @Param("limit") int limit
    );

    /**
     * Count contacts for a user
     */
    long countByUserId(UUID userId);

    /**
     * One more transfer from userId to contactUserId: bumps that contact's
     * count and last-used time if contactUserId is in userId's contacts, and
     * does nothing otherwise. A single UPDATE, so concurrent transfers each
     * count. Called by the gRPC RecordTransaction handler, which runs outside
     * any transaction, hence @Transactional here.
     *
     * @return the number of contact rows updated (0 or 1)
     */
    @Transactional
    @Modifying
    @Query("UPDATE UserContact c SET c.totalTransactions = c.totalTransactions + 1, c.lastTransactionAt = :at " +
           "WHERE c.user.id = :userId AND c.contactUser.id = :contactUserId")
    int recordTransfer(
        @Param("userId") UUID userId,
        @Param("contactUserId") UUID contactUserId,
        @Param("at") OffsetDateTime at
    );

    /**
     * Delete contact relationship
     */
    void deleteByUserIdAndContactUserId(UUID userId, UUID contactUserId);
}
