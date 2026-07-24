# 1. Etapa de Build (Compila o Java usando Maven)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copia os arquivos de configuração do Maven e o código fonte
COPY pom.xml .
COPY src ./src

# Gera o arquivo .jar limpando os testes
RUN mvn clean package -DskipTests

# 2. Etapa de Execução (Roda o .jar leve)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copia o .jar gerado na etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Expõe a porta em que a aplicação roda
EXPOSE 8083

# Comando para subir o Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]
