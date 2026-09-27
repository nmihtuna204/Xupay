package com.xupay.payment.repository;

import com.xupay.payment.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * WalletRepository
 * Data access for user wallets.
 * 
 * IMPORTANT: Balance is NOT stored in wallet table.
 * Use get_wallet_balance() function for balance queries.
 */
@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    Optional<Wallet> findByUserId(UUID userId);

    /**
     * The wallet row, locked (SELECT ... FOR UPDATE) until the transaction ends.
     *
     * Balances are derived from the ledger, so "check balance, then write
     * entries" is a read-then-write race: without a lock, N concurrent
     * withdrawals could all read the same balance and all succeed, driving the
     * wallet negative. Every operation that moves money takes this lock on the
     * wallet it touches first, which serialises them per wallet; a debit's
     * balance check then runs after any earlier debit has committed.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.userId = :userId")
    Optional<Wallet> findByUserIdForUpdate(@Param("userId") UUID userId);

    boolean existsByUserId(UUID userId);

    /**
     * Get wallet balance using PostgreSQL function.
     * Returns amount in cents.
     */
    @Query(value = "SELECT get_wallet_balance(:walletId)", nativeQuery = true)
    Long getBalance(@Param("walletId") UUID walletId);
}
