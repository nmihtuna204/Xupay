package com.xupay.user.grpc.interceptor;

import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.Status;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.interceptor.GrpcGlobalServerInterceptor;
import org.springframework.beans.factory.annotation.Value;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * gRPC authentication: only the Payment Service may call this API.
 *
 * Every call must carry the {@code x-service-token} metadata header with the
 * secret shared between the two services (GRPC_SERVICE_TOKEN).
 *
 * The API used to accept any end user's JWT. Its methods act on whatever user
 * ID the request names - the Payment Service validates both sides of a
 * transfer with the sender's token - so any signed-in user could read anyone's
 * email, phone and KYC status (GetUser) or inflate someone's daily usage
 * (RecordTransaction). A user token proves who the user is, not that the
 * caller is the Payment Service; this check proves the latter.
 */
@GrpcGlobalServerInterceptor
@Slf4j
public class ServiceTokenGrpcInterceptor implements ServerInterceptor {

    public static final Metadata.Key<String> SERVICE_TOKEN_KEY =
            Metadata.Key.of("x-service-token", Metadata.ASCII_STRING_MARSHALLER);

    private final byte[] expectedToken;

    public ServiceTokenGrpcInterceptor(@Value("${xupay.grpc.service-token}") String serviceToken) {
        if (serviceToken == null || serviceToken.length() < 32) {
            throw new IllegalStateException(
                    "xupay.grpc.service-token (GRPC_SERVICE_TOKEN) must be at least 32 characters");
        }
        this.expectedToken = serviceToken.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String presented = headers.get(SERVICE_TOKEN_KEY);
        // Constant-time comparison: the token is a shared secret.
        if (presented == null
                || !MessageDigest.isEqual(presented.getBytes(StandardCharsets.UTF_8), expectedToken)) {
            log.warn("Rejected gRPC call without a valid service token: {}",
                    call.getMethodDescriptor().getFullMethodName());
            call.close(Status.UNAUTHENTICATED.withDescription("Service authentication required"), new Metadata());
            return new ServerCall.Listener<>() {};
        }
        return next.startCall(call, headers);
    }
}
