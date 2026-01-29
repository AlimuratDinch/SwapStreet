#!/bin/bash

# --- 1. Navigation (Crucial for scripts in subfolders) ---
# This line finds the script's folder and moves one level up to the project root
cd "$(dirname "$0")/.." || exit

# --- Configuration ---
# Updated to your specific filename
APP_COMPOSE="docker-compose.local.staging.yml"
MONITOR_COMPOSE="docker-compose.monitoring.yml"
TEST_SCRIPT="./performance-tests/tests/browse_test.js"
NETWORK_NAME="app-net"

# --- Colors ---
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}1. Starting SwapStreet (Local Staging) + Monitoring...${NC}"
# These relative paths now work because of the 'cd' command above
docker compose -f $APP_COMPOSE -f $MONITOR_COMPOSE up -d

echo -e "${BLUE}2. Waiting for Backend to be healthy...${NC}"
# Gives the C# containers time to finish internal migrations/startup
sleep 5 

echo -e "${GREEN}3. Launching k6 Load Test...${NC}"
# We use $(pwd) to ensure the full absolute path is passed to Docker
docker run --rm \
  --network $NETWORK_NAME \
  -v "$(pwd)/performance-tests:/io" \
  loadimpact/k6 run \
  -o experimental-prometheus-rw=http://monitoring-prometheus:9090/api/v1/write \
  /io/tests/$(basename $TEST_SCRIPT)

echo -e "${BLUE}Test finished. View results at http://localhost:3000${NC}"