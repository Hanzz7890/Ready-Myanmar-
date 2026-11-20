const riskChoices = document.querySelectorAll(".risk-choice");
const riskPhotos = document.querySelectorAll("[data-risk-photo]");
const riskPanels = Array.from(document.querySelectorAll(".risk-panel"));
let activeRisk = riskPanels[0];

function showRisk() {
    const linkedRisk = riskPanels.find(panel => "#" + panel.id === location.hash);

    if (linkedRisk) {
        activeRisk = linkedRisk;
    } else if (!location.hash) {
        activeRisk = riskPanels[0];
    }

    for (const panel of riskPanels) {
        panel.hidden = panel !== activeRisk;
    }

    for (const photo of riskPhotos) {
        photo.hidden = photo.dataset.riskPhoto !== activeRisk.id;
    }

    for (const choice of riskChoices) {
        if (choice.hash === "#" + activeRisk.id) {
            choice.setAttribute("aria-current", "location");
        } else {
            choice.removeAttribute("aria-current");
        }
    }

    if (linkedRisk) {
        requestAnimationFrame(() => {
            linkedRisk.scrollIntoView({ block: "start" });
            linkedRisk.focus({ preventScroll: true });
        });
    }
}

window.addEventListener("hashchange", showRisk);
showRisk();