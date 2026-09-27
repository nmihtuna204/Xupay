package com.xupay.user.entity.enums;

/**
 * Account role. Maps to database constraint: chk_user_role.
 *
 * USER is every customer. ADMIN can review KYC documents (the
 * @PreAuthorize("hasRole('ADMIN')") endpoints in KycController).
 */
public enum UserRole {
    USER,
    ADMIN
}
