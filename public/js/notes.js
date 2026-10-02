document.addEventListener("DOMContentLoaded", function() {
    var tabBtns = document.querySelectorAll(".video-tab-btn");
    var panels = document.querySelectorAll(".video-tab-panel");
    var notesList = document.getElementById("notesList");
    var notesEmpty = document.getElementById("notesEmpty");
    var modal = document.getElementById("noteModal");
    var noteText = document.getElementById("noteText");
    var noteTitleEl = document.querySelector(".video-title");
    var noteBadgeEl = document.querySelector(".video-badge");

    // إذا عناصر الملاحظات غير موجودة في الصفحة لا نفعل شيئاً
    if (!notesList || !modal || !noteText) return;

    // ---------- Tabs ----------
    tabBtns.forEach(function(btn) {
        btn.addEventListener("click", function() {
            tabBtns.forEach(function(b) {
                b.classList.remove("active");
            });
            panels.forEach(function(p) {
                p.classList.remove("active");
            });
            btn.classList.add("active");
            document.getElementById(btn.dataset.tab).classList.add("active");
        });
    });

    // ---------- Storage (يمكن استبدالها لاحقاً بطلبات fetch للسيرفر) ----------
    function textOf(el) {
        return el ? (el.textContent || "").trim() : "";
    }

    function getKey() {
        return "studyou-notes:" + textOf(noteBadgeEl) + "|" + textOf(noteTitleEl);
    }

    function loadNotes() {
        try {
            return JSON.parse(localStorage.getItem(getKey())) || [];
        } catch (e) {
            return [];
        }
    }

    function saveNotes(notes) {
        try {
            localStorage.setItem(getKey(), JSON.stringify(notes));
        } catch (e) {}
    }

    // ---------- Render ----------
    function renderNotes() {
        var notes = loadNotes();
        notesList.innerHTML = "";

        if (notesEmpty) {
            notesEmpty.classList.toggle("hidden", notes.length > 0);
        }

        notes.forEach(function(note) {
            var item = document.createElement("div");
            item.className = "note-item";

            var content = document.createElement("div");
            content.className = "note-content";

            var text = document.createElement("p");
            text.className = "note-text";
            text.textContent = note.text;

            var date = document.createElement("small");
            date.className = "note-date";
            date.textContent = new Date(note.id).toLocaleString("ar");

            content.appendChild(text);
            content.appendChild(date);

            var del = document.createElement("button");
            del.type = "button";
            del.className = "note-delete";
            del.innerHTML = '<i class="fa-solid fa-trash"></i>';
            del.addEventListener("click", function() {
                saveNotes(
                    loadNotes().filter(function(n) {
                        return n.id !== note.id;
                    })
                );
                renderNotes();
            });

            item.appendChild(content);
            item.appendChild(del);
            notesList.appendChild(item);
        });
    }

    // ---------- Modal ----------
    function openNoteModal() {
        noteText.value = "";
        modal.classList.add("active");
        setTimeout(function() {
            noteText.focus();
        }, 50);
    }

    function closeNoteModal() {
        modal.classList.remove("active");
    }

    document.getElementById("addNoteBtn").addEventListener("click", openNoteModal);
    document.getElementById("noteModalClose").addEventListener("click", closeNoteModal);
    document.getElementById("cancelNote").addEventListener("click", closeNoteModal);

    modal.addEventListener("click", function(e) {
        if (e.target === modal) closeNoteModal();
    });

    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") closeNoteModal();
    });

    document.getElementById("saveNote").addEventListener("click", function() {
        var value = noteText.value.trim();
        if (!value) return noteText.focus();

        var notes = loadNotes();
        notes.unshift({ id: Date.now(), text: value });
        saveNotes(notes);

        closeNoteModal();
        renderNotes();
    });

    // ---------- تحديث الملاحظات عند تغيّر الفيديو ----------
    if (noteTitleEl) {
        new MutationObserver(renderNotes).observe(noteTitleEl, {
            childList: true,
            characterData: true,
            subtree: true,
        });
    }

    renderNotes();
});
/* =========================================
   SAVE VIDEO BUTTON
========================================= */
document.addEventListener("DOMContentLoaded", function() {
    var saveBtn = document.getElementById("saveVideoBtn");
    var saveTitleEl = document.querySelector(".video-title");
    var saveBadgeEl = document.querySelector(".video-badge");

    if (!saveBtn) return;

    function textOf(el) {
        return el ? (el.textContent || "").trim() : "";
    }

    function getSaveKey() {
        return "studyou-saved:" + textOf(saveBadgeEl) + "|" + textOf(saveTitleEl);
    }

    function isSaved() {
        try {
            return localStorage.getItem(getSaveKey()) === "1";
        } catch (e) {
            return false;
        }
    }

    function renderSave() {
        var saved = isSaved();
        saveBtn.classList.toggle("saved", saved);
        saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
        saveBtn.title = saved ? "إزالة من المحفوظات" : "حفظ الفيديو";
    }

    saveBtn.addEventListener("click", function() {
        var nowSaved = !isSaved();
        try {
            if (nowSaved) localStorage.setItem(getSaveKey(), "1");
            else localStorage.removeItem(getSaveKey());
        } catch (e) {}

        renderSave();

        if (nowSaved) {
            saveBtn.classList.remove("pop");
            void saveBtn.offsetWidth; // إعادة تشغيل الحركة
            saveBtn.classList.add("pop");
        }
    });

    saveBtn.addEventListener("animationend", function(e) {
        if (e.target === saveBtn || e.target.parentNode === saveBtn) {
            saveBtn.classList.remove("pop");
        }
    });

    // تحديث حالة الأيقونة عند تغيّر الفيديو
    if (saveTitleEl) {
        new MutationObserver(renderSave).observe(saveTitleEl, {
            childList: true,
            characterData: true,
            subtree: true,
        });
    }

    renderSave();
});