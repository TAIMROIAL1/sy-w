document.addEventListener("DOMContentLoaded", function() {
    const tabBtns = document.querySelectorAll(".video-tab-btn");
    const panels = document.querySelectorAll(".video-tab-panel");
    const notesList = document.getElementById("notesList");
    const notesEmpty = document.getElementById("notesEmpty");
    const notesLoading = document.getElementById("notesLoading");
    const modal = document.getElementById("noteModal");
    const noteText = document.getElementById("noteText");
    const noteTitleEl = document.querySelector(".video-title");
    const addNoteBtn = document.getElementById("addNoteBtn");
    const saveNoteBtn = document.getElementById("saveNote");

    // إذا عناصر الملاحظات غير موجودة في الصفحة لا نفعل شيئاً
    if (!notesList || !modal || !noteText) return;

    const notesDomain = document.body.dataset.domain || "";
    const subcourseId = location.href.split("/")[4];

    let currentNotes = [];
    let currentKey = null;
    let loadFailed = false;
    let requestId = 0;

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

            // إعادة المحاولة عند فتح الملاحظات إذا فشل التحميل السابق
            if (btn.dataset.tab === "tabNotes" && loadFailed) renderNotes();
        });
    });

    // ---------- Server API ----------
    function getCurrentVideo() {
        const res = document.querySelector(".lesson-resource.video-resource.active");
        const lesson = res && res.closest(".lesson");
        if (!res || !lesson) return null;
        return {
            videoNum: Number(res.dataset.num),
            lessonNum: Number(lesson.dataset.num),
        };
    }

    function getCurrentTitles() {
        const res = document.querySelector(".lesson-resource.video-resource.active");
        const lesson = res && res.closest(".lesson");
        const course = document.querySelector(".sidebar-header h2");
        const lessonTitle = lesson && lesson.querySelector(".lesson-title h3");
        return {
            courseTitle: course ? course.textContent.trim() : "",
            lessonTitle: lessonTitle ? lessonTitle.textContent.trim() : (res && res.dataset.badge) || "",
            videoTitle: (res && res.dataset.title) || "",
        };
    }

    function keyOf(video) {
        return video.lessonNum + ":" + video.videoNum;
    }

    async function notesRequest(action, data) {
        const response = await fetch(
            `${notesDomain}/api/v1/notes/${subcourseId}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        let json = {};
        try {
            json = await response.json();
        } catch (e) {}

        if (!response.ok || json.status === "fail" || json.status === "error") {
            throw new Error(json.message || "حدث خطأ، حاول مرة أخرى");
        }
        return json;
    }

    function normalizeNote(note) {
        return {
            id: note._id,
            text: note.noteText || "",
            date: note.date || null,
        };
    }

    // الأحدث أولاً
    function sortNotes(notes) {
        return notes.slice().sort(function(a, b) {
            return new Date(b.date || 0) - new Date(a.date || 0);
        });
    }

    // ---------- Render ----------
    function setLoading(isLoading) {
        if (notesLoading) notesLoading.classList.toggle("hidden", !isLoading);
        if (addNoteBtn) addNoteBtn.disabled = isLoading;
        if (isLoading) {
            notesList.innerHTML = "";
            if (notesEmpty) notesEmpty.classList.add("hidden");
        }
    }

    function showError(message) {
        notesList.innerHTML = "";
        if (notesEmpty) notesEmpty.classList.add("hidden");

        const box = document.createElement("div");
        box.className = "notes-error";

        const text = document.createElement("p");
        text.textContent = message || "تعذّر تحميل الملاحظات";

        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "btn btn-secondary";
        retry.innerHTML = '<i class="fa-solid fa-rotate-right"></i> إعادة المحاولة';
        retry.addEventListener("click", function() {
            renderNotes();
        });

        box.appendChild(text);
        box.appendChild(retry);
        notesList.appendChild(box);
    }

    function drawNotes() {
        notesList.innerHTML = "";

        if (notesEmpty) {
            notesEmpty.classList.toggle("hidden", currentNotes.length > 0);
        }

        currentNotes.forEach(function(note) {
            const item = document.createElement("div");
            item.className = "note-item";

            const content = document.createElement("div");
            content.className = "note-content";

            const text = document.createElement("p");
            text.className = "note-text";
            text.textContent = note.text;
            content.appendChild(text);

            if (note.date && !isNaN(new Date(note.date))) {
                const date = document.createElement("small");
                date.className = "note-date";
                date.textContent = new Date(note.date).toLocaleString("ar");
                content.appendChild(date);
            }

            const del = document.createElement("button");
            del.type = "button";
            del.className = "note-delete";
            del.innerHTML = '<i class="fa-solid fa-trash"></i>';
            del.addEventListener("click", function() {
                deleteNote(note);
            });

            item.appendChild(content);
            item.appendChild(del);
            notesList.appendChild(item);
        });
    }

    async function renderNotes() {
        const video = getCurrentVideo();
        if (!video) return;

        const token = ++requestId;
        currentKey = keyOf(video);
        currentNotes = [];
        loadFailed = false;
        setLoading(true);

        try {
            const res = await notesRequest("get-notes", video);
            if (token !== requestId) return;
            currentNotes = sortNotes((Array.isArray(res.data) ? res.data : []).map(normalizeNote));
            setLoading(false);
            drawNotes();
        } catch (err) {
            if (token !== requestId) return;
            loadFailed = true;
            setLoading(false);
            showError(err.message);
        }
    }

    // ---------- Add / Delete ----------
    async function addNote(value) {
        const video = getCurrentVideo();
        if (!video) return;

        const key = keyOf(video);
        const originalHTML = saveNoteBtn.innerHTML;
        saveNoteBtn.disabled = true;
        saveNoteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ';

        try {
            await notesRequest("add-note", {
                videoNum: video.videoNum,
                lessonNum: video.lessonNum,
                noteText: value,
                ...getCurrentTitles(),
            });

            closeNoteModal();
            if (key === currentKey) renderNotes();
        } catch (err) {
            alert(err.message);
        } finally {
            saveNoteBtn.disabled = false;
            saveNoteBtn.innerHTML = originalHTML;
        }
    }

    async function deleteNote(note) {
        setLoading(true);

        try {
            await notesRequest("delete-note", { noteId: note.id });
            renderNotes();
        } catch (err) {
            setLoading(false);
            drawNotes();
            alert(err.message);
        }
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

    addNoteBtn.addEventListener("click", openNoteModal);
    document.getElementById("noteModalClose").addEventListener("click", closeNoteModal);
    document.getElementById("cancelNote").addEventListener("click", closeNoteModal);

    modal.addEventListener("click", function(e) {
        if (e.target === modal) closeNoteModal();
    });

    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") closeNoteModal();
    });

    saveNoteBtn.addEventListener("click", function() {
        if (saveNoteBtn.disabled) return;
        const value = noteText.value.trim();
        if (!value) return noteText.focus();
        addNote(value);
    });

    // ---------- تحميل الملاحظات عند تغيّر الفيديو ----------
    if (noteTitleEl) {
        new MutationObserver(function() {
            renderNotes();
        }).observe(noteTitleEl, {
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
    const saveBtn = document.getElementById("saveVideoBtn");
    const saveTitleEl = document.querySelector(".video-title");
    const saveModal = document.getElementById("saveModal");
    const saveReason = document.getElementById("saveReason");
    const confirmSaveBtn = document.getElementById("confirmSave");

    if (!saveBtn || !saveModal) return;

    const saveIcon = saveBtn.querySelector("i");
    const saveDomain = document.body.dataset.domain || "";
    const saveSubcourseId = location.href.split("/")[4];
    let savedId = null;
    let saveToken = 0;
    let pendingVideo = null;

    function currentVideo() {
        const res = document.querySelector(".lesson-resource.video-resource.active");
        const lesson = res && res.closest(".lesson");
        if (!res || !lesson) return null;
        const course = document.querySelector(".sidebar-header h2");
        const lessonTitle = lesson.querySelector(".lesson-title h3");
        return {
            videoNum: Number(res.dataset.num),
            lessonNum: Number(lesson.dataset.num),
            courseTitle: course ? course.textContent.trim() : "",
            lessonTitle: lessonTitle ? lessonTitle.textContent.trim() : res.dataset.badge || "",
            videoTitle: res.dataset.title || "",
        };
    }

    function sameVideo(a, b) {
        return !!a && !!b && a.videoNum === b.videoNum && a.lessonNum === b.lessonNum;
    }

    async function savedRequest(action, data) {
        const response = await fetch(
            `${saveDomain}/api/v1/saved-videos/${saveSubcourseId}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        let json = {};
        try {
            json = await response.json();
        } catch (e) {}

        if (!response.ok || json.status === "fail" || json.status === "error") {
            throw new Error(json.message || "حدث خطأ، حاول مرة أخرى");
        }
        return json;
    }

    function setSaved(id) {
        savedId = id || null;
        const saved = !!savedId;
        saveBtn.classList.toggle("saved", saved);
        saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
        saveBtn.title = saved ? "إزالة من المحفوظات" : "حفظ الفيديو";
    }

    function setSaveLoading(isLoading) {
        saveBtn.disabled = isLoading;
        saveBtn.classList.toggle("loading", isLoading);
        if (saveIcon) {
            saveIcon.className = isLoading ?
                "fa-solid fa-spinner fa-spin" :
                "fa-solid fa-bookmark";
        }
    }

    function playPop() {
        saveBtn.classList.remove("pop");
        void saveBtn.offsetWidth; // إعادة تشغيل الحركة
        saveBtn.classList.add("pop");
    }

    async function checkSaved() {
        const video = currentVideo();
        if (!video) return;

        const token = ++saveToken;
        setSaved(null);
        setSaveLoading(true);

        try {
            const res = await savedRequest("is-saved", {
                videoNum: video.videoNum,
                lessonNum: video.lessonNum,
            });
            if (token !== saveToken) return;
            const data = res.data || {};
            setSaved(data.saved ? data.savedId : null);
        } catch (err) {
            if (token !== saveToken) return;
            setSaved(null);
        }
        setSaveLoading(false);
    }

    async function unsaveVideo() {
        const token = ++saveToken;
        setSaveLoading(true);

        try {
            await savedRequest("unsave-video", { savedId: savedId });
            if (token !== saveToken) return;
            setSaved(null);
        } catch (err) {
            if (token !== saveToken) return;
            alert(err.message);
        }
        setSaveLoading(false);
    }

    function openSaveModal() {
        pendingVideo = currentVideo();
        if (!pendingVideo) return;
        saveReason.value = "";
        saveModal.classList.add("active");
        setTimeout(function() {
            saveReason.focus();
        }, 50);
    }

    function closeSaveModal() {
        saveModal.classList.remove("active");
    }

    async function confirmSave() {
        if (confirmSaveBtn.disabled || !pendingVideo) return;
        const video = pendingVideo;

        confirmSaveBtn.disabled = true;
        confirmSaveBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ';

        try {
            const res = await savedRequest("save-video", {
                ...video,
                reason: saveReason.value.trim(),
            });
            closeSaveModal();
            if (sameVideo(video, currentVideo())) {
                const newId = res.data && res.data.savedId;
                if (newId) {
                    saveToken++;
                    setSaveLoading(false);
                    setSaved(newId);
                    playPop();
                } else {
                    checkSaved();
                }
            }
        } catch (err) {
            alert(err.message);
        }

        confirmSaveBtn.disabled = false;
        confirmSaveBtn.textContent = "حفظ";
    }

    saveBtn.addEventListener("click", function() {
        if (saveBtn.disabled) return;
        if (savedId) unsaveVideo();
        else openSaveModal();
    });

    confirmSaveBtn.addEventListener("click", confirmSave);
    document.getElementById("saveModalClose").addEventListener("click", closeSaveModal);
    document.getElementById("cancelSave").addEventListener("click", closeSaveModal);

    saveModal.addEventListener("click", function(e) {
        if (e.target === saveModal) closeSaveModal();
    });

    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") closeSaveModal();
    });

    saveBtn.addEventListener("animationend", function(e) {
        if (e.target === saveBtn || e.target.parentNode === saveBtn) {
            saveBtn.classList.remove("pop");
        }
    });

    // تحديث حالة الحفظ عند تغيّر الفيديو
    if (saveTitleEl) {
        new MutationObserver(checkSaved).observe(saveTitleEl, {
            childList: true,
            characterData: true,
            subtree: true,
        });
    }

    checkSaved();
});
