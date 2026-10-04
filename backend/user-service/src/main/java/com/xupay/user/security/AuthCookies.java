package com.xupay.user.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * AuthCookies
 * Builds the sign-in cookie that carries the access token for the web app.
 *
 * HttpOnly: page scripts cannot read it, so an injected script cannot steal
 * the token the way it could from localStorage. SameSite=Strict: the browser
 * leaves it off requests started by other sites. Secure is configurable
 * (xupay.auth.cookie-secure) because local development runs on plain HTTP;
 * it must be on wherever the app is served over HTTPS.
 *
 * No Domain attribute: the cookie belongs to this host, and the browser sends
 * it to any port on it, which is how payment-service (same host, port 8082)
 * receives it too.
 */
@Component
public class AuthCookies {

    private final boolean secure;

    public AuthCookies(@Value("${xupay.auth.cookie-secure:false}") boolean secure) {
        this.secure = secure;
    }

    /** The cookie for a freshly issued token, kept exactly as long as the token is valid. */
    public ResponseCookie issue(String token, long maxAgeSeconds) {
        return base(token).maxAge(maxAgeSeconds).build();
    }

    /** Tells the browser to delete the cookie. */
    public ResponseCookie clear() {
        return base("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(RequestToken.COOKIE_NAME, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/");
    }
}
