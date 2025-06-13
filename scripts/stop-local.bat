@echo off
docker compose --env-file ../docker/development.env -f ../docker/development-compose.yml down --remove-orphans
docker compose --env-file ../docker/production.env -f ../docker/production-compose.yml down --remove-orphans
docker image prune -a -f
docker volume prune -f
