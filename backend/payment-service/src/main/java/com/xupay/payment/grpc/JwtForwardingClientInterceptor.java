package com.xupay.payment.grpc;

import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.ClientInterceptor;
import io.grpc.ForwardingClientCall;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import net.devh.boot.grpc.client.interceptor.GrpcGlobalClientInterceptor;

/**
 * JwtForwardingClientInterceptor
 * Attaches the caller's JWT (captured in {@link JwtContextHolder}) to the
 * Authorization metadata of every outgoing gRPC call, so the User Service's
 * gRPC JWT interceptor accepts the call.
 *
 * Applied globally to all @GrpcClient stubs in this service.
 */
@GrpcGlobalClientInterceptor
public class JwtForwardingClientInterceptor implements ClientInterceptor {

    private static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("Authorization", Metadata.ASCII_STRING_MARSHALLER);

    @Override
    public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(
            MethodDescriptor<ReqT, RespT> method, CallOptions callOptions, Channel next) {

        return new ForwardingClientCall.SimpleForwardingClientCall<>(next.newCall(method, callOptions)) {
            @Override
            public void start(Listener<RespT> responseListener, Metadata headers) {
                String token = JwtContextHolder.get();
                if (token != null && !token.isBlank()) {
                    // Ensure the "Bearer " prefix the server expects
                    String value = token.startsWith("Bearer ") ? token : "Bearer " + token;
                    headers.put(AUTHORIZATION_KEY, value);
                }
                super.start(responseListener, headers);
            }
        };
    }
}
