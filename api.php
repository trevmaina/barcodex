<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Include database connection
require_once 'database.php';

// Get the request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

error_log("Received $method request with action: $action");

// Handle different actions
switch ($action) {
    case 'create':
        if ($method === 'POST') {
            try {
                // Get JSON data from request body
                $json = file_get_contents('php://input');
                error_log("Received JSON data: " . $json);
                
                $data = json_decode($json, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    error_log("JSON decode error: " . json_last_error_msg());
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid JSON data']);
                    exit;
                }
                
                // Validate required fields
                if (empty($data['barcode']) || empty($data['name'])) {
                    error_log("Missing required fields");
                    http_response_code(400);
                    echo json_encode(['error' => 'Barcode and name are required']);
                    exit;
                }
                
                // Prepare SQL statement
                $sql = "INSERT INTO inventory (barcode, name, item_condition, location) VALUES (:barcode, :name, :item_condition, :location)";
                $stmt = $conn->prepare($sql);
                
                // Bind parameters
                $stmt->bindParam(':barcode', $data['barcode']);
                $stmt->bindParam(':name', $data['name']);
                $stmt->bindParam(':item_condition', $data['item_condition']);
                $stmt->bindParam(':location', $data['location']);
                
                error_log("Executing SQL: " . $sql);
                error_log("With parameters: " . print_r($data, true));
                
                // Execute the statement
                $stmt->execute();
                
                // Get the ID of the inserted row
                $id = $conn->lastInsertId();
                
                error_log("Successfully inserted record with ID: " . $id);
                
                // Return success response
                echo json_encode([
                    'success' => true,
                    'message' => 'Item created successfully',
                    'id' => $id
                ]);
                
            } catch (PDOException $e) {
                error_log("Database error: " . $e->getMessage());
                
                // Check for duplicate entry error
                if ($e->getCode() == 23000) {
                    http_response_code(409);
                    echo json_encode(['error' => 'Item with this barcode already exists']);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
                }
            } catch (Exception $e) {
                error_log("General error: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
    
    case 'getAll':
        if ($method === 'GET') {
            // Get all items
            $stmt = $conn->prepare("SELECT * FROM inventory ORDER BY created_at DESC");
            $stmt->execute();
            $items = $stmt->fetchAll();
            echo json_encode($items);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request']);
        } 
        break;
    
    case 'getByBarcode':
        if ($method === 'GET' && isset($_GET['barcode'])) {
            // Get item by barcode
            $barcode = $_GET['barcode'];
            $stmt = $conn->prepare("SELECT * FROM inventory WHERE barcode = :barcode");
            $stmt->bindParam(':barcode', $barcode);
            $stmt->execute();
            $item = $stmt->fetch();
            
            if ($item) {
                echo json_encode($item);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Item not found']);
            }
                } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request']);
        }
        break;
    
    case 'update':
        if ($method === 'PUT' && isset($_GET['barcode'])) {
            // Update existing item
            $barcode = $_GET['barcode'];
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['name']) || !isset($data['item_condition']) || !isset($data['location'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields']);
                break;
            }
            
            try {
                $stmt = $conn->prepare("UPDATE inventory SET name = :name, item_condition = :item_condition, location = :location WHERE barcode = :barcode");
                $stmt->bindParam(':name', $data['name']);
                $stmt->bindParam(':item_condition', $data['item_condition']);
                $stmt->bindParam(':location', $data['location']);
                $stmt->bindParam(':barcode', $barcode);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    // Get the updated item
                    $stmt = $conn->prepare("SELECT * FROM inventory WHERE barcode = :barcode");
                    $stmt->bindParam(':barcode', $barcode);
                    $stmt->execute();
                    $item = $stmt->fetch();
                    
                    echo json_encode($item);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Item not found']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request']);
        }
        break;
    
    case 'delete':
        if ($method === 'DELETE' && isset($_GET['barcode'])) {
            // Delete item by barcode
            $barcode = $_GET['barcode'];
            
            try {
                $stmt = $conn->prepare("DELETE FROM inventory WHERE barcode = :barcode");
                $stmt->bindParam(':barcode', $barcode);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    echo json_encode(['success' => true, 'message' => 'Item deleted successfully']);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Item not found']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } elseif ($method === 'DELETE' && $action === 'deleteMultiple') {
            // Delete multiple items
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['barcodes']) || !is_array($data['barcodes']) || empty($data['barcodes'])) {
                http_response_code(400);
                echo json_encode(['error' => 'No barcodes provided']);
                break;
            }
            
            try {
                $placeholders = implode(',', array_fill(0, count($data['barcodes']), '?'));
                $stmt = $conn->prepare("DELETE FROM inventory WHERE barcode IN ($placeholders)");
                
                foreach ($data['barcodes'] as $index => $barcode) {
                    $stmt->bindValue($index + 1, $barcode);
                }
                
                $stmt->execute();
                
                echo json_encode(['success' => true, 'message' => 'Items deleted successfully', 'count' => $stmt->rowCount()]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request']);
        }
        break;
    
    case 'search':
        if ($method === 'GET') {
            try {
                $searchTerm = isset($_GET['term']) ? trim($_GET['term']) : '';
                error_log("Searching for term: " . $searchTerm);
                
                if (empty($searchTerm)) {
                    // If no search term, return all items
                    $stmt = $conn->prepare("SELECT * FROM inventory ORDER BY created_at DESC");
                    $stmt->execute();
                } else {
                    // Search in both barcode and name fields
                    $searchTerm = "%{$searchTerm}%";
                    $stmt = $conn->prepare("SELECT * FROM inventory WHERE barcode LIKE :term OR name LIKE :term ORDER BY created_at DESC");
                    $stmt->bindParam(':term', $searchTerm);
                    $stmt->execute();
                }
                
                $items = $stmt->fetchAll();
                echo json_encode($items);
                
            } catch (PDOException $e) {
                error_log("Search error: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
    
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        break;
}

if (isset($_GET['test'])) {
    echo "Database connection successful!";
    exit;
}
?> 