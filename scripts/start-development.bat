@echo off
call stop-local.bat
docker compose --env-file ../docker/development.env -f ../docker/development-compose.yml build --no-cache
docker compose --env-file ../docker/development.env -f ../docker/development-compose.yml up -d
