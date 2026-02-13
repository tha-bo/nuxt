#!/bin/bash

# SQLite Database Viewer Script
DB_FILE="dino-park.db"

echo "=== Dino Park Database Viewer ==="
echo ""

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    echo "Error: Database file '$DB_FILE' not found!"
    exit 1
fi

# Function to display menu
show_menu() {
    echo "Choose an option:"
    echo "1. View all tables"
    echo "2. View all dinosaurs"
    echo "3. View active dinosaurs"
    echo "4. View recent events (last 10)"
    echo "5. View all locations with maintenance"
    echo "6. View locations needing maintenance"
    echo "7. Custom SQL query"
    echo "8. Open interactive SQLite shell"
    echo "9. Exit"
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice: " choice
    echo ""

    case $choice in
        1)
            echo "=== All Tables ==="
            sqlite3 "$DB_FILE" ".tables"
            echo ""
            ;;
        2)
            echo "=== All Dinosaurs ==="
            sqlite3 -header -column "$DB_FILE" "SELECT id, name, species, gender, herbivore, current_location, is_active FROM dinosaurs;"
            echo ""
            ;;
        3)
            echo "=== Active Dinosaurs ==="
            sqlite3 -header -column "$DB_FILE" "SELECT id, name, species, current_location, last_fed_at FROM dinosaurs WHERE is_active = 1;"
            echo ""
            ;;
        4)
            echo "=== Recent Events (Last 10) ==="
            sqlite3 -header -column "$DB_FILE" "SELECT kind, dinosaur_id, time FROM dino_events ORDER BY time DESC LIMIT 10;"
            echo ""
            ;;
        5)
            echo "=== All Locations with Maintenance ==="
            sqlite3 -header -column "$DB_FILE" "SELECT location, park_id, maintenance_performed, updated_at FROM locations ORDER BY maintenance_performed DESC;"
            echo ""
            ;;
        6)
            echo "=== Locations Needing Maintenance (not maintained in 7 days) ==="
            sqlite3 -header -column "$DB_FILE" "SELECT location, park_id, maintenance_performed FROM locations WHERE maintenance_performed IS NULL OR maintenance_performed < datetime('now', '-7 days') ORDER BY maintenance_performed ASC;"
            echo ""
            ;;
        7)
            read -p "Enter SQL query: " query
            sqlite3 -header -column "$DB_FILE" "$query"
            echo ""
            ;;
        8)
            echo "Opening SQLite interactive shell..."
            echo "Type .quit to exit"
            sqlite3 "$DB_FILE"
            ;;
        9)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            echo ""
            ;;
    esac
done
