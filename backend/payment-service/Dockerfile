# Build stage
FROM maven:3.9.4-eclipse-temurin-21 as builder
WORKDIR /workspace
COPY pom.xml .
COPY .mvn .mvn
# Download dependencies
RUN mvn -B -ntp dependency:go-offline
COPY src src
# Package the application
RUN mvn -B package -DskipTests -DskipITs

# Run stage
FROM eclipse-temurin:21-jre
# curl is required by the docker-compose healthcheck (not shipped in the JRE image)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /workspace/target/*.jar /app/app.jar
EXPOSE 8082
ENTRYPOINT ["java","-jar","/app/app.jar"]
