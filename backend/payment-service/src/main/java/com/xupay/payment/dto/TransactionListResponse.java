package com.xupay.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * TransactionListResponse
 * Paged transaction history for the list endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionListResponse {

    private List<TransactionDetailResponse> items;
    private long total;
    private int page;
    private int size;
}
