document.addEventListener("DOMContentLoaded", () => {
  const startCamBtn = document.getElementById("start-cam-btn");
  const uploadImgBtn = document.getElementById("upload-img-btn");
  const clearImgBtn = document.getElementById("clear-img-btn");

  const analyzingText = document.getElementById("analyzing");

  const imagePreview = document.getElementById("image-preview");
  const feedPlaceholder = document.getElementById("feed-placeholder");

  const resultBox = document.getElementById("prediction-result");

  const cameraInput = document.getElementById("camera-input");

  const cameraFeed = document.querySelector(".camera-feed");

  const resetResult = () => {
    resultBox.className = "result-box";
    resultBox.innerHTML =
      '<p class="initial-message">Results will appear here after analysis.</p>';
  };

  const updateUI = (isStreaming) => {
    startCamBtn.disabled = isStreaming;
    uploadImgBtn.disabled = isStreaming;
  };

  const startCamera = async () => {
    resetResult();
    cameraInput.click();
  };

  const showPreview = (file) => {
    analyzingText.textContent = "Analyzing...";
    const imgURL = URL.createObjectURL(file);
    imagePreview.src = imgURL;
    imagePreview.style.display = "block";

    feedPlaceholder.style.display = "none";
    updateUI(true);
  };

  const uploadImage = () => {
    resetResult();
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = () => {
      const file = fileInput.files[0];
      showPreview(file);
      analyzeMeat(file, "upload");
    };
    fileInput.click();
  };

  const clearImage = () => {
    imagePreview.style.display = "none";
    startCamBtn.disabled = false;
    uploadImgBtn.disabled = false;
    feedPlaceholder.style.display = "block";
    cameraFeed.style.maxHeight = "300px";
    feedPlaceholder.innerHTML = "📷 Start your camera or ⬆️ upload an image.";
    clearImgBtn.disabled = true;
    updateUI(false);
    resetResult();
  };

  const analyzeMeat = async (imageBlob, mode = "cam") => {
    const formData = new FormData();
    formData.append("image", imageBlob, "meat_sample.jpg");
    
    const API_URL = "https://hect1x-meatballs.hf.space/classify-freshness";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      const result = {
        quality: data.class_label,
        confidence: "99.0",
      };

      displayResult(result);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(
        `Failed to connect to the Meaty analysis server. Is the Python Flask app running at ${API_URL}?`
      );

      displayResult({ quality: "Error", confidence: "0" });
    } finally {
      clearImgBtn.disabled = false;
      analyzingText.textContent = "";
    }
  };

  const displayResult = (result) => {
    const quality = result.quality;
    // const confidence = result.confidence;

    resultBox.className = "result-box";

    if (quality === "Fresh") {
      resultBox.classList.add("good");
      // <p>Detection Confidence: **${confidence}%**</p>             <p>Detection Confidence: **${confidence}%**</p>
      resultBox.innerHTML = `   
            <span class="emoji">✅</span>
            <h4>**Fresh Quality!**</h4>
            <p>This meat is fresh and ready for your masterpiece. Cook on!</p>
        `;
    } else if (quality === "Spoiled") {
      resultBox.classList.add("bad");
      resultBox.innerHTML = `
            <span class="emoji">❌</span>
            <h4>**Quality Warning: Spoiled!**</h4>
            <p>It is strongly recommended to **discard** this cut immediately for safety.</p>
        `;
    } else {
      resultBox.classList.add("bad");
      resultBox.innerHTML = `
            <span class="emoji">🚨</span>
            <h4>**Analysis Error**</h4>
            <p>Could not get a prediction. Check the server connection and try again.</p>
        `;
    }
  };

  const onCameraInputChange = () => {
    const file = cameraInput.files[0];
    if (!file) return;

    showPreview(file);
    analyzeMeat(file);
  };

  startCamBtn.addEventListener("click", startCamera);

  uploadImgBtn.addEventListener("click", uploadImage);
  clearImgBtn.addEventListener("click", clearImage);

  cameraInput.addEventListener("change", onCameraInputChange);
});
