#!/bin/bash

# --- Configuration ---
APP_COMPOSE="docker-compose.local.staging.yml"
MONITOR_COMPOSE="docker-compose.monitoring.yml"
TEST_SCRIPT="./performance-tests/tests/browse_test.js"
NETWORK_NAME="app-net"

# --- Colors ---
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}1. Starting SwapStreet (Local Staging) + Monitoring...${NC}"
docker compose -f $APP_COMPOSE -f $MONITOR_COMPOSE up -d

echo -e "${BLUE}2. Waiting for Backend to be healthy...${NC}"
# Simple wait loop for the C# API
sleep 5 

echo -e "${GREEN}3. Launching k6 Load Test...${NC}"
docker run --rm \
  --network $NETWORK_NAME \
  -v $(pwd)/performance-tests:/io \
  loadimpact/k6 run \
  -o experimental-prometheus-rw=http://monitoring-prometheus:9090/api/v1/write \
  /io/tests/$(basename $TEST_SCRIPT)

echo -e "${BLUE}Test finished. View results at http://localhost:3000${NC}"