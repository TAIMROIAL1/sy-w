(() => {
  const { PDFDocument } = window.PDFLib;
  const $ = id => document.getElementById(id);

  const input = $('pdf-input');
  const drop = $('drop');
  const rangesBox = $('ranges');
  const errorBox = $('ranges-error');
  const splitBtn = $('btn-split');
  const resultsCard = $('results-card');
  const resultsBox = $('results');

  let srcBytes = null;
  let pageCount = 0;
  let baseName = 'file';
  let outputs = [];

  const formatSize = bytes => bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  const safeName = name => (name.trim() || 'part').replace(/[\\/:*?"<>|]+/g, '-').replace(/\.pdf$/i, '');

  const showError = msg => {
    errorBox.textContent = msg;
    errorBox.classList.toggle('hidden', !msg);
  };

  const renumber = () => {
    [...rangesBox.children].forEach((row, i) => {
      row.querySelector('.num').textContent = i + 1;
    });
  };

  const updateCount = row => {
    const from = +row.querySelector('.from').value;
    const to = +row.querySelector('.to').value;
    const ok = Number.isInteger(from) && Number.isInteger(to) && from >= 1 && to >= from && to <= pageCount;
    row.querySelector('.from').classList.toggle('invalid', !ok);
    row.querySelector('.to').classList.toggle('invalid', !ok);
    row.querySelector('.count').textContent = ok ? `${to - from + 1} صفحة` : `النطاق يجب أن يكون بين 1 و ${pageCount}`;
  };

  const addRow = (from = 1, to = pageCount, name = '') => {
    const row = document.createElement('div');
    row.className = 'range-row';
    row.innerHTML = `
      <span class="num"></span>
      <input class="name" type="text" placeholder="اسم الملف">
      <input class="from" type="number" min="1" dir="ltr">
      <input class="to" type="number" min="1" dir="ltr">
      <button class="icon-btn" type="button" title="حذف"><i class="fa-solid fa-xmark"></i></button>
      <span class="count"></span>`;
    row.querySelector(".name").value = name || `${baseName} (${from === to ? from : `${from}-${to}`})`;
    row.querySelector('.from').value = from;
    row.querySelector('.to').value = to;
    row.querySelector('.from').max = row.querySelector('.to').max = pageCount;
    rangesBox.appendChild(row);
    renumber();
    updateCount(row);
  };

  const setRanges = ranges => {
    rangesBox.innerHTML = '';
    ranges.forEach(([from, to]) => addRow(from, to));
    showError('');
  };

  const loadFile = async file => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      $('file-info').textContent = 'الملف يجب أن يكون PDF';
      return;
    }
    $('file-info').textContent = 'جارٍ قراءة الملف...';
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      srcBytes = bytes;
      pageCount = doc.getPageCount();
      baseName = safeName(file.name);
    } catch (err) {
      console.error(err);
      srcBytes = null;
      $('file-info').textContent = 'تعذر قراءة الملف، تأكد أنه PDF سليم';
      $('ranges-card').classList.add('disabled');
      return;
    }
    $('file-info').textContent = `${file.name} — ${formatSize(file.size)}`;
    $('page-count').textContent = `${pageCount} صفحة`;
    $('ranges-card').classList.remove('disabled');
    resultsCard.classList.add('hidden');
    setRanges([[1, pageCount]]);
  };

  input.addEventListener('change', () => loadFile(input.files[0]));
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));

  rangesBox.addEventListener('input', e => {
    const row = e.target.closest('.range-row');
    if (row && !e.target.classList.contains('name')) updateCount(row);
  });
  rangesBox.addEventListener('click', e => {
    const btn = e.target.closest('.icon-btn');
    if (!btn) return;
    btn.closest('.range-row').remove();
    renumber();
  });

  $('btn-add').addEventListener('click', () => {
    const last = rangesBox.lastElementChild;
    const start = last ? Math.min(+last.querySelector('.to').value + 1, pageCount) : 1;
    addRow(start, pageCount);
  });
  $('btn-clear').addEventListener('click', () => { rangesBox.innerHTML = ''; });

  $('btn-every').addEventListener('click', () => {
    const n = parseInt($('every-n').value, 10);
    if (!(n >= 1)) return showError('أدخل عدد صفحات صحيح');
    const ranges = [];
    for (let from = 1; from <= pageCount; from += n) ranges.push([from, Math.min(from + n - 1, pageCount)]);
    setRanges(ranges);
  });

  $('btn-text').addEventListener('click', () => {
    const parts = $('ranges-text').value.split(/[,،\s]+/).filter(Boolean);
    const ranges = [];
    for (const part of parts) {
      const m = part.match(/^(\d+)(?:-(\d+))?$/);
      if (!m) return showError(`نطاق غير صحيح: ${part}`);
      ranges.push([+m[1], +(m[2] || m[1])]);
    }
    if (!ranges.length) return showError('اكتب نطاقًا واحدًا على الأقل، مثل 1-5, 6-10');
    setRanges(ranges);
  });

  const readRanges = () => {
    const rows = [...rangesBox.children];
    if (!rows.length) throw new Error('أضف نطاقًا واحدًا على الأقل');
    const used = new Map();
    return rows.map((row, i) => {
      const from = +row.querySelector('.from').value;
      const to = +row.querySelector('.to').value;
      if (!(Number.isInteger(from) && Number.isInteger(to) && from >= 1 && to >= from && to <= pageCount)) {
        throw new Error(`النطاق رقم ${i + 1} غير صحيح (الصفحات من 1 إلى ${pageCount})`);
      }
      let name = safeName(row.querySelector('.name').value);
      const seen = used.get(name.toLowerCase()) || 0;
      used.set(name.toLowerCase(), seen + 1);
      if (seen) name = `${name} (${seen + 1})`;
      return { from, to, name: `${name}.pdf` };
    });
  };

  const download = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const renderResults = () => {
    resultsBox.innerHTML = '';
    outputs.forEach((out, i) => {
      const item = document.createElement('div');
      item.className = 'result';
      item.innerHTML = `
        <i class="fa-solid fa-file-pdf"></i>
        <div class="info"><b></b><span></span></div>
        <button class="btn green" type="button"><i class="fa-solid fa-download"></i> تنزيل</button>`;
      item.querySelector('b').textContent = out.name;
      item.querySelector('span').innerHTML = `الصفحات <bdi dir="ltr">${out.from}-${out.to}</bdi> • <bdi dir="ltr">${formatSize(out.blob.size)}</bdi>`;
      item.querySelector('button').addEventListener('click', () => download(outputs[i].blob, outputs[i].name));
      resultsBox.appendChild(item);
    });
    resultsCard.classList.remove('hidden');
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  splitBtn.addEventListener('click', async () => {
    let ranges;
    try {
      ranges = readRanges();
    } catch (err) {
      return showError(err.message);
    }
    showError('');
    splitBtn.disabled = true;
    const label = splitBtn.innerHTML;
    try {
      const src = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
      outputs = [];
      for (const [i, r] of ranges.entries()) {
        splitBtn.textContent = `جارٍ إنشاء الملف ${i + 1} من ${ranges.length}...`;
        const doc = await PDFDocument.create();
        const indices = Array.from({ length: r.to - r.from + 1 }, (_, k) => r.from - 1 + k);
        (await doc.copyPages(src, indices)).forEach(p => doc.addPage(p));
        doc.setTitle(r.name.replace(/\.pdf$/i, ''));
        outputs.push({ ...r, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
      }
      renderResults();
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء تقسيم الملف');
    } finally {
      splitBtn.disabled = false;
      splitBtn.innerHTML = label;
    }
  });

  $('btn-zip').addEventListener('click', async () => {
    if (!outputs.length) return;
    const btn = $('btn-zip');
    btn.disabled = true;
    try {
      const zip = new JSZip();
      outputs.forEach(out => zip.file(out.name, out.blob));
      download(await zip.generateAsync({ type: 'blob' }), `${baseName}.zip`);
    } finally {
      btn.disabled = false;
    }
  });
})();
