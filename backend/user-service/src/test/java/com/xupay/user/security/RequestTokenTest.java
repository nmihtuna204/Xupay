package com.xupay.user.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class RequestTokenTest {

    private static MockHttpServletRequest request(String method) {
        return new MockHttpServletRequest(method, "/api/users/me");
    }

    @Test
    void bearerHeader_isTheToken() {
        MockHttpServletRequest request = request("POST");
        request.addHeader("Authorization", "Bearer header-token");

        assertThat(RequestToken.from(request)).contains(new RequestToken("header-token", false));
    }

    @Test
    void bearerHeader_winsOverTheCookie() {
        MockHttpServletRequest request = request("GET");
        request.addHeader("Authorization", "Bearer header-token");
        request.setCookies(new Cookie(RequestToken.COOKIE_NAME, "cookie-token"));

        assertThat(RequestToken.from(request)).contains(new RequestToken("header-token", false));
    }

    @Test
    void cookie_isTheTokenForReads() {
        MockHttpServletRequest request = request("GET");
        request.setCookies(new Cookie("other", "x"), new Cookie(RequestToken.COOKIE_NAME, "cookie-token"));

        assertThat(RequestToken.from(request)).contains(new RequestToken("cookie-token", true));
    }

    @Test
    void cookie_onAStateChangingRequest_countsOnlyWithXRequestedWith() {
        for (String method : new String[] {"POST", "PUT", "PATCH", "DELETE"}) {
            MockHttpServletRequest request = request(method);
            request.setCookies(new Cookie(RequestToken.COOKIE_NAME, "cookie-token"));
            assertThat(RequestToken.from(request)).as(method + " without the header").isEmpty();

            request.addHeader("X-Requested-With", "XMLHttpRequest");
            assertThat(RequestToken.from(request)).as(method + " with the header")
                    .contains(new RequestToken("cookie-token", true));
        }
    }

    @Test
    void noTokenAnywhere_orAnEmptyOne_isNoToken() {
        assertThat(RequestToken.from(request("GET"))).isEmpty();

        MockHttpServletRequest emptyBearer = request("GET");
        emptyBearer.addHeader("Authorization", "Bearer   ");
        assertThat(RequestToken.from(emptyBearer)).isEmpty();

        MockHttpServletRequest emptyCookie = request("GET");
        emptyCookie.setCookies(new Cookie(RequestToken.COOKIE_NAME, ""));
        assertThat(RequestToken.from(emptyCookie)).isEmpty();
    }
}
