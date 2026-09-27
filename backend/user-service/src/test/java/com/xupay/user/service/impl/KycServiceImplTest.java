package com.xupay.user.service.impl;

import com.xupay.user.dto.request.ApproveKycRequest;
import com.xupay.user.dto.request.RejectKycRequest;
import com.xupay.user.dto.request.UploadKycDocumentRequest;
import com.xupay.user.entity.KycDocument;
import com.xupay.user.entity.User;
import com.xupay.user.entity.enums.DocumentType;
import com.xupay.user.entity.enums.KycStatus;
import com.xupay.user.entity.enums.KycTier;
import com.xupay.user.mapper.KycDocumentMapper;
import com.xupay.user.repository.KycDocumentRepository;
import com.xupay.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The KYC state machine: how approving, rejecting and re-submitting documents
 * move a user between PENDING / APPROVED / REJECTED and between tiers.
 */
@ExtendWith(MockitoExtension.class)
class KycServiceImplTest {

    @Mock private KycDocumentRepository kycDocumentRepository;
    @Mock private UserRepository userRepository;
    @Mock private KycDocumentMapper kycDocumentMapper;

    @InjectMocks private KycServiceImpl kycService;

    private final UUID adminId = UUID.randomUUID();
    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(UUID.randomUUID())
                .email("kyc@test.local")
                .passwordHash("x")
                .firstName("K")
                .lastName("Y")
                .kycStatus(KycStatus.PENDING)
                .kycTier(KycTier.TIER_0)
                .build();
        lenient().when(kycDocumentRepository.save(any(KycDocument.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private KycDocument documentOf(User owner) {
        KycDocument doc = KycDocument.builder()
                .id(UUID.randomUUID())
                .user(owner)
                .documentType(DocumentType.NATIONAL_ID)
                .fileUrl("https://files.test/id.png")
                .build();
        when(kycDocumentRepository.findById(doc.getId())).thenReturn(Optional.of(doc));
        return doc;
    }

    @Test
    @DisplayName("First approval moves a PENDING user to APPROVED / TIER_1 by default")
    void approve_pendingUser_defaultsToTier1() {
        KycDocument doc = documentOf(user);

        kycService.approveDocument(doc.getId(), adminId, new ApproveKycRequest("ok", null));

        assertThat(user.getKycStatus()).isEqualTo(KycStatus.APPROVED);
        assertThat(user.getKycTier()).isEqualTo(KycTier.TIER_1);
    }

    @Test
    @DisplayName("An already-approved user can be upgraded to a higher tier (was impossible)")
    void approve_approvedUser_canUpgrade() {
        user.setKycStatus(KycStatus.APPROVED);
        user.setKycTier(KycTier.TIER_1);
        KycDocument doc = documentOf(user);

        kycService.approveDocument(doc.getId(), adminId, new ApproveKycRequest("proof of address", KycTier.TIER_2));

        assertThat(user.getKycTier()).isEqualTo(KycTier.TIER_2);
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Approving a document never lowers an existing tier")
    void approve_neverDowngrades() {
        user.setKycStatus(KycStatus.APPROVED);
        user.setKycTier(KycTier.TIER_3);
        KycDocument doc = documentOf(user);

        kycService.approveDocument(doc.getId(), adminId, new ApproveKycRequest("extra doc", null));

        assertThat(user.getKycTier()).isEqualTo(KycTier.TIER_3);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rejecting a document does not lock out an approved user")
    void reject_approvedUser_keepsApproval() {
        user.setKycStatus(KycStatus.APPROVED);
        user.setKycTier(KycTier.TIER_1);
        KycDocument doc = documentOf(user);

        kycService.rejectDocument(doc.getId(), adminId, new RejectKycRequest("blurry"));

        assertThat(user.getKycStatus()).isEqualTo(KycStatus.APPROVED);
        assertThat(user.getKycTier()).isEqualTo(KycTier.TIER_1);
    }

    @Test
    @DisplayName("A REJECTED user who uploads a new document is back to PENDING (was locked forever)")
    void upload_afterRejection_reopensReview() {
        user.setKycStatus(KycStatus.REJECTED);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        kycService.uploadDocument(user.getId(), new UploadKycDocumentRequest(
                DocumentType.PASSPORT, "P123", "VNM", "https://files.test/p.png", "image/png", 1024L));

        assertThat(user.getKycStatus()).isEqualTo(KycStatus.PENDING);
        assertThat(user.canTransact()).isTrue();
    }

    @Test
    @DisplayName("A previously rejected user can then be approved")
    void approve_afterRejection_restoresAccount() {
        user.setKycStatus(KycStatus.REJECTED);
        KycDocument doc = documentOf(user);

        kycService.approveDocument(doc.getId(), adminId, new ApproveKycRequest("clear photo", null));

        assertThat(user.getKycStatus()).isEqualTo(KycStatus.APPROVED);
        assertThat(user.getKycTier()).isEqualTo(KycTier.TIER_1);
    }
}
