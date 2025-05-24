<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database connection parameters
$host = 'localhost';
$dbname = 'stands_inventory_db';
$username = 'root';
$password = '';

// Log connection attempt
error_log("Attempting to connect to database: $dbname on $host");

// Create database connection
try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    error_log("Database connection successful");
} catch (PDOException $e) {
    error_log("Connection failed: " . $e->getMessage());
    error_log("Connection parameters - Host: $host, Database: $dbname, Username: $username");
    die(json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage()
    ]));
}

// Function to create the inventory table if it doesn't exist
function createInventoryTable($conn) {
    $sql = "CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        barcode VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(50) NOT NULL,
        item_condition VARCHAR(50),
        location VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_barcode (barcode),
        INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    try {
        error_log("Attempting to create inventory table");
        $conn->exec($sql);
        error_log("Table creation successful or table already exists");
        
        // Verify table exists
        $result = $conn->query("SHOW TABLES LIKE 'inventory'");
        if ($result->rowCount() > 0) {
            error_log("Inventory table verified");
        } else {
            error_log("Warning: Table creation reported success but table not found");
        }
    } catch (PDOException $e) {
        error_log("Error creating table: " . $e->getMessage());
        error_log("SQL: " . $sql);
        die(json_encode([
            'error' => 'Failed to create inventory table',
            'message' => $e->getMessage()
        ]));
    }
}

// Call the function to create the table if needed
createInventoryTable($conn);

// Function to verify database connection
function verifyConnection($conn) {
    try {
        $conn->query("SELECT 1");
        return true;
    } catch (PDOException $e) {
        error_log("Connection verification failed: " . $e->getMessage());
        return false;
    }
}

// Verify connection is still active
if (!verifyConnection($conn)) {
    error_log("Database connection is not active");
    die(json_encode([
        'error' => 'Database connection is not active',
        'message' => 'Please check your database configuration'
    ]));
}
?> 