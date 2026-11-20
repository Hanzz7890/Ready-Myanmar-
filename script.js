const accountKey = "readyMyanmarAccounts";
const sessionKey = "readyMyanmarCurrentAccount";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function getAccounts() {
    return JSON.parse(localStorage.getItem(accountKey) || "[]");
}

async function passwordHash(password, salt) {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const hash = await crypto.subtle.deriveBits({
        name: "PBKDF2",
        hash: "SHA-256",
        salt: Uint8Array.from(salt),
        iterations: 600000
    }, key, 256);

    return Array.from(new Uint8Array(hash)).join(",");
}

async function setupNavbar() {
    const header = document.querySelector("#siteHeader");

    if (!header) return;

    if (!header.firstElementChild) {
        const response = await fetch("index.html");

        if (!response.ok) throw new Error("Could not load the homepage.");

        const home = new DOMParser().parseFromString(await response.text(), "text/html");
        header.innerHTML = home.querySelector("#siteHeader").innerHTML;
    }

    const currentPath = location.pathname.endsWith("/")
        ? location.pathname + "index.html"
        : location.pathname;

    for (const link of header.querySelectorAll(".nav-list a")) {
        if (new URL(link.href).pathname.toLowerCase() === currentPath.toLowerCase()) {
            link.setAttribute("aria-current", "page");
        }
    }

    const menuButton = header.querySelector("#menuButton");
    const menu = header.querySelector("#mainMenu");
    const guests = header.querySelector("#guestActions");
    const member = header.querySelector("#memberActions");
    const name = header.querySelector("#accountName");
    const initial = header.querySelector("#accountInitial");

    menuButton.addEventListener("click", () => {
        const open = menu.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", event => {
        for (const dropdown of header.querySelectorAll("details[open]")) {
            if (!dropdown.contains(event.target)) {
                dropdown.open = false;
            }
        }
    });

    header.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;

        const dropdown = event.target.closest("details[open]");

        if (dropdown) {
            dropdown.open = false;
            dropdown.querySelector("summary").focus();
        } else if (menu.classList.contains("is-open") && menuButton.offsetWidth > 0) {
            menu.classList.remove("is-open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.focus();
        }
    });

    function showAccount() {
        const email = localStorage.getItem(sessionKey);
        const user = getAccounts().find(account => account.email === email);

        guests.hidden = Boolean(user);
        member.hidden = !user;

        if (!user) {
            member.open = false;
        }

        name.textContent = user?.name || "";
        initial.textContent = user ? Array.from(user.name)[0].toUpperCase() : "";
    }

    for (const form of header.querySelectorAll("[data-auth]")) {
        form.addEventListener("submit", async event => {
            event.preventDefault();

            const invalid = form.querySelector("input:invalid");

            if (invalid) {
                alert(invalid.labels[0].textContent + ": " + invalid.validationMessage);
                invalid.focus();
                return;
            }

            const data = new FormData(form);
            const email = data.get("email").trim().toLowerCase();
            const password = data.get("password");
            const signup = form.dataset.auth === "signup";
            const displayName = (data.get("displayName") || "").trim();
            const submit = form.querySelector('[type="submit"]');

            if (signup && !displayName) {
                alert("Please enter your name.");
                form.elements.displayName.focus();
                return;
            }

            if (signup && password.length < 8) {
                alert("Use at least 8 characters for the password.");
                form.elements.password.focus();
                return;
            }

            if (signup && password !== data.get("confirmation")) {
                alert("The passwords do not match.");
                form.elements.confirmation.focus();
                return;
            }

            submit.disabled = true;

            try {
                if (signup) {
                    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
                    const hash = await passwordHash(password, salt);
                    const accounts = getAccounts();

                    if (accounts.some(account => account.email === email)) {
                        alert("An account already uses this email.");
                        form.elements.email.focus();
                        return;
                    }

                    accounts.push({ name: displayName, email, salt, hash });
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
                showAccount();
                form.closest("dialog").close();
                form.reset();
                member.querySelector("summary").focus();
                alert(signup ? "Account created. You are signed in." : "You are signed in.");
            } catch {
                alert("Your account could not be opened or saved. Try Live Server in a browser with storage enabled.");
            } finally {
                submit.disabled = false;
            }
        });
    }

    header.querySelector("#logoutButton").addEventListener("click", () => {
        try {
            localStorage.removeItem(sessionKey);
            showAccount();
            guests.querySelector("button").focus();
            alert("You are logged out.");
        } catch {
            alert("The sign-in state could not be cleared.");
        }
    });

    try {
        showAccount();
    } catch {
        alert("Saved accounts could not be loaded in this browser.");
    }

    window.addEventListener("storage", event => {
        if (!event.key || event.key === accountKey || event.key === sessionKey) {
            showAccount();
        }
    });
}

document.addEventListener("click", event => {
    const opener = event.target.closest("[data-open]");
    const closeButton = event.target.closest("[data-close]");

    if (opener) {
        const dialog = document.getElementById(opener.dataset.open);
        const dropdown = opener.closest("details");

        dialog.showModal();

        if (dropdown) {
            dropdown.open = false;
            dialog.addEventListener("close", () => {
                dropdown.querySelector("summary").focus();
            }, { once: true });
        }
    }

    if (closeButton) {
        closeButton.closest("dialog").close();
    }
});

const slides = Array.from(document.querySelectorAll("#eventSlider .slide-panel"));
let currentSlide = 0;

for (const button of document.querySelectorAll('[data-slider="eventSlider"]')) {
    button.addEventListener("click", () => {
        slides[currentSlide].hidden = true;

        const direction = Number(button.dataset.direction);
        currentSlide = (currentSlide + direction + slides.length) % slides.length;

        slides[currentSlide].hidden = false;
    });
}

if (window.AOS && !reduceMotion) {
    document.documentElement.classList.add("has-aos");
    AOS.init({
        duration: 550,
        once: true,
        offset: 35
    });
}

const visitStat = document.getElementById("visitStat");

if (visitStat) {
    try {
        const key = "readyMyanmarHomeVisits";
        const count = (Number(localStorage.getItem(key)) || 0) + 1;
        const visitCount = document.getElementById("visitCount");

        localStorage.setItem(key, String(count));
        visitCount.dataset.count = count;
        visitCount.textContent = count.toLocaleString("en");
        visitStat.hidden = false;
    } catch {
        visitStat.hidden = true;
    }
}

function countUp(element) {
    const goal = Number(element.dataset.count);
    const digits = (element.dataset.count.split(".")[1] || "").length;
    const format = new Intl.NumberFormat("en", { maximumFractionDigits: digits });
    const start = performance.now();

    element.textContent = "0";

    function frame(now) {
        const progress = Math.min((now - start) / 900, 1);
        const easedProgress = 1 - (1 - progress) ** 3;

        element.textContent = format.format(goal * easedProgress);

        if (progress < 1) {
            requestAnimationFrame(frame);
        }
    }

    requestAnimationFrame(frame);
}

if ("IntersectionObserver" in window && !reduceMotion) {
    const counterObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                counterObserver.unobserve(entry.target);
                countUp(entry.target);
            }
        }
    });

    for (const number of document.querySelectorAll("[data-count]")) {
        counterObserver.observe(number);
    }
}

setupNavbar().catch(() => {
    document.getElementById("siteHeader").textContent =
        "Open the site with Live Server to load the shared navigation.";
});