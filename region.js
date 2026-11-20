const regionPanels = Array.from(document.querySelectorAll(".region-panel"));
const regionChoices = Array.from(document.querySelectorAll(".place-link"));
const hazardPhotos = document.querySelectorAll("[data-hazard-photo]");
const regionMap = document.getElementById("myanmarMap");
const mapShapes = document.getElementById("mapShapes");
let activeRegion = document.getElementById("yangon");

function markSelected(link, selected) {
    if (selected) {
        link.setAttribute("aria-current", "location");
    } else {
        link.removeAttribute("aria-current");
    }
}

function showRegion(scroll) {
    const linkedRegion = regionPanels.find(panel => "#" + panel.id === location.hash);

    if (linkedRegion) {
        activeRegion = linkedRegion;
    } else if (!location.hash) {
        activeRegion = document.getElementById("yangon");
    }

    for (const panel of regionPanels) {
        panel.hidden = panel !== activeRegion;
    }

    for (const photo of hazardPhotos) {
        photo.hidden = photo.dataset.hazardPhoto !== activeRegion.dataset.hazardKind;
    }

    for (const choice of regionChoices) {
        markSelected(choice, choice.hash === "#" + activeRegion.id);
    }

    for (const area of regionMap.querySelectorAll("[data-map-region]")) {
        markSelected(area, area.dataset.mapRegion === activeRegion.id);
    }

    if (scroll && linkedRegion) {
        linkedRegion.scrollIntoView({ block: "start" });
        linkedRegion.focus({ preventScroll: true });
    }
}

async function loadRegionMap() {
    const response = await fetch("myanmar-regions.svg");

    if (!response.ok) {
        throw new Error("Could not read the map.");
    }

    const xml = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
    const paths = xml.querySelectorAll("#features path[name]");
    const svgNamespace = regionMap.namespaceURI;

    for (const path of paths) {
        const region = path.getAttribute("name").trim().toLowerCase();
        const choice = regionChoices.find(link => link.hash === "#" + region);

        if (!choice) continue;

        const area = document.createElementNS(svgNamespace, "a");
        const shape = document.createElementNS(svgNamespace, "path");
        const title = document.createElementNS(svgNamespace, "title");
        const name = choice.querySelector("strong").textContent;

        area.setAttribute("class", "map-area");
        area.setAttribute("href", choice.hash);
        area.setAttribute("tabindex", "0");
        area.setAttribute("aria-label", name);
        area.dataset.mapRegion = region;
        title.textContent = name;
        shape.setAttribute("d", path.getAttribute("d"));

        area.append(title, shape);
        mapShapes.append(area);
    }

    if (mapShapes.children.length !== regionChoices.length - 1) {
        throw new Error("The map is missing a state or region.");
    }

    regionMap.removeAttribute("hidden");

    const bounds = mapShapes.getBBox();
    const padding = 15;

    regionMap.setAttribute("viewBox", [
        bounds.x - padding,
        bounds.y - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2
    ].join(" "));

    document.getElementById("mapLoading").hidden = true;
    document.getElementById("mapKey").hidden = false;
    showRegion(false);
}

window.addEventListener("hashchange", () => showRegion(true));
showRegion(true);

loadRegionMap().catch(() => {
    regionMap.setAttribute("hidden", "");
    document.getElementById("mapLoading").hidden = true;
    document.getElementById("mapError").hidden = false;
});