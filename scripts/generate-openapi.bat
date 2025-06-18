@echo off
cd ../frontend
npx openapi-generator-cli generate -i http://localhost:8000/openapi.json -g typescript-angular -o src/openapi-client
