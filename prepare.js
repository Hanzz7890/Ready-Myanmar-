const posterViewer = document.getElementById("posterViewer");
const posterTitle = document.getElementById("posterTitle");
const posterImage = document.getElementById("posterImage");
const posterViewport = document.getElementById("posterViewport");
const posterUnavailable = document.getElementById("posterUnavailable");
const zoomIn = document.getElementById("zoomIn");
const zoomOut = document.getElementById("zoomOut");
const zoomReset = document.getElementById("zoomReset");
const zoomLevel = document.getElementById("zoomLevel");

let zoom = 100;
let posterButton;

function setPosterZoom(value) {
    zoom = Math.min(300, Math.max(100, value));
    posterViewport.style.setProperty("--poster-size", zoom + "%");
    zoomLevel.textContent = zoom + "%";

    zoomIn.disabled = posterImage.hidden || zoom === 300;
    zoomOut.disabled = posterImage.hidden || zoom === 100;
    zoomReset.disabled = posterImage.hidden || zoom === 100;

    if (zoom === 100) {
        posterViewport.scrollTop = 0;
        posterViewport.scrollLeft = 0;
    }
}

zoomIn.addEventListener("click", () => setPosterZoom(zoom + 25));
zoomOut.addEventListener("click", () => setPosterZoom(zoom - 25));
zoomReset.addEventListener("click", () => setPosterZoom(100));

posterImage.addEventListener("load", () => {
    posterImage.hidden = false;
    posterUnavailable.hidden = true;
    setPosterZoom(zoom);
});

posterImage.addEventListener("error", () => {
    posterImage.hidden = true;
    posterUnavailable.hidden = false;
    setPosterZoom(100);
});

for (const button of document.querySelectorAll("[data-poster-title]")) {
    button.addEventListener("click", () => {
        const thumbnail = button.querySelector("img");

        posterButton = button;
        posterTitle.textContent = button.dataset.posterTitle;
        posterImage.alt = button.dataset.posterTitle;
        posterImage.hidden = true;
        posterUnavailable.hidden = true;
        setPosterZoom(100);

        posterViewer.showModal();
        posterImage.src = thumbnail.currentSrc || thumbnail.src;
    });
}

posterViewer.addEventListener("close", () => {
    posterImage.removeAttribute("src");
    posterButton?.focus();
});