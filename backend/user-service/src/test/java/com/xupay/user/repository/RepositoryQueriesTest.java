package com.xupay.user.repository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Boots the JPA layer, which parses every derived and @Query method of every
 * repository: a misspelled property or invalid JPQL fails here instead of at
 * application startup (the other tests mock the repositories).
 */
@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=none") // queries need the model, not tables
class RepositoryQueriesTest {

    @Autowired private UserRepository userRepository;
    @Autowired private UserContactRepository userContactRepository;
    @Autowired private KycDocumentRepository kycDocumentRepository;
    @Autowired private DailyUsageRepository dailyUsageRepository;

    @Test
    @DisplayName("Every repository query is valid against the entity model")
    void repositoriesBoot() {
        assertThat(userRepository).isNotNull();
        assertThat(userContactRepository).isNotNull();
        assertThat(kycDocumentRepository).isNotNull();
        assertThat(dailyUsageRepository).isNotNull();
    }
}
