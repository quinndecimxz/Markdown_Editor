console.log("Markdown Slides application loaded.");

// HTML elements
const input = document.getElementById("markdownInput");
const viewer = document.getElementById("viewer");

const editorScreen = document.getElementById("editorScreen");
const presentationScreen = document.getElementById("presentationScreen");
const presentationSlide = document.getElementById("presentationSlide");

const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const presentPrev = document.getElementById("presentPrev");
const presentNext = document.getElementById("presentNext");

const slideCounter = document.getElementById("slideCounter");
const presentCounter = document.getElementById("presentCounter");
const saveStatus = document.getElementById("saveStatus");

const STORAGE_KEY = "markdownSlides";

// Application state
let slides = [];
let currentSlide = 0;
let screenMode = "editor";

//Regexp
function splitSlides(text) {
  let result = text.split(/^---$/gm).map((slide) => slide.trim());

  // Remove empty slides at the beginning or end.
  // while (result.length > 1 && result[0] === "") {
  //   result.shift();
  // }

  // while (result.length > 1 && result[result.length - 1] === "") {
  //   result.pop();
  }

  return result.length ? result : [""];
}

// Render the selected slide
function renderSlide() {
  slides = splitSlides(input.value);

  // Keep the index valid if the Markdown changes.
  currentSlide = Math.max(0, Math.min(currentSlide, slides.length - 1));

  const markdown = slides[currentSlide];

  if (typeof marked !== "undefined") {
    const html = marked.parse(markdown);

    viewer.innerHTML = html;
    presentationSlide.innerHTML = html;
  } else {
    viewer.textContent = "Markdown parser failed to load.";
    presentationSlide.textContent = "Markdown parser failed to load.";
  }

  updateControls();
}

// Update counters and button states
function updateControls() {
  const total = slides.length;
  const number = currentSlide + 1;

  slideCounter.textContent = number + " / " + total;
  presentCounter.textContent = number + " / " + total;

  prevButton.disabled = currentSlide === 0;
  presentPrev.disabled = currentSlide === 0;

  nextButton.disabled = currentSlide === total - 1;
  presentNext.disabled = currentSlide === total - 1;
}
// Navigate between slides
function nextSlide() {
  if (currentSlide < slides.length - 1) {
    currentSlide++;
    renderSlide();
    saveData(false);
  }
}

function previousSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    renderSlide();
    saveData(false);
  }
}

prevButton.addEventListener("click", previousSlide);
presentPrev.addEventListener("click", previousSlide);

nextButton.addEventListener("click", nextSlide);
presentNext.addEventListener("click", nextSlide);

// Switch screens without reloading the page
function showPresentation() {
  editorScreen.hidden = true;
  presentationScreen.hidden = false;

  screenMode = "presentation";

  renderSlide();
  saveData(false);
}

function showEditor() {
  presentationScreen.hidden = true;
  editorScreen.hidden = false;

  screenMode = "editor";

  saveData(false);
}

document
  .getElementById("presentationButton")
  .addEventListener("click", showPresentation);

document.getElementById("editButton").addEventListener("click", showEditor);

// Fullscreen
async function toggleFullscreen(element) {
  try {
    if (document.fullscreenElement === element) {
      await document.exitFullscreen();
    } else {
      await element.requestFullscreen();
    }
  } catch (error) {
    console.error("Fullscreen error:", error);
    saveStatus.textContent = "Fullscreen is unavailable.";
  }
}

document.getElementById("editorFullscreen").addEventListener("click", () => {
  toggleFullscreen(editorScreen);
});

document.getElementById("presentFullscreen").addEventListener("click", () => {
  toggleFullscreen(presentationScreen);
});

document.addEventListener("fullscreenchange", () => {
  const isEditorFullscreen = document.fullscreenElement === editorScreen;

  const isPresentationFullscreen =
    document.fullscreenElement === presentationScreen;

  document.getElementById("editorFullscreen").textContent = isEditorFullscreen
    ? "Exit Fullscreen"
    : "Fullscreen";

  document.getElementById("presentFullscreen").textContent =
    isPresentationFullscreen ? "Exit Fullscreen" : "Fullscreen";
});

function saveData(showMessage = true) {
  const data = {
    markdown: input.value,
    currentSlide: currentSlide,
    screenMode: screenMode,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    if (showMessage) {
      saveStatus.textContent = "Saved successfully.";
    }
  } catch (error) {
    console.error("Could not save:", error);
    saveStatus.textContent = "Could not save data.";
  }
}

document.getElementById("saveButton").addEventListener("click", () => {
  saveData();
});

input.addEventListener("input", () => {
  renderSlide();
  saveData(false);
  saveStatus.textContent = "Changes saved automatically.";
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveData();
    return;
  }

  if (event.key === "F11") {
    event.preventDefault();

    const activeScreen = editorScreen.hidden
      ? presentationScreen
      : editorScreen;

    toggleFullscreen(activeScreen);
    return;
  }

  if (event.target.closest("textarea, input, [contenteditable='true']")) {
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    nextSlide();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    previousSlide();
  }
});

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return;
    }

    const data = JSON.parse(saved);

    if (typeof data.markdown === "string") {
      input.value = data.markdown;
    }

    if (Number.isInteger(data.currentSlide)) {
      currentSlide = data.currentSlide;
    }

    if (data.screenMode === "editor" || data.screenMode === "presentation") {
      screenMode = data.screenMode;
    }
  } catch (error) {
    console.error("Could not load saved data:", error);
  }
}

loadData();
renderSlide();

if (screenMode === "presentation") {
  editorScreen.hidden = true;
  presentationScreen.hidden = false;
} else {
  editorScreen.hidden = false;
  presentationScreen.hidden = true;
}

console.log("Markdown Slides init.");
