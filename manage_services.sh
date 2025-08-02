#!/bin/bash

# Define services
# Format: "name|directory|port|command"
SERVICES=(
    "API Gateway|services/api-gateway|8000|node server.js"
    "User Web Portal|services/user-web-portal|3000|node server.js"
    "Collision Analysis Service|services/collision-analysis-service|8002|./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8002"
    "Orbital Calculation Engine|services/orbital-calculation-engine|8005|./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8005"
    "Data Ingestion Service|services/data-ingestion-service|8006|node server.js"
    "Notification Service|services/notification-service|8004|node server.js"
)

# Function to stop all services
stop_services() {
    echo "Stopping all services..."
    for service in "${SERVICES[@]}"; do
        IFS='|' read -r name dir port command <<< "$service"
        echo -n "Stopping $name... "
        pid=$(lsof -t -i:$port)
        if [ -n "$pid" ]; then
            kill -9 $pid
            echo "Stopped."
        else
            echo "Not running."
        fi
    done
}

# Function to start all services
start_services() {
    echo "Starting all services..."
    for service in "${SERVICES[@]}"; do
        IFS='|' read -r name dir port command <<< "$service"
        echo "Starting $name on port $port..."
        (cd "$dir" && eval "$command" &)
    done
    echo "All services have been launched in the background."
}

# Main script logic
case "$1" in
    start)
        stop_services
        echo
        start_services
        ;;
    stop)
        stop_services
        ;;
    *)
        echo "Usage: $0 {start|stop}"
        exit 1
        ;;
esac

exit 0
