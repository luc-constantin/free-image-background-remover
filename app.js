import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal@latest/+esm";



const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const processBtn = document.getElementById("processBtn");
const loader = document.getElementById("loader");
const processingMessage = document.getElementById("processingMessage");
const downloadBtn = document.getElementById("downloadBtn");
const newImageBtn = document.getElementById("newImageBtn");
const warningMessage = document.getElementById("warningMessage");

const comparisonLabels = document.getElementById("comparisonLabels");
const sliderContainer = document.getElementById("sliderContainer");
const beforeImg = document.getElementById("beforeImg");
const afterImg = document.getElementById("afterImg");
const sliderHandle = document.getElementById("sliderHandle");
const beforeWrapper = document.getElementById("beforeWrapper");

let selectedFile = null;

/* ----------------------------
   THEME HANDLING
----------------------------- */

// Detect system theme on first load
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

// Apply system theme automatically
if (prefersDark) {
    document.body.dataset.theme = "dark";
    document.getElementById("themeToggle").textContent = "☀️"; // light mode icon
} else {
    document.body.dataset.theme = "";
    document.getElementById("themeToggle").textContent = "🌙"; // dark mode icon
}

// Toggle manually
document.getElementById("themeToggle").onclick = () => {
    const currentTheme = document.body.dataset.theme;

    if (currentTheme === "dark") {
        document.body.dataset.theme = "";
        document.getElementById("themeToggle").textContent = "🌙"; // suggest dark mode
    } else {
        document.body.dataset.theme = "dark";
        document.getElementById("themeToggle").textContent = "☀️"; // suggest light mode
    }
};


/* Drag and drop */
dropZone.onclick = () => fileInput.click();
dropZone.ondragover = e => { e.preventDefault(); dropZone.style.background = "rgba(54,86,232,0.08)"; };
dropZone.ondragleave = () => dropZone.style.background = "";
dropZone.ondrop = e => {
    e.preventDefault();
    dropZone.style.background = "";
    handleFile(e.dataTransfer.files[0]);
};

fileInput.onchange = e => handleFile(e.target.files[0]);

async function handleFile(file) {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
        alert("File too large. Please upload an image under 20 MB.");
        return;
    }

    selectedFile = await autoResize(file);

    preview.src = URL.createObjectURL(selectedFile);
    preview.style.display = "block";

    comparisonLabels.style.display = "none";
    sliderContainer.style.display = "none";
    downloadBtn.style.display = "none";
    newImageBtn.style.display = "none";
    warningMessage.style.display = "none";
    processingMessage.style.display = "none";

    dropZone.style.display = "none";
    processBtn.disabled = false;
}

async function autoResize(file, maxSize = 2048) {
    const img = await createImageBitmap(file);
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    if (scale === 1) return file;

    const canvas = document.createElement("canvas");
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return new Promise(res => canvas.toBlob(res, "image/png"));
}

/* PROCESS IMAGE */
processBtn.onclick = async () => {
    if (!selectedFile) return;

    processBtn.disabled = true;
    loader.style.display = "block";
    processingMessage.style.display = "block";

    try {
        const blob = await removeBackground(selectedFile, {
            model: "isnet_fp16",
            output: { format: "image/png", quality: 1 }
        });

        loader.style.display = "none";
        processingMessage.style.display = "none";

        const url = URL.createObjectURL(blob);

        beforeImg.src = preview.src;
        afterImg.src = url;

        comparisonLabels.style.display = "block";
        sliderContainer.style.display = "block";
        updateSlider(50);

        downloadBtn.style.display = "block";
        downloadBtn.onclick = () => {
            const a = document.createElement("a");
            a.href = url;
            a.download = "removed-bg.png";
            a.click();
        };

        warningMessage.style.display = "block";
        newImageBtn.style.display = "block";
        newImageBtn.onclick = resetUI;

    } catch (err) {
        alert("Error processing image.");
        console.error(err);
    } finally {
        processBtn.disabled = false;
    }
};

function resetUI() {
    preview.style.display = "none";
    sliderContainer.style.display = "none";
    comparisonLabels.style.display = "none";
    downloadBtn.style.display = "none";
    newImageBtn.style.display = "none";
    warningMessage.style.display = "none";

    selectedFile = null;
    fileInput.value = "";
    processBtn.disabled = true;

    dropZone.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* Slider control */
let sliding = false;
sliderHandle.onmousedown = () => sliding = true;
window.onmouseup = () => sliding = false;

window.onmousemove = e => {
    if (!sliding) return;
    const rect = sliderContainer.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    updateSlider(pct);
};

function updateSlider(pct) {
    sliderHandle.style.left = pct + "%";
    beforeWrapper.style.width = pct + "%";
}
