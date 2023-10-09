# Use the official Maven image to build the application
FROM maven:3.8-openjdk-17 as build
WORKDIR /server
COPY . .
RUN mvn clean install

# Run the application with OpenJDK
FROM openjdk:17
COPY --from=build /server/target/server-0.0.1-SNAPSHOT.jar /server-0.0.1-SNAPSHOT.jar
ENTRYPOINT ["java", "-jar", "/server-0.0.1-SNAPSHOT.jar"]
