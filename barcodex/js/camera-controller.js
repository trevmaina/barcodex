class CameraController {
    constructor() {
        this.stream = null;
        this.activeCamera = 'environment';
        this.flashlightOn = false;
        this.scanning = false;
        this.availableCameras = [];
    }

    async initialize() {
        try {
            // Get list of available cameras
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableCameras = devices.filter(device => device.kind === 'videoinput');
            
            await this.startCamera();
            return true;
        } catch (error) {
            console.error('Camera initialization failed:', error);
            return false;
        }
    }

    async startCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: this.activeCamera,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    focusMode: 'continuous'
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            const videoElement = document.querySelector('#scanner-video');
            videoElement.srcObject = this.stream;
            
            // Add active class for animation
            document.querySelector('.viewport').classList.add('active');
            this.scanning = true;

            // Start scanning animation
            this.startScanningAnimation();

            return true;
        } catch (error) {
            console.error('Failed to start camera:', error);
            return false;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            
            // Remove active class
            document.querySelector('.viewport').classList.remove('active');
            this.scanning = false;

            // Stop scanning animation
            this.stopScanningAnimation();
        }
    }

    async toggleFlashlight() {
        if (!this.stream) return;

        try {
            const track = this.stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            
            if (capabilities.torch) {
                await track.applyConstraints({
                    advanced: [{ torch: !this.flashlightOn }]
                });
                this.flashlightOn = !this.flashlightOn;
                
                // Update UI
                const flashButton = document.querySelector('#flash-toggle');
                flashButton.classList.toggle('active');
            }
        } catch (error) {
            console.error('Flashlight toggle failed:', error);
        }
    }

    async switchCamera() {
        this.activeCamera = this.activeCamera === 'environment' ? 'user' : 'environment';
        
        if (this.scanning) {
            this.stopCamera();
            await this.startCamera();
        }
    }

    startScanningAnimation() {
        const viewport = document.querySelector('.viewport');
        const scanLine = document.createElement('div');
        scanLine.className = 'scan-line';
        viewport.appendChild(scanLine);
    }

    stopScanningAnimation() {
        const scanLine = document.querySelector('.scan-line');
        if (scanLine) {
            scanLine.remove();
        }
    }

    // Add zoom control if supported
    async setZoom(zoomLevel) {
        if (!this.stream) return;

        try {
            const track = this.stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            
            if (capabilities.zoom) {
                await track.applyConstraints({
                    advanced: [{ zoom: zoomLevel }]
                });
            }
        } catch (error) {
            console.error('Zoom control failed:', error);
        }
    }
} 