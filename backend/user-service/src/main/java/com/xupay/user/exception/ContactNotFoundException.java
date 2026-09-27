package com.xupay.user.exception;

import java.util.UUID;

/**
 * Exception thrown when a contact does not exist.
 * Maps to HTTP 404 NOT_FOUND.
 */
public class ContactNotFoundException extends RuntimeException {

    public ContactNotFoundException(UUID contactId) {
        super("Contact not found with ID: " + contactId);
    }
}
