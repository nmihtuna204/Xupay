package com.xupay.payment.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Entity timestamps are LocalDateTime: Hibernate reads the TIMESTAMPTZ columns
 * as wall-clock time in the JVM's zone. That is not a point in time, and
 * serialised as-is ("2026-10-01T08:57:01") a browser parses it as its own local
 * time - with the service in a UTC container, every transaction showed seven
 * hours early in Vietnam. API responses carry Instants ("...Z") instead.
 */
public final class Instants {

    private Instants() {
    }

    /** The instant a JVM-zone wall-clock timestamp denotes; null stays null. */
    public static Instant of(LocalDateTime jvmLocal) {
        return jvmLocal == null ? null : jvmLocal.atZone(ZoneId.systemDefault()).toInstant();
    }
}
