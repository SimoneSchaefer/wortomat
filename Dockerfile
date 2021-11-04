#
# Build stage
#
FROM maven:3.8.3-openjdk-11 AS build

COPY backend /home/app/backend
COPY frontend /home/app/frontend
COPY pom.xml /home/app/ 
RUN mvn -f /home/app/pom.xml clean install

#
# Package stage
#
FROM openjdk:11-jre-slim
COPY --from=build /home/app/backend/target/backend-0.0.1-SNAPSHOT.jar /usr/local/lib/demo.jar
ENTRYPOINT ["java","-jar","/usr/local/lib/demo.jar"]