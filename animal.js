// AI Animal Face Test Logic
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
const predictBtn = document.getElementById('predict-btn');
const analyzeAction = document.getElementById('analyze-action');
const modelLoader = document.getElementById('model-loader');
const modelFilesInput = document.getElementById('model-files');
const loadModelBtn = document.getElementById('load-model-btn');

// Load the image model
async function init() {
  const URL = "./my_model/";
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  try {
    // Try to load from folder first
    model = await tmImage.load(modelURL, metadataURL);
    onModelLoaded();
  } catch (err) {
    console.warn("Pre-set model not found. Waiting for user upload.");
    modelLoader.style.display = 'block';
    topPredictionElem.innerHTML = `
      <span class="ko">먼저 모델 파일 3개를 로드해 주세요.</span>
      <span class="en">Please load your 3 model files first.</span>
    `;
  }
}

function onModelLoaded() {
  maxPredictions = model.getTotalClasses();
  modelLoader.style.display = 'none';
  topPredictionElem.innerHTML = `
    <span class="ko">모델이 로드되었습니다! 이제 시작할 수 있습니다.</span>
    <span class="en">Model loaded! You can start now.</span>
  `;
  
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
    setupWebcam();
  }
}

async function setupWebcam() {
  if (!model) return;
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
  if (!model) return;
  const prediction = await model.predict(input);
  
  // Sort by probability for top result
  const sorted = [...prediction].sort((a, b) => b.probability - a.probability);
  const top = sorted[0];
  
  if (top.probability > 0.05) {
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
  analyzeAction.style.display = 'none';
  if (!webcam && model) setupWebcam();
});

uploadBtn.addEventListener('click', () => {
  isWebcamMode = false;
  uploadBtn.classList.add('active');
  webcamBtn.classList.remove('active');
  webcamContainer.style.display = 'none';
  imageContainer.style.display = 'flex';
  analyzeAction.style.display = 'block';
  if (webcam) {
    webcam.stop();
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    faceImage.src = event.target.result;
    faceImage.style.display = 'block';
    document.querySelector('.upload-placeholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
});

predictBtn.addEventListener('click', async () => {
  if (!model) {
    alert("Please load the model first!");
    return;
  }
  if (!faceImage.src || faceImage.src.includes('#')) {
    alert("Please upload a photo first!");
    return;
  }
  
  const img = new Image();
  img.src = faceImage.src;
  img.onload = async () => {
    await predict(img);
  };
});

loadModelBtn.addEventListener('click', async () => {
  const files = modelFilesInput.files;
  if (files.length < 3) {
    alert("Please select all 3 files: model.json, metadata.json, weights.bin");
    return;
  }

  let modelFile, metadataFile, weightsFile;
  for (const file of files) {
    if (file.name === 'model.json') modelFile = file;
    else if (file.name === 'metadata.json') metadataFile = file;
    else if (file.name === 'weights.bin') weightsFile = file;
  }

  if (modelFile && metadataFile && weightsFile) {
    try {
      topPredictionElem.textContent = "Loading model...";
      model = await tmImage.loadFromFiles(modelFile, metadataFile, weightsFile);
      onModelLoaded();
    } catch (err) {
      console.error(err);
      alert("Error loading files. Make sure they are correct.");
    }
  } else {
    alert("Required files are missing. Need model.json, metadata.json, and weights.bin");
  }
});

// Initialize
init();
