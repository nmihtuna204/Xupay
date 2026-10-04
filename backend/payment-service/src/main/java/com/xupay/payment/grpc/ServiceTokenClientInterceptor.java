package com.xupay.payment.grpc;

import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.ClientInterceptor;
import io.grpc.ForwardingClientCall;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import net.devh.boot.grpc.client.interceptor.GrpcGlobalClientInterceptor;
import org.springframework.beans.factory.annotation.Value;

/**
 * ServiceTokenClientInterceptor
 * Authenticates this service to the User Service: every outgoing gRPC call
 * carries the shared service token (GRPC_SERVICE_TOKEN) in the
 * {@code x-service-token} metadata header.
 *
 * This replaces forwarding the end user's JWT, which proved who the user was
 * but not that the caller was the Payment Service - so any user could call the
 * User Service's gRPC API directly, for any user ID. It also no longer matters
 * which thread a call runs on (the usage recording runs after commit, off the
 * request thread).
 *
 * Applied globally to all @GrpcClient stubs in this service.
 */
@GrpcGlobalClientInterceptor
public class ServiceTokenClientInterceptor implements ClientInterceptor {

    static final Metadata.Key<String> SERVICE_TOKEN_KEY =
            Metadata.Key.of("x-service-token", Metadata.ASCII_STRING_MARSHALLER);

    private final String serviceToken;

    public ServiceTokenClientInterceptor(@Value("${xupay.grpc.service-token}") String serviceToken) {
        if (serviceToken == null || serviceToken.length() < 32) {
            throw new IllegalStateException(
                    "xupay.grpc.service-token (GRPC_SERVICE_TOKEN) must be at least 32 characters");
        }
        this.serviceToken = serviceToken;
    }

    @Override
    public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(
            MethodDescriptor<ReqT, RespT> method, CallOptions callOptions, Channel next) {

        return new ForwardingClientCall.SimpleForwardingClientCall<>(next.newCall(method, callOptions)) {
            @Override
            public void start(Listener<RespT> responseListener, Metadata headers) {
                headers.put(SERVICE_TOKEN_KEY, serviceToken);
                super.start(responseListener, headers);
            }
        };
    }
}
