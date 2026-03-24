// AI Animal Face Test Logic
const URL = "./my_model/";

let model, webcam, labelContainer, maxPredictions;
let isWebcamMode = true;

// DOM Elements
const webcamBtn = document.getElementById('webcam-btn');
const uploadBtn = document.getElementById('upload-btn');
const webcamContainer = document.getElementById('webcam-container');
const imageContainer = document.getElementById('image-container');
const fileInput = document.getElementById('file-input');
const faceImage = document.getElementById('face-image');
const topPredictionElem = document.getElementById('top-prediction');
const labelContainerElem = document.getElementById('label-container');

// Load the image model
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  try {
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    
    // Create label structure
    labelContainerElem.innerHTML = '';
    for (let i = 0; i < maxPredictions; i++) {
      const barWrapper = document.createElement('div');
      barWrapper.className = 'result-bar-wrapper';
      barWrapper.innerHTML = `
        <div class="result-label">
          <span class="class-name">...</span>
          <span class="class-prob">0%</span>
        </div>
        <div class="progress-bg">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
      `;
      labelContainerElem.appendChild(barWrapper);
    }

    if (isWebcamMode) {
      await setupWebcam();
    }
  } catch (err) {
    console.error("Model loading failed:", err);
    topPredictionElem.innerHTML = `
      <span class="ko">모델을 찾을 수 없습니다. (/my_model/ 확인)</span>
      <span class="en">Model not found. (Check /my_model/ folder)</span>
    `;
  }
}

async function setupWebcam() {
  const flip = true; 
  webcam = new tmImage.Webcam(400, 400, flip);
  await webcam.setup();
  await webcam.play();
  window.requestAnimationFrame(loop);
  
  webcamContainer.innerHTML = '';
  webcamContainer.appendChild(webcam.canvas);
}

async function loop() {
  if (isWebcamMode && webcam && webcam.canvas) {
    webcam.update();
    await predict(webcam.canvas);
    window.requestAnimationFrame(loop);
  }
}

async function predict(input) {
  const prediction = await model.predict(input);
  
  // Sort by probability for top result
  const sorted = [...prediction].sort((a, b) => b.probability - a.probability);
  const top = sorted[0];
  
  if (top.probability > 0.1) {
    topPredictionElem.innerHTML = `
      <span class="ko">당신은 '${top.className}'상 입니다!</span>
      <span class="en">You look like a ${top.className}!</span>
    `;
  }

  // Update bars
  for (let i = 0; i < maxPredictions; i++) {
    const classPred = prediction[i];
    const percentage = (classPred.probability * 100).toFixed(0);
    const bar = labelContainerElem.childNodes[i];
    
    bar.querySelector('.class-name').textContent = classPred.className;
    bar.querySelector('.class-prob').textContent = `${percentage}%`;
    bar.querySelector('.progress-fill').style.width = `${percentage}%`;
    
    // Highlight top result
    if (classPred.className === top.className) {
      bar.classList.add('is-top');
    } else {
      bar.classList.remove('is-top');
    }
  }
}

// UI Event Listeners
webcamBtn.addEventListener('click', () => {
  isWebcamMode = true;
  webcamBtn.classList.add('active');
  uploadBtn.classList.remove('active');
  webcamContainer.style.display = 'block';
  imageContainer.style.display = 'none';
  if (!webcam) setupWebcam();
});

uploadBtn.addEventListener('click', () => {
  isWebcamMode = false;
  uploadBtn.classList.add('active');
  webcamBtn.classList.remove('active');
  webcamContainer.style.display = 'none';
  imageContainer.style.display = 'flex';
  if (webcam) {
    webcam.stop();
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    faceImage.src = event.target.result;
    faceImage.style.display = 'block';
    document.querySelector('.upload-placeholder').style.display = 'none';
    
    // Analyze image
    const img = new Image();
    img.src = event.target.result;
    img.onload = async () => {
      await predict(img);
    };
  };
  reader.readAsDataURL(file);
});

// Initialize
init();
