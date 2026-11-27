const contactForm = document.getElementById("contactForm");
const contactMessage = document.getElementById("contactMessage");
const contactDraft = document.getElementById("contactDraft");
const contactHint = document.getElementById("contactHint");
const contactEmailLink = document.getElementById("contactEmailLink");

contactForm.addEventListener("input", () => {
    contactMessage.setCustomValidity("");
    contactDraft.hidden = true;
});

contactForm.addEventListener("submit", event => {
    event.preventDefault();

    const fields = new FormData(contactForm);
    const name = fields.get("name").trim();
    const topic = fields.get("topic");
    const message = fields.get("message").trim();
    const recipient = contactForm.dataset.contactEmail.trim();

    if (!message) {
        contactMessage.setCustomValidity(contactMessage.dataset.blankMessage);
        contactMessage.reportValidity();
        return;
    }

    const body = name ? message + "\r\n\r\n" + name : message;
    const subjectField = encodeURIComponent(topic);
    const bodyField = encodeURIComponent(body);

    contactEmailLink.href = "mailto:" + recipient + "?subject=" + subjectField + "&body=" + bodyField;
    contactHint.hidden = Boolean(recipient);
    contactDraft.hidden = false;
    contactEmailLink.focus();
});