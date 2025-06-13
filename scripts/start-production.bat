@echo off
call stop-local.bat
docker compose --env-file ../docker/production.env -f ../docker/production-compose.yml build --no-cache
docker compose --env-file ../docker/production.env -f ../docker/production-compose.yml up -d
