# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

# Disable Package Source Mapping for all restore/build commands
ENV DOTNET_DISABLE_PACKAGE_SOURCE_MAPPING=true

WORKDIR /src

# Copy everything from the repo root (since backend is a subfolder)
COPY . .

# Restore dependencies using correct relative path
RUN dotnet restore backend/backend.csproj

# Publish the app
RUN dotnet publish backend/backend.csproj -c Release -o /app --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app ./
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]
