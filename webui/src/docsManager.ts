import { marked } from "marked";
import { getTranslation } from "./i18n";
import { exec, toast } from "./utils";

type Lang = "zh" | "en";

export class DocsManager {
	docsListContainer: HTMLElement | null;
	docsModal: HTMLElement | null;
	docsContent: HTMLElement | null;
	docsTitle: HTMLElement | null;
	closeModalBtn: Element | null;
	currentLanguage: Lang = "zh";

	constructor() {
		this.docsListContainer = document.getElementById("docsList");
		this.docsModal = document.getElementById("docsModal");
		this.docsContent = document.getElementById("docsContent");
		this.docsTitle = document.getElementById("docsTitle");
		this.closeModalBtn = document.querySelector(".close-docs-modal");
	}

	init() {
		this.setupEventListeners();
		this.loadDocsList();
	}

	setupEventListeners() {
		if (this.closeModalBtn) {
			this.closeModalBtn.addEventListener("click", () => this.closeModal());
		}
		window.addEventListener("click", (event) => {
			if (event.target === this.docsModal) this.closeModal();
		});
		window.addEventListener("keydown", (event) => {
			if (event.key === "Escape" && this.docsModal && this.docsModal.style.display === "block") {
				this.closeModal();
			}
		});
	}

	async loadDocsList() {
		if (!this.docsListContainer) return;

		// Use ls to get files. Assumes only files in that dir or straightforward names.
		// using ls -1 to get one per line
		const docsPath = "/data/adb/modules/Mediatek_Mali_GPU_Governor/docs";
		const { errno, stdout } = await exec(`ls "${docsPath}"/*.md`);

		this.docsListContainer.innerHTML = "";

		if (errno === 0 && stdout.trim()) {
			const files = stdout.trim().split("\n");
			files.forEach((filePath) => {
				const fileName = filePath.trim().split("/").pop();
				if (!fileName) return;

				// Remove extension and underscores for display
				const displayName = fileName.replace(".md", "").replace(/_/g, " ");

				const btn = document.createElement("button");
				btn.className = "settings-tab-btn"; // Use existing style
				btn.style.width = "100%";
				btn.style.padding = "10px 15px";
				btn.style.boxSizing = "border-box"; // Ensure padding doesn't overflow

				// SVG Icon
				const iconSpan = document.createElement("span");
				iconSpan.className = "tab-icon";
				iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"></path></svg>`;

				const textSpan = document.createElement("span");
				textSpan.className = "tab-text";
				textSpan.textContent = displayName;

				btn.appendChild(iconSpan);
				btn.appendChild(textSpan);

				btn.onclick = () => this.openDoc(filePath.trim(), displayName);

				this.docsListContainer?.appendChild(btn);
			});
		} else {
			const emptyMsg = document.createElement("span");
			emptyMsg.className = "loading-text";
			emptyMsg.setAttribute("data-i18n", "settings_docs_empty");
			emptyMsg.textContent = getTranslation("settings_docs_empty", {}, this.currentLanguage);
			this.docsListContainer.appendChild(emptyMsg);
		}
	}

	async openDoc(filePath: string, title: string) {
		if (!this.docsModal || !this.docsContent) return;

		const { errno, stdout } = await exec(`cat "${filePath}"`);

		if (errno === 0) {
			this.docsContent.innerHTML = await marked.parse(stdout);
			if (this.docsTitle) this.docsTitle.textContent = title;
			this.docsModal.style.display = "block";
		} else {
			toast(getTranslation("docs_load_fail", {}, this.currentLanguage));
		}
	}

	closeModal() {
		if (this.docsModal) this.docsModal.style.display = "none";
	}

	setLanguage(language: Lang) {
		this.currentLanguage = language;
		if (this.docsListContainer?.querySelector("[data-i18n='settings_docs_empty']")) {
			const emptyMsg = this.docsListContainer.querySelector("[data-i18n='settings_docs_empty']");
			if (emptyMsg)
				emptyMsg.textContent = getTranslation("settings_docs_empty", {}, this.currentLanguage);
		}
		// Also update modal title if it's the default "Document"
		if (this.docsTitle?.getAttribute("data-i18n")) {
			this.docsTitle.textContent = getTranslation("docs_modal_title", {}, this.currentLanguage);
		}
	}
}
