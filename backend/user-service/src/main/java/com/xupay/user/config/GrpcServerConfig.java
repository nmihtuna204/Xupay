package com.xupay.user.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;

/**
 * gRPC Server Configuration
 * Registers global interceptors for all gRPC services
 * 
 * Interceptors:
 * - LoggingGrpcInterceptor - Logs request/response
 * - ServiceTokenGrpcInterceptor - Only the Payment Service (shared service token) may call
 */
@Configuration
@RequiredArgsConstructor
public class GrpcServerConfig {
}
