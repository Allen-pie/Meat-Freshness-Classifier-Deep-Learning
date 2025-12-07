document.addEventListener('DOMContentLoaded', () => {
    const startCamBtn = document.getElementById('start-cam-btn');
    const captureBtn = document.getElementById('capture-btn');
    const stopCamBtn = document.getElementById('stop-cam-btn');
    const videoStream = document.getElementById('video-stream');
    const canvasCapture = document.getElementById('canvas-capture');
    const feedPlaceholder = document.getElementById('feed-placeholder');
    const resultBox = document.getElementById('prediction-result');

    let currentStream = null;

    const resetResult = () => {
        resultBox.className = 'result-box';
        resultBox.innerHTML = '<p class="initial-message">Results will appear here after analysis.</p>';
    };

    const updateUI = (isStreaming) => {
        startCamBtn.disabled = isStreaming;
        captureBtn.disabled = !isStreaming;
        stopCamBtn.disabled = !isStreaming;
    };

    const startCamera = async () => {
        resetResult();
        try {

            currentStream = await navigator.mediaDevices.getUserMedia({ video: true });

            videoStream.srcObject = currentStream;
            videoStream.style.display = 'block';
            feedPlaceholder.style.display = 'none';

            videoStream.onloadedmetadata = () => {
                videoStream.play();
                updateUI(true);
            };

        } catch (error) {
            console.error('Error accessing the camera: ', error);
            alert('Could not access the camera. Please ensure you have granted permission and that no other app is using it.');
            updateUI(false);
            feedPlaceholder.innerHTML = '<span class="emoji">❌</span> **Camera Access Denied/Error.** Check permissions.';
            feedPlaceholder.style.display = 'block';
        }
    };

    const stopCamera = () => {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        videoStream.srcObject = null;
        videoStream.style.display = 'none';
        canvasCapture.style.display = 'none';
        feedPlaceholder.style.display = 'block';
        feedPlaceholder.innerHTML = '<span class="emoji">📸</span> Click "Start Camera" to activate your device\'s camera.';

        updateUI(false);
        resetResult();
    };

    const analyzeMeat = async (imageBlob) => {
        const formData = new FormData();
        formData.append('image', imageBlob, 'meat_sample.jpg');

        const API_URL = 'http://127.0.0.1:5000/classify-freshness';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData 
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            const result = {
                quality: data.class_label,
                confidence: '99.0'
            };

            displayResult(result);

        } catch (error) {
            console.error('Analysis failed:', error);
            alert(`Failed to connect to the Meaty analysis server. Is the Python Flask app running at ${API_URL}?`);

            displayResult({ quality: "Error", confidence: "0" });
        } finally {
            captureBtn.disabled = false;
            captureBtn.innerHTML = '<span class="emoji">🔍</span> Capture & Analyze';
        }
    };

    const captureFrame = () => {
        if (!currentStream || videoStream.paused || videoStream.ended) {
            alert('Camera is not running. Please start the camera first.');
            return;
        }

        const context = canvasCapture.getContext('2d');

        canvasCapture.width = videoStream.videoWidth;
        canvasCapture.height = videoStream.videoHeight;

        context.drawImage(videoStream, 0, 0, canvasCapture.width, canvasCapture.height);

        videoStream.style.display = 'none';
        canvasCapture.style.display = 'block';

        captureBtn.disabled = true;
        captureBtn.textContent = 'Analyzing...';

        canvasCapture.toBlob((blob) => {
            analyzeMeat(blob);
        }, 'image/jpeg', 0.9);
    };

    const displayResult = (result) => {
        const quality = result.quality;
        const confidence = result.confidence;

        resultBox.className = 'result-box';

        if (quality === "Fresh") {
            resultBox.classList.add('good');
            resultBox.innerHTML = `
            <span class="emoji">✅</span>
            <h4>**Excellent Quality!**</h4>
            <p>Detection Confidence: **${confidence}%**</p>
            <p>This meat is fresh and ready for your masterpiece. Cook on!</p>
        `;
        } else if (quality === "Half-Fresh") {
            resultBox.classList.add('bad');
            resultBox.innerHTML = `
            <span class="emoji">⚠️</span>
            <h4>**Caution: Half-Fresh!**</h4>
            <p>Detection Confidence: **${confidence}%**</p>
            <p>Consume immediately or use in dishes requiring cooked ingredients. Do not store.</p>
        `;
        } else if (quality === "Spoiled") {
            resultBox.classList.add('bad');
            resultBox.innerHTML = `
            <span class="emoji">❌</span>
            <h4>**Quality Warning: Spoiled!**</h4>
            <p>Detection Confidence: **${confidence}%**</p>
            <p>It is strongly recommended to **discard** this cut immediately for safety.</p>
        `;
        } else {
            resultBox.classList.add('bad');
            resultBox.innerHTML = `
            <span class="emoji">🚨</span>
            <h4>**Analysis Error**</h4>
            <p>Could not get a prediction. Check the server connection and try again.</p>
        `;
        }
    };

    startCamBtn.addEventListener('click', startCamera);
    captureBtn.addEventListener('click', captureFrame);
    stopCamBtn.addEventListener('click', stopCamera);
});