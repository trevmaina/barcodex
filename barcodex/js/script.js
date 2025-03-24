let productDatabase = null;
let currentCamera = 'environment';

// Load product database
fetch('../data/products.json')
    .then(response => response.json())
    .then(data => {
        productDatabase = data.products;
    })
    .catch(error => console.error('Error loading product database:', error));

// UI Elements
const landingPage = document.getElementById('landing-page');
const scannerInterface = document.getElementById('scanner-interface');
const manualInterface = document.getElementById('manual-interface');
const resultContainer = document.getElementById('result');

// Button Event Listeners
document.getElementById('start-scan').addEventListener('click', startScanning);
document.getElementById('stop-scan').addEventListener('click', stopScanning);
document.getElementById('manual-entry').addEventListener('click', showManualEntry);
document.getElementById('back-to-landing').addEventListener('click', showLandingPage);
document.getElementById('switch-camera').addEventListener('click', switchCamera);

function showLandingPage() {
    landingPage.classList.remove('hidden');
    scannerInterface.classList.add('hidden');
    manualInterface.classList.add('hidden');
    resultContainer.classList.add('hidden');
    stopScanning();
}

function startScanning() {
    landingPage.classList.add('hidden');
    scannerInterface.classList.remove('hidden');
    resultContainer.classList.remove('hidden');
    
    initializeScanner();
}

function stopScanning() {
    if (Quagga.isInitialized()) {
        Quagga.stop();
    }
    showLandingPage();
}

function showManualEntry() {
    landingPage.classList.add('hidden');
    manualInterface.classList.remove('hidden');
    resultContainer.classList.remove('hidden');
}

function switchCamera() {
    currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
    if (Quagga.isInitialized()) {
        Quagga.stop();
        initializeScanner();
    }
}

function initializeScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#interactive"),
            constraints: {
                facingMode: currentCamera
            },
        },
        decoder: {
            readers: [
                "code_128_reader",
                "code_39_reader",
                "ean_reader",
                "ean_8_reader",
                "upc_reader",
                "upc_e_reader"
            ],
            multiple: false
        }
    }, function(err) {
        if (err) {
            console.error(err);
            document.getElementById('product-info').innerHTML = 
                '<p class="error">Error: Camera initialization failed. Please make sure you have granted camera permissions.</p>';
        } else {
            Quagga.start();
        }
    });

    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        searchProduct(code);
    });
}

function searchProduct(code) {
    const productInfo = document.getElementById('product-info');
    
    if (!productDatabase) {
        productInfo.innerHTML = '<p class="error">Error: Product database not loaded</p>';
        return;
    }
    
    const product = productDatabase.find(p => 
        p.barcode.toLowerCase() === code.toLowerCase()
    );
    
    if (product) {
        productInfo.innerHTML = `
            <p><strong>Name:</strong> ${product.name}</p>
            <p><strong>Description:</strong> ${product.description}</p>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Barcode:</strong> ${product.barcode}</p>
        `;
    } else {
        productInfo.innerHTML = `
            <p class="error">Product not found in database</p>
            <p>Scanned code: ${code}</p>
        `;
    }
}

function searchManualBarcode() {
    const input = document.getElementById('manual-barcode');
    const code = input.value.trim();
    
    if (code) {
        searchProduct(code);
        input.value = '';
    }
}

// Initialize with landing page view
showLandingPage();

// Theme switching functionality
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);

// Update button icon based on current theme
function updateThemeIcon() {
    themeToggle.textContent = htmlElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
}
updateThemeIcon();

// Theme toggle handler
themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
});

// Create camera controller instance
const cameraController = new CameraController();

// Update the startScanning function
function startScanning() {
    landingPage.classList.add('hidden');
    scannerInterface.classList.remove('hidden');
    resultContainer.classList.remove('hidden');
    
    // Use camera controller instead of direct Quagga initialization
    cameraController.initialize().then(success => {
        if (success) {
            initializeScanner();
        } else {
            document.getElementById('product-info').innerHTML = 
                '<p class="error">Failed to initialize camera. Please check permissions.</p>';
        }
    });
}

// Update the stopScanning function
function stopScanning() {
    if (Quagga.isInitialized()) {
        Quagga.stop();
    }
    // Add this line to properly stop the camera
    cameraController.stopCamera();
    showLandingPage();
}

// Update the switchCamera function
function switchCamera() {
    cameraController.switchCamera().then(() => {
        if (Quagga.isInitialized()) {
            Quagga.stop();
            initializeScanner();
        }
    });
}