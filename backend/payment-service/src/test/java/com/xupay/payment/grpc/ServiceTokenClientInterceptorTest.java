package com.xupay.payment.grpc;

import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServiceTokenClientInterceptorTest {

    private static final String TOKEN = "test-service-token-at-least-32-characters";

    @Mock private Channel channel;
    @Mock private ClientCall<Object, Object> underlyingCall;
    @Mock private MethodDescriptor<Object, Object> method;
    @Mock private ClientCall.Listener<Object> listener;

    @Test
    @DisplayName("Every outgoing call carries the service token")
    void addsServiceToken() {
        when(channel.newCall(any(MethodDescriptor.class), any(CallOptions.class))).thenReturn(underlyingCall);
        ClientCall<Object, Object> call = new ServiceTokenClientInterceptor(TOKEN)
                .interceptCall(method, CallOptions.DEFAULT, channel);

        call.start(listener, new Metadata());

        ArgumentCaptor<Metadata> headers = ArgumentCaptor.forClass(Metadata.class);
        verify(underlyingCall).start(any(), headers.capture());
        assertThat(headers.getValue().get(ServiceTokenClientInterceptor.SERVICE_TOKEN_KEY)).isEqualTo(TOKEN);
    }

    @Test
    @DisplayName("A short or missing token is a startup error")
    void weakToken_failsAtStartup() {
        assertThatThrownBy(() -> new ServiceTokenClientInterceptor("short"))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new ServiceTokenClientInterceptor(null))
                .isInstanceOf(IllegalStateException.class);
    }
}
