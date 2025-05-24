// script.js

// Database implementation using server API
const DB = {
  // API base URL - update this with your domain
  apiUrl: './api.php',
  
  // Initialize database if needed
  init: function() {
    // Nothing needed for server-side implementation
    console.log('Server database initialized');
  },
  
  // Search items in database
  searchItems: async function(searchTerm) {
    try {
      const response = await fetch(`${this.apiUrl}?action=search&term=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching items:', error);
      return [];
    }
  },
  
  // Get all items from database
  getAllItems: async function() {
    try {
      const response = await fetch(`${this.apiUrl}?action=getAll`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  },
  
  // Get item by barcode
  getItemByBarcode: async function(barcode) {
    try {
      const response = await fetch(`${this.apiUrl}?action=getByBarcode&barcode=${encodeURIComponent(barcode)}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching item:', error);
      return null;
    }
  },
  
  // Add new item to database
  addItem: async function(item) {
    try {
      console.log('Sending request to:', `${this.apiUrl}?action=create`);
      console.log('Request data:', item);
      
      const response = await fetch(`${this.apiUrl}?action=create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item)
      });
      
      console.log('Response status:', response.status);
      
      if (response.status === 409) {
        throw new Error('Item with this barcode already exists');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to add item');
      }
      
      const data = await response.json();
      console.log('Server response data:', data);
      return data;
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  },
  
  // Update existing item
  updateItem: async function(barcode, updatedItem) {
    try {
      const response = await fetch(`${this.apiUrl}?action=update&barcode=${encodeURIComponent(barcode)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      
      return true;
    } catch (error) {
      console.error('Error updating item:', error);
      return false;
    }
  },
  
  // Delete item by barcode
  deleteItem: async function(barcode) {
    try {
      const response = await fetch(`${this.apiUrl}?action=delete&barcode=${encodeURIComponent(barcode)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  },
  
  // Delete multiple items by barcodes
  deleteItems: async function(barcodes) {
    try {
      const response = await fetch(`${this.apiUrl}?action=deleteMultiple`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcodes })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete items');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting items:', error);
      return false;
    }
  }
};

// Initialize the database
DB.init();

// Barcode Scanner Class
class BarcodeScanner {
  constructor(options) {
    this.scannerId = options.scannerId;
    this.resultId = options.resultId;
    this.startBtnId = options.startBtnId;
    this.stopBtnId = options.stopBtnId;
    this.uploadBtnId = options.uploadBtnId;
    this.uploadInputId = options.uploadInputId;
    this.loaderId = options.loaderId;
    this.onDetected = options.onDetected || this.defaultOnDetected.bind(this);
    this.scanTimeout = options.scanTimeout || 10000; // Default 10 second timeout
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  // Initialize event listeners for scanner controls
  initEventListeners() {
    document.getElementById(this.startBtnId).addEventListener('click', (e) => {
      e.preventDefault();
      this.startScanner();
    });
    
    document.getElementById(this.stopBtnId).addEventListener('click', (e) => {
      e.preventDefault();
      this.stopScanner();
    });
    
    document.getElementById(this.uploadBtnId).addEventListener('click', (e) => {
      e.preventDefault();
      this.stopScanner();
      document.getElementById(this.uploadInputId).click();
    });
    
    document.getElementById(this.uploadInputId).addEventListener('change', (e) => {
      this.processUploadedImage(e);
    });
  }
  
  // Start the barcode scanner
  startScanner() {
    document.getElementById(this.scannerId).style.display = 'block';
    document.getElementById(this.stopBtnId).style.display = 'inline-block';
    document.getElementById(this.resultId).innerHTML = '';

  Quagga.init(
    {
      inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: document.getElementById(this.scannerId),
        constraints: {
            facingMode: 'environment',
            width: { min: 450 },
            height: { min: 300 },
            aspectRatio: { min: 1, max: 2 }
          },
        },
        locator: {
          patchSize: 'medium',
          halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        frequency: 10,
      decoder: {
        readers: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'codabar_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader',
            'code_93_reader'
          ],
          multiple: false
        },
        locate: true
      },
      (err) => {
      if (err) {
        console.error(err);
          document.getElementById(this.resultId).innerHTML = `
            <div class="error">Error starting scanner: ${err.message || 'Unknown error'}</div>
          `;
        return;
      }
        
      Quagga.start();
    }
  );

    Quagga.onDetected((data) => {
      this.handleBarcodeDetected(data);
    });
  }
  
  // Stop the barcode scanner
  stopScanner() {
  Quagga.stop();
    document.getElementById(this.scannerId).style.display = 'none';
    document.getElementById(this.stopBtnId).style.display = 'none';
  }
  
  // Process an uploaded image for barcode detection
  processUploadedImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        document.getElementById(this.loaderId).style.display = 'block';
        
        // Set a timeout to handle cases where processing takes too long
        const timeoutId = setTimeout(() => {
          Quagga.stop();
          document.getElementById(this.loaderId).style.display = 'none';
          document.getElementById(this.resultId).innerHTML = `
            <div class="error">
              <p>Scan timeout: Unable to detect a barcode in this image.</p>
              <p>Please try another image or ensure the barcode is clearly visible.</p>
            </div>
          `;
        }, this.scanTimeout);
        
        Quagga.decodeSingle(
          {
            src: img.src,
            numOfWorkers: 0,
            inputStream: {
              size: Math.max(img.width, img.height)
            },
            decoder: {
              readers: [
                'code_128_reader',
                'ean_reader',
                'ean_8_reader',
                'code_39_reader',
                'code_39_vin_reader',
                'codabar_reader',
                'upc_reader',
                'upc_e_reader',
                'i2of5_reader',
                'code_93_reader'
              ],
              multiple: false
            },
            locate: true
          },
          (result) => {
            // Clear timeout as we got a result (success or error)
            clearTimeout(timeoutId);
            document.getElementById(this.loaderId).style.display = 'none';
            
            if (result && result.codeResult) {
              this.onDetected({
                codeResult: result.codeResult,
                format: result.codeResult.format
              });
            } else {
              document.getElementById(this.resultId).innerHTML = `
                <div class="error">
                  <p>No barcode detected in image.</p>
                  <p>Please try another image or ensure the barcode is clearly visible.</p>
                </div>
              `;
            }
          }
        );
      };
      img.onerror = () => {
        document.getElementById(this.loaderId).style.display = 'none';
        document.getElementById(this.resultId).innerHTML = `
          <div class="error">
            <p>Error loading image.</p>
            <p>Please check that the file is a valid image format.</p>
          </div>
        `;
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      document.getElementById(this.loaderId).style.display = 'none';
      document.getElementById(this.resultId).innerHTML = `
        <div class="error">
          <p>Error reading file.</p>
          <p>Please try again or select a different file.</p>
        </div>
      `;
    };
    reader.readAsDataURL(file);
  }
  
  // Handle detected barcode
  handleBarcodeDetected(data) {
    this.stopScanner();
    this.onDetected(data);
  }
  
  // Default handler for detected barcodes
  defaultOnDetected(data) {
    const code = data.codeResult.code;
    const format = data.codeResult.format;
    
    document.getElementById(this.resultId).innerHTML = `
      <div>
        <p><strong>Scanned Code:</strong> ${code}</p>
        <p><strong>Barcode Type:</strong> ${format}</p>
      </div>
    `;
  }
}

// Initialize Navigation and Theme
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');
  
  // Hamburger menu functionality
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const navbarMenu = document.getElementById('navbar-menu');
  const overlay = document.getElementById('overlay');
  
  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', () => {
      hamburgerMenu.classList.toggle('active');
      navbarMenu.classList.toggle('active');
      overlay.classList.toggle('active');
      
      // Disable body scroll when menu is open
      if (navbarMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
    
    // Close menu when clicking outside
    overlay.addEventListener('click', () => {
      hamburgerMenu.classList.remove('active');
      navbarMenu.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
  
  // Theme toggle functionality
  const themeToggle = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;
  
  // Function to set theme
  function setTheme(isDark) {
    if (isDark) {
      htmlElement.classList.add('dark-theme');
      htmlElement.classList.remove('light-theme');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
      localStorage.setItem('theme', 'dark');
    } else {
      htmlElement.classList.add('light-theme');
      htmlElement.classList.remove('dark-theme');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
      localStorage.setItem('theme', 'light');
    }
  }
  
  // Check for saved theme preference or use OS preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    setTheme(true);
  } else {
    setTheme(false);
  }
  
  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', () => {
    const isDark = htmlElement.classList.contains('dark-theme');
    setTheme(!isDark);
  });
  
  // Navigation functionality
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetPage = link.getAttribute('data-page');
      
      // Remove active class from all links and pages
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      pages.forEach(page => page.classList.remove('active'));
      
      // Add active class to clicked link and target page
      link.classList.add('active');
      document.getElementById(`${targetPage}-page`).classList.add('active');
      
      // Stop any active scanner when changing pages
      Quagga.stop();
      
      // Close mobile menu if open
      if (hamburgerMenu) {
        hamburgerMenu.classList.remove('active');
        navbarMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
  
  // Set home as active by default
  document.querySelector('[data-page="home"]').classList.add('active');
}

// Helper function to format barcode information
function formatBarcodeInfo(code, format) {
  return `
    <div>
      <p><strong>Scanned Code:</strong> ${code}</p>
      <p><strong>Barcode Type:</strong> ${format}</p>
      <div id="barcode-actions" style="margin-top: 10px;">
        <button id="copy-barcode" class="btn">Copy to Clipboard</button>
      </div>
    </div>
  `;
}

// Initialize home page scanner
function initHomeScanner() {
  const homeScanner = new BarcodeScanner({
    scannerId: 'scanner',
    resultId: 'result',
    startBtnId: 'start-scan',
    stopBtnId: 'stop-scan',
    uploadBtnId: 'upload-button',
    uploadInputId: 'upload-image',
    loaderId: 'loader',
    onDetected: async (data) => {
      const code = data.codeResult.code;
      const format = data.codeResult.format;
      const loader = document.getElementById('loader');
      
      // Show loader while checking database
      loader.style.display = 'block';
      
      try {
        // Get item from database
        const item = await DB.getItemByBarcode(code);
        loader.style.display = 'none';
        
        if (item) {
          // Item found in database
          document.getElementById('result').innerHTML = `
            <div>
              <h3>${item.name}</h3>
              <p><strong>Barcode:</strong> ${item.barcode}</p>
              <p><strong>Condition:</strong> ${item.item_condition}</p>
              <p><strong>Location:</strong> ${item.location}</p>
              <div id="barcode-actions" style="margin-top: 10px;">
                <button id="copy-barcode" class="btn">Copy to Clipboard</button>
              </div>
            </div>
          `;
        } else {
          // Item not found in database
          document.getElementById('result').innerHTML = `
            <div>
              <p><strong>Item not found in database</strong></p>
              ${formatBarcodeInfo(code, format)}
            </div>
          `;
        }
        
        // Initialize copy to clipboard functionality
        document.getElementById('copy-barcode').addEventListener('click', () => {
          navigator.clipboard.writeText(code).then(() => {
            alert('Barcode copied to clipboard!');
          }).catch(err => {
            console.error('Could not copy text: ', err);
          });
        });
      } catch (error) {
        loader.style.display = 'none';
        document.getElementById('result').innerHTML = `
          <div class="error">Error: ${error.message}</div>
        `;
      }
    }
  });
}

// Initialize create page scanner
function initCreateScanner() {
  const createScanner = new BarcodeScanner({
    scannerId: 'create-scanner',
    resultId: 'create-result',
    startBtnId: 'create-scan',
    stopBtnId: 'create-stop-scan',
    uploadBtnId: 'create-upload',
    uploadInputId: 'create-upload-image',
    loaderId: 'create-loader',
    onDetected: async (data) => {
      const code = data.codeResult.code;
      const format = data.codeResult.format;
      const loader = document.getElementById('create-loader');
      
      // Show loader while checking database
      loader.style.display = 'block';
      
      try {
        // Get item from database
        const item = await DB.getItemByBarcode(code);
        loader.style.display = 'none';
        
        if (item) {
          // Item already exists in database
          document.getElementById('create-result').innerHTML = `
            <div>
              <p><strong>Item already exists in database</strong></p>
              <h3>${item.name}</h3>
              <p><strong>Barcode:</strong> ${item.barcode}</p>
              <p><strong>Condition:</strong> ${item.item_condition}</p>
              <p><strong>Location:</strong> ${item.location}</p>
              <div style="margin-top: 10px;">
                <a href="#" class="btn" id="go-to-update">Update this item</a>
              </div>
            </div>
          `;
          
          // Add event listener for the update link
          document.getElementById('go-to-update').addEventListener('click', (e) => {
            e.preventDefault();
            // Switch to update page and fill form
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            
            document.querySelector('[data-page="update"]').classList.add('active');
            document.getElementById('update-page').classList.add('active');
            
            // Fill update form with item data
            document.getElementById('update-barcode').value = item.barcode;
            document.getElementById('update-item-name').value = item.name;
            document.getElementById('update-item_condition').value = item.item_condition;
            document.getElementById('update-location').value = item.location;
            document.getElementById('update-form').style.display = 'block';
          });
          
        } else {
          // New item - fill barcode field and display format info
          document.getElementById('create-result').innerHTML = formatBarcodeInfo(code, format);
          document.getElementById('barcode').value = code;
          document.getElementById('barcode').readOnly = true;
          
          // Initialize copy to clipboard functionality
          document.getElementById('copy-barcode').addEventListener('click', () => {
            navigator.clipboard.writeText(code).then(() => {
              alert('Barcode copied to clipboard!');
            }).catch(err => {
              console.error('Could not copy text: ', err);
            });
          });
        }
      } catch (error) {
        loader.style.display = 'none';
        document.getElementById('create-result').innerHTML = `
          <div class="error">Error: ${error.message}</div>
        `;
      }
    }
  });
  
  // Manual Entry button
  document.getElementById('manual-entry').addEventListener('click', (e) => {
    e.preventDefault();
    
    // Clear scan result and make barcode editable
    document.getElementById('create-result').innerHTML = '';
    document.getElementById('barcode').value = '';
    document.getElementById('barcode').readOnly = false;
    
    // Scroll to form
    document.getElementById('create-form').scrollIntoView({ behavior: 'smooth' });
    
    // Focus on the first field
    document.getElementById('item-name').focus();
  });
  
  // Create form submission handler
  document.getElementById('create-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const item = {
      barcode: document.getElementById('barcode').value,
      name: document.getElementById('item-name').value,
      item_condition: document.getElementById('item_condition').value,
      location: document.getElementById('location').value
    };
    
    console.log('Submitting item:', item);
    
    try {
      const response = await DB.addItem(item);
      console.log('Server response:', response);
      showMessage('Record created successfully!', 'success');
      document.getElementById('create-form').reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      showMessage(error.message || 'Failed to create record', 'error');
    }
  });
}

// Initialize update page scanner
function initUpdateScanner() {
  const updateScanner = new BarcodeScanner({
    scannerId: 'update-scanner',
    resultId: 'update-result',
    startBtnId: 'update-scan',
    stopBtnId: 'update-stop-scan',
    uploadBtnId: 'update-upload',
    uploadInputId: 'update-upload-image',
    loaderId: 'update-loader',
    onDetected: async (data) => {
      const code = data.codeResult.code;
      const format = data.codeResult.format;
      const loader = document.getElementById('update-loader');
      
      // Show loader while checking database
      loader.style.display = 'block';
      
      try {
        // Get item from database
        const item = await DB.getItemByBarcode(code);
        loader.style.display = 'none';
        
        if (item) {
          // Item found - populate form for editing
          document.getElementById('update-result').innerHTML = `
            <div>
              <p><strong>Item found in database</strong></p>
              <p>You can update the details below.</p>
            </div>
          `;
          
          // Clear search results
          document.getElementById('search-results').innerHTML = '';
          
          // Fill form with item data
          document.getElementById('update-barcode').value = item.barcode;
          document.getElementById('update-item-name').value = item.name;
          document.getElementById('update-item_condition').value = item.item_condition;
          document.getElementById('update-location').value = item.location;
          
          // Show the form
          document.getElementById('update-form').style.display = 'block';
          
        } else {
          // Item not found in database
          document.getElementById('update-result').innerHTML = `
            <div>
              <p><strong>Item not found in database</strong></p>
              ${formatBarcodeInfo(code, format)}
              <div style="margin-top: 10px;">
                <a href="#" class="btn" id="go-to-create">Create new item</a>
              </div>
            </div>
          `;
          
          // Hide the form
          document.getElementById('update-form').style.display = 'none';
          
          // Add event listener for the create link
          document.getElementById('go-to-create').addEventListener('click', (e) => {
            e.preventDefault();
            // Switch to create page and fill barcode
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            
            document.querySelector('[data-page="create"]').classList.add('active');
            document.getElementById('create-page').classList.add('active');
            
            // Fill barcode field in create form
            document.getElementById('barcode').value = code;
            document.getElementById('barcode').readOnly = true;
            document.getElementById('create-result').innerHTML = formatBarcodeInfo(code, format);
            
            // Initialize copy to clipboard functionality
            document.getElementById('copy-barcode').addEventListener('click', () => {
              navigator.clipboard.writeText(code).then(() => {
                alert('Barcode copied to clipboard!');
              }).catch(err => {
                console.error('Could not copy text: ', err);
              });
            });
          });
        }
      } catch (error) {
        loader.style.display = 'none';
        document.getElementById('update-result').innerHTML = `
          <div class="error">Error: ${error.message}</div>
        `;
      }
    }
  });
  
  // Search functionality for update page
  document.getElementById('search-update-btn').addEventListener('click', async () => {
    const searchTerm = document.getElementById('update-search').value.trim();
    
    const loader = document.getElementById('update-loader');
    loader.style.display = 'block';
    
    try {
      const items = await DB.searchItems(searchTerm);
      loader.style.display = 'none';
      
      // Clear previous results
      document.getElementById('update-result').innerHTML = '';
      document.getElementById('update-form').style.display = 'none';
      
      // Display search results
      const resultsContainer = document.getElementById('search-results');
      
      if (items.length === 0) {
        resultsContainer.innerHTML = `
          <div class="result-container">
            <p>No items found matching "${searchTerm}".</p>
          </div>
        `;
        return;
      }
      
      let html = `<h3>Search Results (${items.length} items found)</h3>`;
      
      items.forEach(item => {
        html += `
          <div class="record-item">
            <h3>${item.name}</h3>
            <p><strong>Barcode:</strong> ${item.barcode}</p>
            <p><strong>Condition:</strong> ${item.item_condition}</p>
            <p><strong>Location:</strong> ${item.location}</p>
            <div class="record-actions">
              <button class="btn edit-item-btn" data-barcode="${item.barcode}">Edit</button>
            </div>
          </div>
        `;
      });
      
      resultsContainer.innerHTML = html;
      
      // Add event listeners to edit buttons
      document.querySelectorAll('.edit-item-btn').forEach(button => {
        button.addEventListener('click', function() {
          const barcode = this.getAttribute('data-barcode');
          
          // Find the item in filtered items
          const item = items.find(item => item.barcode === barcode);
          
          // Clear search results
          resultsContainer.innerHTML = '';
          
          // Show item found message
          document.getElementById('update-result').innerHTML = `
            <div>
              <p><strong>Item found in database</strong></p>
              <p>You can update the details below.</p>
            </div>
          `;
          
          // Fill form with item data
          document.getElementById('update-barcode').value = item.barcode;
          document.getElementById('update-item-name').value = item.name;
          document.getElementById('update-item_condition').value = item.item_condition;
          document.getElementById('update-location').value = item.location;
          
          // Show the form
          document.getElementById('update-form').style.display = 'block';
          
          // Scroll to form
          document.getElementById('update-form').scrollIntoView({ behavior: 'smooth' });
        });
      });
      
    } catch (error) {
      loader.style.display = 'none';
      document.getElementById('update-result').innerHTML = `
        <div class="error">Error: ${error.message}</div>
      `;
    }
  });
  
  // Also allow pressing Enter to search
  document.getElementById('update-search').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('search-update-btn').click();
    }
  });
  
  // Update form submission handler
  document.getElementById('update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const barcode = document.getElementById('update-barcode').value;
    const updatedItem = {
      name: document.getElementById('update-item-name').value,
      item_condition: document.getElementById('update-item_condition').value,
      location: document.getElementById('update-location').value
    };
    
    try {
      const success = await DB.updateItem(barcode, updatedItem);
      if (success) {
        showMessage('Record updated successfully!', 'success');
        document.getElementById('update-form').style.display = 'none';
        await renderDeleteRecords(); // Refresh the records list
      } else {
        showMessage('Failed to update record', 'error');
      }
    } catch (error) {
      showMessage(error.message || 'Failed to update record', 'error');
    }
  });
}

// Initialize view records page
function initViewRecords() {
  // Function to render all items
  async function renderItems(items) {
    const container = document.getElementById('records-container');
    container.innerHTML = '';
    
    items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'record-item';
      itemElement.innerHTML = `
        <div class="record-header">
          <h3>${item.name}</h3>
          <span class="barcode">${item.barcode}</span>
        </div>
        <div class="record-details">
          <p><strong>Condition:</strong> ${item.item_condition}</p>
          <p><strong>Location:</strong> ${item.location}</p>
          <p><strong>Created:</strong> ${new Date(item.created_at).toLocaleString()}</p>
          <p><strong>Last Updated:</strong> ${new Date(item.updated_at).toLocaleString()}</p>
        </div>
      `;
      container.appendChild(itemElement);
    });
  }
  
  // Search functionality
  document.getElementById('search-records').addEventListener('input', async (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    try {
      const allItems = await DB.getAllItems();
      
      if (!searchTerm) {
        renderItems(allItems);
        return;
      }
      
      const filteredItems = allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        item.barcode.toLowerCase().includes(searchTerm) || 
        item.item_condition.toLowerCase().includes(searchTerm) || 
        item.location.toLowerCase().includes(searchTerm)
      );
      
      renderItems(filteredItems);
    } catch (error) {
      document.getElementById('records-container').innerHTML = `
        <div class="error">Error fetching items: ${error.message}</div>
      `;
    }
  });
  
  // Event listener for the View Records page becoming active
  document.querySelector('[data-page="view"]').addEventListener('click', async () => {
    try {
      const items = await DB.getAllItems();
      renderItems(items);
    } catch (error) {
      document.getElementById('records-container').innerHTML = `
        <div class="error">Error fetching items: ${error.message}</div>
      `;
    }
  });
}

// Initialize delete records page
function initDeleteRecords() {
  // Function to render items in delete page
  async function renderDeleteRecords(searchTerm = '') {
      const container = document.getElementById('delete-records-list');
    container.innerHTML = '';
    
    let items = await DB.getAllItems();
    
    if (searchTerm) {
      searchTerm = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.barcode.toLowerCase().includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm) ||
        item.item_condition.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm)
      );
    }
      
      if (items.length === 0) {
        container.innerHTML = '<p>No items in database</p>';
        document.getElementById('delete-selected').style.display = 'none';
        return;
      }
      
      let html = '';
    items.forEach(item => {
        html += `
          <div class="record-item">
            <div class="checkbox-container">
              <input type="checkbox" class="delete-checkbox" data-barcode="${item.barcode}">
            </div>
            <h3>${item.name}</h3>
            <p><strong>Barcode:</strong> ${item.barcode}</p>
          <p><strong>Condition:</strong> ${item.item_condition}</p>
            <p><strong>Location:</strong> ${item.location}</p>
            <div class="record-actions">
              <button class="btn btn-danger delete-single-item" data-barcode="${item.barcode}" data-name="${item.name}">Delete</button>
            </div>
          </div>
        `;
      });
      
      container.innerHTML = html;
      
      // Add event listeners to individual delete buttons
      document.querySelectorAll('.delete-single-item').forEach(button => {
        button.addEventListener('click', async function() {
          const barcode = this.getAttribute('data-barcode');
          const name = this.getAttribute('data-name');
          
          if (confirm(`Are you sure you want to delete "${name}"?`)) {
            try {
              const success = await DB.deleteItem(barcode);
              
              if (success) {
                document.getElementById('delete-result').innerHTML = `
                  <div style="color: green; font-weight: bold;">
                    Item "${name}" successfully deleted!
                  </div>
                `;
                
                // Refresh the records list
                await renderDeleteRecords(document.getElementById('delete-search-records').value);
              } else {
                document.getElementById('delete-result').innerHTML = `
                  <div style="color: red; font-weight: bold;">
                    Error deleting item. Please try again.
                  </div>
                `;
              }
            } catch (error) {
              document.getElementById('delete-result').innerHTML = `
                <div style="color: red; font-weight: bold;">
                  Error: ${error.message}
                </div>
              `;
            }
          }
        });
      });
      
      // Add change listener to checkboxes
      document.querySelectorAll('.delete-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          updateDeleteSelectedButton();
        });
      });
      
      // Show delete selected button if items are available
      updateDeleteSelectedButton();
  }
  
  // Search functionality for delete page
  document.getElementById('delete-search-records').addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    renderDeleteRecords(searchTerm);
  });
  
  // Function to update the Delete Selected button state
  function updateDeleteSelectedButton() {
    const checkedBoxes = document.querySelectorAll('.delete-checkbox:checked');
    const deleteBtn = document.getElementById('delete-selected');
    
    if (checkedBoxes.length > 0) {
      deleteBtn.textContent = `Delete Selected (${checkedBoxes.length})`;
      deleteBtn.style.display = 'inline-block';
    } else {
      deleteBtn.style.display = 'none';
    }
  }
  
  // Handle delete selected items
  document.getElementById('delete-selected').addEventListener('click', async () => {
    const checkedBoxes = document.querySelectorAll('.delete-checkbox:checked');
    
    if (checkedBoxes.length === 0) return;
    
    const barcodesToDelete = Array.from(checkedBoxes).map(checkbox => 
      checkbox.getAttribute('data-barcode')
    );
    
    if (confirm(`Are you sure you want to delete ${barcodesToDelete.length} item(s)?`)) {
      try {
        const success = await DB.deleteItems(barcodesToDelete);
        
        if (success) {
          document.getElementById('delete-result').innerHTML = `
            <div style="color: green; font-weight: bold;">
              Successfully deleted ${barcodesToDelete.length} item(s)!
            </div>
          `;
          
          // Refresh the records list
          await renderDeleteRecords(document.getElementById('delete-search-records').value);
        } else {
          document.getElementById('delete-result').innerHTML = `
            <div style="color: red; font-weight: bold;">
              Error deleting items. Please try again.
            </div>
          `;
        }
      } catch (error) {
        document.getElementById('delete-result').innerHTML = `
          <div style="color: red; font-weight: bold;">
            Error: ${error.message}
          </div>
        `;
      }
    }
  });
  
  // Event listener for the Delete Records page becoming active
  document.querySelector('[data-page="delete"]').addEventListener('click', async () => {
    // Clear search field and results container
    document.getElementById('delete-search-records').value = '';
    document.getElementById('delete-result').innerHTML = '';
    
    // Load all records
    await renderDeleteRecords();
  });
}

// Initialize the application
function init() {
  // Initialize navigation
  initNavigation();
  
  // Initialize scanners for each page
  initHomeScanner();
  initCreateScanner();
  initUpdateScanner();
  initViewRecords();
  initDeleteRecords();
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', init);
