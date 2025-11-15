// script.js – شرطة ريسبكت / تحديث مركز العمليات للشرطة

const $ = (id) => document.getElementById(id);

const unitsList = $("unitsList");
const fileInput = $("fileInput");
const ocrMode = $("ocrMode");
const previewWrap = $("previewWrap");
const previewImg = $("previewImg");
const progressBar = $("progressBar");
const progressText = $("progressText");
const resultArea = $("resultArea");
const toast = $("toast");
const startTimeBtn = $("startTime");
const endTimeBtn = $("endTime");

let leadersArr = [];
let officersArr = [];
let managers = [];
let ncosArr = [];
let startTimeText = "";
let endTimeText = "";
let modalRow = null;

function showToast(msg, t = 2000) {
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, t);
}

/* =========================
   الانترو (بدون زر)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const intro = $("intro-screen");
  const main = $("app-main");
  const topbar = $("topbar");

  if (intro && main && topbar) {
    intro.addEventListener("click", () => {
      intro.classList.add("hidden");
      topbar.classList.remove("hidden");
      main.classList.remove("hidden");
    });
  }

  // بداية: النتيجة تظهر حتى لو فاضية
  updateResult();
});

/* =========================
   إدارة المجموعات (قيادات / ضباط / مسؤول فترة / ضباط صف)
========================= */
function renderPills(container, arr, type) {
  container.innerHTML = "";
  arr.forEach((it, i) => {
    const d = document.createElement("div");
    d.className = "pill";

    if (type === "manager" || type === "nco") {
      const txt =
        (it.name ? it.name + " " : "") + (it.code ? "| " + it.code : "");
      d.innerHTML =
        txt +
        ` <button data-i="${i}" class="btn muted del-pill" data-type="${type}">حذف</button>`;
    } else {
      d.innerHTML =
        it +
        ` <button data-i="${i}" class="btn muted del-pill" data-type="${type}">حذف</button>`;
    }
    container.appendChild(d);
  });
}

$("addLeader").addEventListener("click", () => {
  const v = $("leaderInput").value.trim();
  if (!v) return showToast("أدخل كود القيادة");
  leadersArr.push(v);
  $("leaderInput").value = "";
  renderPills($("leadersPills"), leadersArr, "leader");
  updateResult();
});

$("addOfficer").addEventListener("click", () => {
  const v = $("officerInput").value.trim();
  if (!v) return showToast("أدخل كود الضابط");
  officersArr.push(v);
  $("officerInput").value = "";
  renderPills($("officersPills"), officersArr, "officer");
  updateResult();
});

$("addManager").addEventListener("click", () => {
  const n = $("managerName").value.trim();
  const c = $("managerCode").value.trim();
  if (!n && !c) return showToast("أدخل اسم أو كود المسؤول");
  managers.push({ name: n, code: c });
  $("managerName").value = "";
  $("managerCode").value = "";
  renderPills($("managersPills"), managers, "manager");
  updateResult();
});

$("addNco").addEventListener("click", () => {
  const n = $("ncoName").value.trim();
  const c = $("ncoCode").value.trim();
  if (!n && !c) return showToast("أدخل بيانات ضابط الصف");
  ncosArr.push({ name: n, code: c });
  $("ncoName").value = "";
  $("ncoCode").value = "";
  renderPills($("ncosPills"), ncosArr, "nco");
  updateResult();
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("del-pill")) {
    const i = parseInt(e.target.dataset.i, 10);
    const type = e.target.dataset.type;
    if (type === "leader") {
      leadersArr.splice(i, 1);
      renderPills($("leadersPills"), leadersArr, "leader");
    } else if (type === "officer") {
      officersArr.splice(i, 1);
      renderPills($("officersPills"), officersArr, "officer");
    } else if (type === "manager") {
      managers.splice(i, 1);
      renderPills($("managersPills"), managers, "manager");
    } else if (type === "nco") {
      ncosArr.splice(i, 1);
      renderPills($("ncosPills"), ncosArr, "nco");
    }
    showToast("تم الحذف");
    updateResult();
  }
});

/* =========================
   إنشاء صف وحدة
========================= */
function createUnit(data = {}) {
  const row = document.createElement("div");
  row.className = "unit-row";
  const defaultData = {
    code: "",
    status: "في الخدمة",
    loc: "لا شي",
    dist: "",
    type: "لا شي",
    speed: "",
  };
  const d = { ...defaultData, ...data };

  row.innerHTML = `
    <div class="col">
      <input class="code-input" value="${d.code}" placeholder="الكود" />
    </div>
    <div class="col">
      <select class="status-input">
        <option>في الخدمة</option>
        <option>مشغول</option>
        <option>مشغول - اختبار</option>
        <option>مشغول - تدريب</option>
        <option>مشغول حالة موجه 10</option>
      </select>
    </div>
    <div class="col">
      <select class="loc-input">
        <option>لا شي</option>
        <option>الشمال</option>
        <option>الوسط</option>
        <option>الشرق</option>
        <option>الجنوب</option>
        <option>ساندي</option>
        <option>بوليتو</option>
      </select>
    </div>
    <div class="col">
      <input class="dist-input" value="${d.dist}" placeholder="توزيع الوحدات" />
    </div>
    <div class="col">
      <select class="type-input">
        <option>لا شي</option>
        <option>سبيد يونت</option>
        <option>دباب</option>
        <option>الهلي</option>
      </select>
    </div>
    <div class="col speed-wrap" style="display:${d.type === "سبيد يونت" ? "block" : "none"}">
      <select class="speed-input">
        <option></option>
        <option>فايبكس</option>
        <option>موتركس</option>
      </select>
    </div>
    <div class="unit-actions">
      <button class="btn muted edit-btn">تعديل</button>
      <button class="btn muted add-partner-btn">إضافة شريك</button>
      <button class="btn muted delete-btn">حذف</button>
    </div>
  `;

  row.querySelector(".status-input").value = d.status;
  row.querySelector(".loc-input").value = d.loc;
  row.querySelector(".type-input").value = d.type;
  row.querySelector(".speed-input").value = d.speed || "";

  // حذف صف
  row.querySelector(".delete-btn").addEventListener("click", () => {
    row.remove();
    updateResult();
    showToast("تم الحذف");
  });

  // إضافة شريك
  row.querySelector(".add-partner-btn").addEventListener("click", () => {
    const p = prompt("أدخل كود الشريك");
    if (p) {
      const codeInput = row.querySelector(".code-input");
      codeInput.value = codeInput.value ? codeInput.value + " + " + p : p;
      updateResult();
      showToast("تم إضافة شريك");
    }
  });

  // تعديل (فتح المودال)
  row.querySelector(".edit-btn").addEventListener("click", () =>
    openModalForRow(row)
  );

  // تغيير نوع (سبيد يونت = إظهار فايبكس/موتركس)
  row.querySelector(".type-input").addEventListener("change", (e) => {
    const wrap = row.querySelector(".speed-wrap");
    if (e.target.value === "سبيد يونت") {
      wrap.style.display = "block";
    } else {
      wrap.style.display = "none";
      row.querySelector(".speed-input").value = "";
    }
    updateResult();
  });

  // تحديث النتيجة عند أي تغيير
  row.querySelectorAll("input, select").forEach((inp) => {
    inp.addEventListener("input", updateResult);
  });

  unitsList.appendChild(row);
  return row;
}

// صف أولي
createUnit();

/* =========================
   أزرار الوحدات
========================= */
$("addUnit").addEventListener("click", () => {
  createUnit();
  showToast("تم إضافة وحدة");
  updateResult();
});

$("clearUnits").addEventListener("click", () => {
  if (confirm("مسح كل الوحدات؟")) {
    unitsList.innerHTML = "";
    updateResult();
    showToast("تم المسح");
  }
});

/* =========================
   المودال
========================= */
function openModalForRow(row) {
  modalRow = row;
  $("m_code").value = row.querySelector(".code-input").value;
  $("m_status").value = row.querySelector(".status-input").value;
  $("m_loc").value = row.querySelector(".loc-input").value;
  $("m_dist").value = row.querySelector(".dist-input").value;
  $("m_type").value = row.querySelector(".type-input").value;
  $("m_speed").value = row.querySelector(".speed-input").value || "";
  $("m_speed_wrap").style.display =
    $("m_type").value === "سبيد يونت" ? "block" : "none";
  $("modal").setAttribute("aria-hidden", "false");
}

function closeModal() {
  $("modal").setAttribute("aria-hidden", "true");
  modalRow = null;
}

$("modalClose").addEventListener("click", closeModal);
$("modalCancel").addEventListener("click", closeModal);

$("m_type").addEventListener("change", () => {
  $("m_speed_wrap").style.display =
    $("m_type").value === "سبيد يونت" ? "block" : "none";
});

$("modalSave").addEventListener("click", () => {
  if (!modalRow) return closeModal();
  modalRow.querySelector(".code-input").value = $("m_code").value.trim();
  modalRow.querySelector(".status-input").value = $("m_status").value;
  modalRow.querySelector(".loc-input").value = $("m_loc").value;
  modalRow.querySelector(".dist-input").value = $("m_dist").value;
  modalRow.querySelector(".type-input").value = $("m_type").value;
  modalRow.querySelector(".speed-input").value = $("m_speed").value;
  modalRow
    .querySelector(".type-input")
    .dispatchEvent(new Event("change"));
  updateResult();
  closeModal();
  showToast("تم حفظ التعديل");
});

/* =========================
   الوقت (استلام / تسليم)
========================= */
startTimeBtn.addEventListener("click", () => {
  startTimeText = new Date().toLocaleTimeString();
  startTimeBtn.innerText = "بداية: " + startTimeText;
  updateResult();
  showToast("تم تسجيل وقت الاستلام");
});

endTimeBtn.addEventListener("click", () => {
  endTimeText = new Date().toLocaleTimeString();
  endTimeBtn.innerText = "انتهاء: " + endTimeText;
  updateResult();
  showToast("تم تسجيل وقت التسليم");
});

/* =========================
   OCR – Tesseract محلي
========================= */
function setProgress(p, status = "") {
  progressBar.style.width = `${Math.round(p * 100)}%`;
  progressText.innerText = `${Math.round(p * 100)}% ${status}`;
  previewWrap.style.display = "block";
}

async function handleFile(file) {
  try {
    previewImg.src = URL.createObjectURL(file);
    previewWrap.style.display = "block";
    setProgress(0.02, "تحميل");

    if (typeof Tesseract === "undefined") {
      showToast(
        "مكتبة Tesseract غير موجودة محلياً. ضع tesseract.min.js داخل مجلد /libs",
        3500
      );
      return;
    }

    const worker = Tesseract.createWorker({
      logger: (m) => {
        if (m && typeof m.progress === "number") {
          setProgress(m.progress, m.status || "");
        }
      },
    });

    await worker.load();
    await worker.loadLanguage("ara+eng");
    await worker.initialize("ara+eng");
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      tessedit_char_whitelist: "0123456789",
    });

    const {
      data: { text },
    } = await worker.recognize(file);
    await worker.terminate();

    setProgress(1, "انتهى");

    const numbers = (text.match(/\d{2,6}/g) || []).map((s) => s.trim());
    if (numbers.length === 0) {
      showToast("لم يتم العثور على أكواد رقمية في الصورة", 3000);
      return;
    }

    const mode = ocrMode.value;
    if (mode === "replace") {
      unitsList.innerHTML = "";
      numbers.forEach((n) => createUnit({ code: n }));
    } else {
      numbers.forEach((n) => createUnit({ code: n }));
    }

    updateResult();
    showToast(`تم استخراج ${numbers.length} كود وتوزيعها`, 2500);
  } catch (err) {
    console.error(err);
    showToast("حصل خطأ أثناء تحليل الصورة");
  } finally {
    setTimeout(() => {
      progressBar.style.width = "0%";
      progressText.innerText = "";
    }, 800);
  }
}

// رفع ملف
fileInput.addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  await handleFile(f);
  fileInput.value = "";
});

// لصق صورة (Ctrl+V)
document.addEventListener("paste", async (e) => {
  if (!e.clipboardData) return;
  for (const item of e.clipboardData.items) {
    if (item.type.indexOf("image") !== -1) {
      const f = item.getAsFile();
      if (f) await handleFile(f);
    }
  }
});

/* =========================
   النتيجة النهائية
========================= */
function updateResult() {
  const lines = [];
  const opsName = $("opsName").value.trim() || "";
  const opsCode = $("opsCode").value.trim() || "";
  const deputy = $("opsDeputy").value.trim() || "";
  const deputyCode = $("opsDeputyCode").value.trim() || "";

  lines.push("📌 استلام العمليات");
  lines.push(
    `اسم العمليات : ${opsName}${opsCode ? " | " + opsCode : ""}`
  );
  lines.push(
    `النائب مركز العمليات : ${deputy}${
      deputyCode ? " | " + deputyCode : ""
    }`
  );
  lines.push("");

  lines.push("القيادات");
  lines.push(leadersArr.length ? leadersArr.join(" - ") : "-");
  lines.push("");

  lines.push("الضباط");
  lines.push(officersArr.length ? officersArr.join(" - ") : "-");
  lines.push("");

  lines.push("مسؤول فترة");
  lines.push(
    managers.length
      ? managers
          .map(
            (m) =>
              (m.name ? m.name + " " : "") + (m.code ? m.code : "")
          )
          .join(" , ")
      : "-"
  );
  lines.push("");

  lines.push("ضباط الصف");
  lines.push(
    ncosArr.length
      ? ncosArr
          .map(
            (n) =>
              (n.name ? n.name + " " : "") + (n.code ? n.code : "")
          )
          .join(" , ")
      : "-"
  );
  lines.push("");

  lines.push("توزيع الوحدات");
  const rows = unitsList.querySelectorAll(".unit-row");
  if (rows.length === 0) {
    lines.push("-");
  } else {
    rows.forEach((r) => {
      const code = r.querySelector(".code-input").value.trim();
      const loc = r.querySelector(".loc-input").value.trim();
      const status = r.querySelector(".status-input").value.trim();
      const dist = r.querySelector(".dist-input").value.trim();
      const type = r.querySelector(".type-input").value.trim();
      const speed = r.querySelector(".speed-input").value.trim();

      if (!code) return;

      // المنطق: لو نوع الهلي/دباب/سبيد يونت نقدر نغيره لاحقاً لو حبيت
      let out = `${code}`;
      if (type && type !== "لا شي") out += ` | ${type}`;
      if (loc && loc !== "لا شي") out += ` | ${loc}`;
      if (status && status !== "في الخدمة") out += ` | ${status}`;
      if (speed) out += ` | ${speed}`;
      if (dist) out += ` | ${dist}`;
      lines.push(out);
    });
  }

  lines.push("");
  lines.push("وحدات سبيد يونت");
  lines.push("-");
  lines.push("");

  lines.push("وحدات دباب");
  lines.push("-");
  lines.push("");

  lines.push("وحدات الهلي");
  lines.push("-");
  lines.push("");

  lines.push("وقت الاستلام: " + (startTimeText || "—"));
  lines.push("وقت التسليم: " + (endTimeText || "—"));
  lines.push("");
  lines.push("تم التسليم إلى :");

  resultArea.innerText = lines.join("\n");
}

/* نسخ النتيجة */
$("copyResult").addEventListener("click", () => {
  navigator.clipboard
    .writeText(resultArea.innerText)
    .then(() => showToast("تم نسخ النتيجة", 1500))
    .catch(() => showToast("فشل النسخ", 1500));
});
