const hazardNav = document.getElementById("hazardNav");
const hazardLinks = Array.from(hazardNav.querySelectorAll("a"));
const phaseTimeline = document.getElementById("phaseTimeline");
const timelineLinks = Array.from(phaseTimeline.querySelectorAll("a"));
const stages = document.querySelectorAll(".guide-stage");
const printGuide = document.getElementById("printGuide");

const timelineImagePrefixes = {
    earthquakes: "earthquake",
    landslides: "landslide",
    subsidence: "sinkhole",
    tsunamis: "tsunami",
    flooding: "flooding"
};

let activeHazardLink;

function showSafetyGuide(selectedLink) {
    if (selectedLink === activeHazardLink) return;

    for (const link of hazardLinks) {
        const panel = document.getElementById(link.hash.slice(1));
        const selected = link === selectedLink;

        panel.hidden = !selected;
        panel.classList.toggle("is-active", selected);

        if (selected) {
            link.setAttribute("aria-current", "location");
        } else {
            link.removeAttribute("aria-current");
        }
    }

    const hazard = selectedLink.hash.slice(1);
    const imagePrefix = timelineImagePrefixes[hazard];

    for (const link of timelineLinks) {
        const stage = link.dataset.stage;
        link.href = selectedLink.hash + "-" + stage;

        const image = link.querySelector("img");
        const path = "images/" + imagePrefix + "-" + stage + ".png";

        if (image.getAttribute("src") !== path) {
            image.hidden = true;
            image.src = path;
        }
    }

    activeHazardLink = selectedLink;
}

function showGuideFromUrl() {
    const target = document.getElementById(window.location.hash.slice(1));
    const panel = target?.closest(".guide-panel");
    const hazardLink = hazardLinks.find(link => link.hash === "#" + panel?.id);

    if (hazardLink) {
        showSafetyGuide(hazardLink);
    } else if (!window.location.hash || !activeHazardLink) {
        showSafetyGuide(hazardLinks[0]);
    }

    for (const link of timelineLinks) {
        if (link.hash === window.location.hash) {
            link.setAttribute("aria-current", "location");
        } else {
            link.removeAttribute("aria-current");
        }
    }

    for (const stage of stages) {
        stage.classList.toggle("is-current", stage === target);
    }
}

function openGuideLink(event) {
    const link = event.target.closest("a");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    event.preventDefault();

    const hash = link.hash;
    if (window.location.hash !== hash) {
        window.history.pushState(null, "", hash);
    }

    showGuideFromUrl();

    const target = document.getElementById(hash.slice(1));
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
}

for (const link of timelineLinks) {
    const image = link.querySelector("img");

    image.addEventListener("load", () => {
        image.hidden = false;
    });

    image.addEventListener("error", () => {
        image.hidden = true;
    });

    image.loading = "eager";

    if (image.complete && !image.naturalWidth) image.hidden = true;
}

hazardNav.addEventListener("click", openGuideLink);
phaseTimeline.addEventListener("click", openGuideLink);
window.addEventListener("popstate", showGuideFromUrl);
window.addEventListener("hashchange", showGuideFromUrl);

printGuide.addEventListener("click", () => window.print());
printGuide.hidden = false;

showGuideFromUrl();