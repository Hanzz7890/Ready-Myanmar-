const checklistKey = "readyMyanmarChecklistV2";
const checklistItems = document.getElementById("checklistItems");
const taskGroups = Array.from(checklistItems.querySelectorAll("[data-category]"));
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const saveStatus = document.getElementById("saveStatus");
const checklistCount = document.getElementById("checklistCount");
const checklistPercent = document.getElementById("checklistPercent");
const checkProgress = document.getElementById("checkProgress");
const progressBar = document.getElementById("progressBar");
const emptyChecklist = document.getElementById("emptyChecklist");
const customItemForm = document.getElementById("customItemForm");
const customItemText = document.getElementById("customItemText");
const customItemCategory = document.getElementById("customItemCategory");
const customTaskTemplate = document.getElementById("customTaskTemplate");
const resetProgress = document.getElementById("resetProgress");
const clearChecklist = document.getElementById("clearChecklist");

function addChecklistRow(group, task) {
    const row = customTaskTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.task = task.id;
    row.querySelector("span").textContent = task.text;
    row.querySelector("input").checked = task.completed === true;

    const removeButton = row.querySelector("button");
    removeButton.setAttribute("aria-label", removeButton.textContent + " " + task.text);

    group.append(row);
    return row;
}

function loadChecklist() {
    try {
        const saved = JSON.parse(localStorage.getItem(checklistKey));
        if (!Array.isArray(saved?.tasks)) return;

        const rowsById = new Map(
            Array.from(checklistItems.querySelectorAll("[data-task]"), row => [row.dataset.task, row])
        );

        for (const task of saved.tasks) {
            if (!task || typeof task.id !== "string") continue;

            const existingRow = rowsById.get(task.id);
            if (existingRow) {
                existingRow.querySelector("input").checked = task.completed === true;
                continue;
            }

            const group = taskGroups.find(item => item.dataset.category === task.category);
            if (group && task.custom === true && typeof task.text === "string" && task.text.trim()) {
                const row = addChecklistRow(group, { ...task, text: task.text.slice(0, 120) });
                rowsById.set(task.id, row);
            }
        }
    } catch {
        saveStatus.textContent = saveStatus.dataset.loadError;
    }
}

function saveChecklist() {
    const tasks = Array.from(checklistItems.querySelectorAll("[data-task]"), row => ({
        id: row.dataset.task,
        text: row.querySelector("span").textContent,
        category: row.closest("[data-category]").dataset.category,
        completed: row.querySelector("input").checked,
        custom: row.hasAttribute("data-custom")
    }));

    try {
        localStorage.setItem(checklistKey, JSON.stringify({ tasks }));
        saveStatus.textContent = saveStatus.dataset.saved;
    } catch {
        saveStatus.textContent = saveStatus.dataset.saveError;
    }
}

function updateChecklistProgress() {
    const total = checklistItems.querySelectorAll('input[type="checkbox"]').length;
    const completed = checklistItems.querySelectorAll("input:checked").length;
    const percent = Math.round(completed / total * 100);

    checklistCount.textContent = completed + " of " + total + " items completed";
    checklistPercent.textContent = percent + "%";
    checkProgress.setAttribute("aria-valuenow", percent);
    progressBar.style.width = percent + "%";
}

function applyChecklistFilters() {
    let anyVisible = false;

    for (const group of taskGroups) {
        const categoryMatches = categoryFilter.value === "all" || categoryFilter.value === group.dataset.category;
        let groupVisible = false;

        for (const row of group.querySelectorAll("[data-task]")) {
            const checked = row.querySelector("input").checked;
            const statusMatches = statusFilter.value === "all" ||
                (statusFilter.value === "completed" && checked) ||
                (statusFilter.value === "remaining" && !checked);

            row.hidden = !(categoryMatches && statusMatches);
            if (!row.hidden) groupVisible = true;
        }

        group.hidden = !groupVisible;
        if (groupVisible) anyVisible = true;
    }

    emptyChecklist.hidden = anyVisible;
}

function updateChecklist() {
    saveChecklist();
    updateChecklistProgress();
    applyChecklistFilters();
}

categoryFilter.addEventListener("change", applyChecklistFilters);
statusFilter.addEventListener("change", applyChecklistFilters);

checklistItems.addEventListener("change", event => {
    const row = event.target.closest("[data-task]");
    updateChecklist();

    if (row.hidden) {
        const nextCheckbox = row.parentElement.querySelector("[data-task]:not([hidden]) input");
        (nextCheckbox || statusFilter).focus();
    }
});

checklistItems.addEventListener("click", event => {
    const button = event.target.closest(".remove-task");
    if (!button) return;

    button.closest("[data-task]").remove();
    updateChecklist();
    customItemText.focus();
});

customItemText.addEventListener("input", () => customItemText.setCustomValidity(""));

customItemForm.addEventListener("submit", event => {
    event.preventDefault();
    const text = customItemText.value.trim();

    if (text.length < 2) {
        customItemText.setCustomValidity(customItemText.dataset.invalid);
        customItemText.reportValidity();
        return;
    }

    const group = taskGroups.find(item => item.dataset.category === customItemCategory.value);
    const id = "custom-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    addChecklistRow(group, { id, text, completed: false });

    customItemText.value = "";
    categoryFilter.value = "all";
    statusFilter.value = "all";
    updateChecklist();
    customItemText.focus();
});

for (const button of [resetProgress, clearChecklist]) {
    button.addEventListener("click", () => {
        if (!window.confirm(button.dataset.confirm)) return;

        if (button === clearChecklist) {
            for (const row of checklistItems.querySelectorAll("[data-custom]")) {
                row.remove();
            }

            categoryFilter.value = "all";
            statusFilter.value = "all";
        }

        for (const checkbox of checklistItems.querySelectorAll("input:checked")) {
            checkbox.checked = false;
        }

        updateChecklist();
    });
}

document.getElementById("printChecklist").addEventListener("click", () => window.print());

loadChecklist();
updateChecklistProgress();
applyChecklistFilters();