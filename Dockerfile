FROM node:22-bookworm-slim AS node

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

WORKDIR /src
COPY . .
RUN dotnet publish Backend/src/PcBuilderBackend.Api/PcBuilderBackend.Api.csproj \
    -c Release \
    -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build --chown=$APP_UID:$APP_UID /app/publish .
USER $APP_UID
# 8080 is the published app port. 3000 is Dokploy's default preview port.
ENV ASPNETCORE_URLS=http://+:8080;http://+:3000
EXPOSE 8080
EXPOSE 3000
ENTRYPOINT ["dotnet", "PcBuilderBackend.Api.dll"]
