package com.xupay.user.grpc.interceptor;

import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ServiceTokenGrpcInterceptorTest {

    private static final String TOKEN = "test-service-token-at-least-32-characters";

    @Mock private ServerCall<Object, Object> call;
    @Mock private ServerCallHandler<Object, Object> next;
    @Mock private MethodDescriptor<Object, Object> method;

    private final ServiceTokenGrpcInterceptor interceptor = new ServiceTokenGrpcInterceptor(TOKEN);

    @BeforeEach
    void setUp() {
        lenient().when(call.getMethodDescriptor()).thenReturn(method);
        lenient().when(method.getFullMethodName()).thenReturn("xupay.user.UserService/GetUser");
    }

    private static Metadata withToken(String token) {
        Metadata headers = new Metadata();
        if (token != null) {
            headers.put(ServiceTokenGrpcInterceptor.SERVICE_TOKEN_KEY, token);
        }
        return headers;
    }

    @Test
    @DisplayName("The Payment Service's token lets the call through")
    void validToken_proceeds() {
        Metadata headers = withToken(TOKEN);

        interceptor.interceptCall(call, headers, next);

        verify(next).startCall(call, headers);
        verify(call, never()).close(any(), any());
    }

    @Test
    @DisplayName("A call without the service token is refused")
    void missingToken_isUnauthenticated() {
        interceptor.interceptCall(call, withToken(null), next);

        assertRefused();
    }

    @Test
    @DisplayName("A wrong token is refused")
    void wrongToken_isUnauthenticated() {
        interceptor.interceptCall(call, withToken("someone-elses-token-also-32-characters!"), next);

        assertRefused();
    }

    @Test
    @DisplayName("An end user's JWT is no longer enough")
    void userJwt_isUnauthenticated() {
        Metadata headers = new Metadata();
        headers.put(Metadata.Key.of("Authorization", Metadata.ASCII_STRING_MARSHALLER), "Bearer eyJhbGciOiJIUzI1NiJ9.e30.x");

        interceptor.interceptCall(call, headers, next);

        assertRefused();
    }

    @Test
    @DisplayName("A short or missing token is a startup error, not an open API")
    void weakToken_failsAtStartup() {
        assertThatThrownBy(() -> new ServiceTokenGrpcInterceptor("short"))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new ServiceTokenGrpcInterceptor(null))
                .isInstanceOf(IllegalStateException.class);
    }

    private void assertRefused() {
        ArgumentCaptor<Status> status = ArgumentCaptor.forClass(Status.class);
        verify(call).close(status.capture(), any(Metadata.class));
        assertThat(status.getValue().getCode()).isEqualTo(Status.Code.UNAUTHENTICATED);
        verify(next, never()).startCall(any(), any());
    }
}
