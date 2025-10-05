// app/renderer.js
const { electronAPI } = window;

let currentCategory = null;
let config = electronAPI.getConfig();

document.getElementById("apiUrl").value = config.apiUrl || "http://localhost:3000";

document.getElementById("saveConfig").addEventListener("click", () => {
  const newUrl = document.getElementById("apiUrl").value.trim();
  config.apiUrl = newUrl || "http://localhost:3000";
  electronAPI.setConfig(config);
  alert("تم حفظ الرابط");
});

document.getElementById("generate").addEventListener("click", async () => {
  const category = document.getElementById("category").value.trim();
  const length = +document.getElementById("length").value || 8;
  const count = +document.getElementById("count").value || 10;
  const value = document.getElementById("value").value || "0";

  if (!category) return alert("اختر فئة");

  const codes = [];
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < count; i++) {
    let code = "";
    for (let j = 0; j < length; j++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    codes.push({
      code,
      value,
      category,
      active: true,
      dateCreated: new Date().toISOString()
    });
  }

  try {
    await electronAPI.axiosPost("/api/codes/create", { codes });
    // save immediately to Excel locally
    electronAPI.saveExcel(category, (await electronAPI.axiosGet('/api/codes')).filter(c => c.category === category));
    alert("تم إنشاء الأكواد وإرسالها للسيرفر وحفظها في ملف Excel");
    loadAll();
  } catch (err) {
    console.error(err);
    alert("خطأ في الاتصال بالسيرفر. تأكد من تشغيل السيرفر.");
  }
});

document.getElementById("saveNow").addEventListener("click", async () => {
  if (!currentCategory) return alert("اختر فئة لحفظها");
  try {
    const codes = (await electronAPI.axiosGet('/api/codes')).filter(c => c.category === currentCategory);
    const res = electronAPI.saveExcel(currentCategory, codes);
    alert('تم الحفظ إلى: ' + res.filePath);
  } catch (err) {
    console.error(err);
    alert("خطأ أثناء الحفظ");
  }
});

document.getElementById("refresh").addEventListener("click", loadAll);

async function loadAll() {
  try {
    const all = await electronAPI.axiosGet("/api/codes");
    renderTable(all);
    renderCategories(all);
    updateStats(all);
  } catch (err) {
    console.error(err);
  }
}

function renderTable(codes) {
  const tbody = document.getElementById("codeTable");
  tbody.innerHTML = "";
  const list = currentCategory ? codes.filter(c => c.category === currentCategory) : codes;
  list.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.code}</td>
      <td>${c.value}</td>
      <td>${c.active ? "فعّال" : "مستهلك"}</td>
      <td>${c.category}</td>
      <td>
        <button data-code="${c.code}" class="useBtn">${c.active ? "استهلاك" : "محذوف"}</button>
        <button data-code="${c.code}" class="delBtn">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".useBtn").forEach(b => {
    b.addEventListener("click", async (e) => {
      const code = e.target.dataset.code;
      try {
        await electronAPI.axiosPut(`/api/codes/use/${code}`, {});
        loadAll();
      } catch (err) { console.error(err); alert("خطأ"); }
    });
  });
  document.querySelectorAll(".delBtn").forEach(b => {
    b.addEventListener("click", async (e) => {
      const code = e.target.dataset.code;
      if (!confirm("هل تريد حذف هذا الكود؟")) return;
      try {
        await electronAPI.axiosDelete(`/api/codes/${code}`);
        loadAll();
      } catch (err) { console.error(err); alert("خطأ"); }
    });
  });
}

function renderCategories(codes) {
  const container = document.getElementById("categories");
  container.innerHTML = "";
  const cats = [...new Set(codes.map(c => c.category))];
  cats.forEach(cat => {
    const div = document.createElement("div");
    div.className = "category-box" + (cat === currentCategory ? " active" : "");
    div.textContent = cat;
    div.onclick = () => {
      currentCategory = (currentCategory === cat) ? null : cat;
      loadAll();
    };
    container.appendChild(div);
  });
}

function updateStats(codes) {
  const active = codes.filter(c => c.active).length;
  const inactive = codes.filter(c => !c.active).length;
  document.getElementById("activeCount").textContent = active;
  document.getElementById("inactiveCount").textContent = inactive;

  if (currentCategory) {
    const filtered = codes.filter(c => c.category === currentCategory);
    document.getElementById("categoryActiveCount").textContent = filtered.filter(c => c.active).length;
  } else {
    document.getElementById("categoryActiveCount").textContent = 0;
  }
}

// load at start
loadAll();
