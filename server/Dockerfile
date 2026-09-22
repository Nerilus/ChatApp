# Use the official Maven image with Eclipse Temurin JDK 17 to build the application
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /server
COPY . .
RUN mvn clean package -DskipTests

# Run the application with Eclipse Temurin JRE 17
FROM eclipse-temurin:17-jre
COPY --from=build /server/target/server-0.0.1-SNAPSHOT.jar /server-0.0.1-SNAPSHOT.jar
ENTRYPOINT ["java", "-jar", "/server-0.0.1-SNAPSHOT.jar"]
