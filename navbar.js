const accountKey = "readyMyanmarAccounts";
const sessionKey = "readyMyanmarCurrentAccount";

async function passwordHash(password, salt) {
    const encodedPassword = new TextEncoder().encode(password);
    const key = await crypto.subtle.importKey(
        "raw", encodedPassword, "PBKDF2", false, ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits({
        name: "PBKDF2",
        hash: "SHA-256",
        salt: Uint8Array.from(salt),
        iterations: 600000
    }, key, 256);

    return Array.from(new Uint8Array(bits)).join(",");
}

function getAccounts() {
    return JSON.parse(localStorage.getItem(accountKey) || "[]");
}

async function loadNavbar() {
    const header = document.querySelector("#siteHeader");
    const response = await fetch("navbar.html");

    if (!response.ok) {
        throw new Error("Navbar file could not be loaded.");
    }

    header.innerHTML = await response.text();

    const currentPath = location.pathname.endsWith("/")
        ? location.pathname + "index.html"
        : location.pathname;
    const navLinks = header.querySelectorAll(".navbar-nav a");

    for (const link of navLinks) {
        if (new URL(link.href).pathname === currentPath) {
            link.setAttribute("aria-current", "page");
            link.classList.add("active");
            link.closest(".dropdown")?.querySelector(".nav-link").classList.add("active");
        }
    }

    const guests = header.querySelector("#guestActions");
    const members = header.querySelector("#memberActions");
    const accountName = header.querySelector("#accountName");
    const accountInitial = header.querySelector("#accountInitial");
    const accountButton = header.querySelector("#accountButton");

    function updateAccount() {
        const email = localStorage.getItem(sessionKey);
        const user = getAccounts().find(account => account.email === email);

        guests.hidden = Boolean(user);
        members.hidden = !user;
        accountName.textContent = user?.name || "";
        accountInitial.textContent = user ? Array.from(user.name)[0].toUpperCase() : "";
    }

    for (const form of header.querySelectorAll("[data-auth]")) {
        form.addEventListener("submit", async event => {
            event.preventDefault();

            for (const field of form.querySelectorAll("input")) {
                if (!field.checkValidity()) {
                    alert(field.labels[0].textContent + ": " + field.validationMessage);
                    field.focus();
                    return;
                }
            }

            const data = new FormData(form);
            const email = data.get("email").trim().toLowerCase();
            const password = data.get("password");
            const creating = form.dataset.auth === "signup";
            const name = (data.get("displayName") || "").trim();
            const submit = form.querySelector('button[type="submit"]');

            if (creating && !name) {
                alert("Please enter your name.");
                form.elements.displayName.focus();
                return;
            }

            if (creating && password.length < 8) {
                alert("Use at least 8 characters for the password.");
                form.elements.password.focus();
                return;
            }

            if (creating && password !== data.get("confirmation")) {
                alert("The passwords do not match.");
                form.elements.confirmation.focus();
                return;
            }

            submit.disabled = true;

            try {
                if (creating) {
                    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
                    const hash = await passwordHash(password, salt);
                    const accounts = getAccounts();

                    if (accounts.some(account => account.email === email)) {
                        alert("An account already uses this email.");
                        form.elements.email.focus();
                        return;
                    }

                    accounts.push({ name, email, salt, hash });
                    localStorage.setItem(accountKey, JSON.stringify(accounts));
                } else {
                    const account = getAccounts().find(user => user.email === email);

                    if (!account || await passwordHash(password, account.salt) !== account.hash) {
                        alert("The email or password is incorrect.");
                        form.elements.email.focus();
                        return;
                    }
                }

                localStorage.setItem(sessionKey, email);
                updateAccount();

                const modal = form.closest(".modal");
                modal.addEventListener("hidden.bs.modal", () => accountButton.focus(), { once: true });
                bootstrap.Modal.getInstance(modal).hide();
                form.reset();
                alert(creating ? "Account created. You are signed in." : "You are signed in.");
            } catch {
                alert("The account could not be saved or opened. Check that browser storage is enabled.");
            } finally {
                submit.disabled = false;
            }
        });
    }

    header.querySelector("#logoutButton").addEventListener("click", () => {
        try {
            bootstrap.Dropdown.getInstance(accountButton)?.hide();
            localStorage.removeItem(sessionKey);
            updateAccount();
            guests.querySelector("button").focus();
            alert("You are logged out.");
        } catch {
            alert("The sign-in state could not be cleared.");
        }
    });

    for (const modal of header.querySelectorAll(".modal")) {
        modal.addEventListener("shown.bs.modal", () => modal.querySelector("input").focus());
    }

    try {
        updateAccount();
    } catch {
        alert("Saved accounts could not be loaded. Check that browser storage is enabled.");
    }

    window.addEventListener("storage", event => {
        if (!event.key || event.key === accountKey || event.key === sessionKey) {
            updateAccount();
        }
    });
}

loadNavbar().catch(() => {
    document.querySelector("#siteHeader").textContent = "The menu could not load. Open the site with Live Server.";
});