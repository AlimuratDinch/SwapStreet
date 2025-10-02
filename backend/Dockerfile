# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

# Disable Package Source Mapping for all restore/build commands
ENV DOTNET_DISABLE_PACKAGE_SOURCE_MAPPING=true

WORKDIR /src
COPY . .

# Restore packages (mapping disabled via ENV)
RUN dotnet restore

# Publish without restore 
RUN dotnet publish -c Release -o /app --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app ./
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]
