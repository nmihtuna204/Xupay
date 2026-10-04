package com.xupay.payment.service;

import com.xupay.payment.dto.CreateWalletRequest;
import com.xupay.payment.dto.CreateWalletResponse;
import com.xupay.payment.entity.Wallet;
import com.xupay.payment.entity.enums.AccountType;
import com.xupay.payment.entity.enums.NormalBalance;
import com.xupay.payment.entity.enums.WalletType;
import com.xupay.payment.repository.ChartOfAccountsRepository;
import com.xupay.payment.repository.WalletRepository;
import com.xupay.payment.service.impl.WalletServiceImpl;
import com.xupay.payment.util.TestDataBuilder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock private WalletRepository walletRepository;
    @Mock private ChartOfAccountsRepository chartOfAccountsRepository;
    @InjectMocks private WalletServiceImpl walletService;

    @Test
    @DisplayName("A wallet in a currency the ledger does not record is refused")
    void createWallet_nonVndCurrency_isRefused() {
        CreateWalletRequest request = new CreateWalletRequest(UUID.randomUUID(), WalletType.PERSONAL, "USD");

        assertThatThrownBy(() -> walletService.createWallet(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only VND");
        verify(walletRepository, never()).save(any());
    }

    @Test
    @DisplayName("A missing currency defaults to VND instead of failing the insert")
    void createWallet_nullCurrency_defaultsToVnd() {
        UUID userId = UUID.randomUUID();
        when(chartOfAccountsRepository.findByAccountCode("1110"))
                .thenReturn(Optional.of(TestDataBuilder.createChartOfAccount(
                        "1110", "Personal wallets", AccountType.ASSET, NormalBalance.DEBIT)));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateWalletResponse response = walletService.createWallet(
                new CreateWalletRequest(userId, WalletType.PERSONAL, null));

        assertThat(response.getCurrency()).isEqualTo("VND");
    }
}
