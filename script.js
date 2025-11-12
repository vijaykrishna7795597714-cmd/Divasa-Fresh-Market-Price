/* Divasa Fresh Market Rates Update - vanilla JS
   - Autosave to localStorage
   - Enter moves to next price input
   - Submit: POST to Google Apps Script (optional) or download CSV
*/

const initialData = [
  { category: 'ROOTS & TUBERS', unit: 'KG', items: ['Potato Medium','Sweet Potato','Baby Potato','Elephant Yam','Carrot Ooty','Carrot Bangalore','Beetroot','Radish White','Knol Khol','Tapioca','Raw Turmeric','Yam'] },
  { category: 'ONIONS & ALLIUMS', unit: 'KG', items: ['Onion Medium','Onion Premium','Sambar Onion','Spring Onion','Garlic','Ginger Fresh','Shallots'] },
  { category: 'FRUITS & PODS', unit: 'KG', items: ['Beans Ooty','Beans Haricot','Broadbeans','Clusterbeans','Okra (Ladies Finger)','Lemon','Papaya','Green Peas','Flat Beans (Avarekkai)'] },
  { category: 'GOURDS & CUCURBITS', unit: 'KG', items: ['Bittergourd','Bottlegourd','Ashgourd','Chow Chow Ooty','Ivy Gourd','Ridgegourd','Snakegourd','Pumpkin','Zucchini Green','Cucumber','White Pumpkin'] },
  { category: 'LEAFY GREENS & HERBS', unit: 'BUNCH', items: ['Palak','Araikeerai','Methi Leaves (Fenugreek)','Coriander Leaves','Mint Leaves','Curry Leaves','Banana Leaf','Spinach','Drumstick Leaves','Red Dantu','Celery'] },
  { category: 'CABBAGE, CAULIFLOWER & BROCCOLI', unit: 'KG', items: ['Cabbage','Cauliflower','Broccoli','Red Cabbage','Chinese Cabbage'] },
  { category: 'PEPPERS & TOMATOES', unit: 'KG', items: ['Tomato Medium','Capsicum Green Medium','Bajji Chilli','Green Chilli','Red Capsicum','Yellow Capsicum','Cherry Tomato'] },
  { category: 'MISCELLANEOUS & EXOTIC', unit: 'KG', items: ['Button Mushroom','Drumsticks','Brinjal','Baby Corn','Sweet Corn Fresh','Banana Flower','Banana Yelakki','Coconut','Zucchini Yellow','Lettuce (Iceberg)','Lettuce (Romaine)','Avocado','Sweet Potato Purple','Baby Spinach','Asparagus'] }
];

const STORAGE_KEY = 'divasaPrices_v1';
let data = {}; // shape: data[category][item] = '25' (string number)
let flatInputs = []; // ordered array of input elements for Enter navigation

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse saved data', e);
    data = {};
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save data', e);
  }
}

function buildUI() {
  const container = document.getElementById('tables');
  container.innerHTML = '';
  flatInputs = [];

  initialData.forEach(block => {
    const card = document.createElement('div');
    card.className = 'card';

    const h = document.createElement('h2');
    h.textContent = block.category;
    card.appendChild(h);

    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>ITEM</th><th style="text-align:center">UNIT</th><th style="text-align:center">PRICE</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    block.items.forEach(item => {
      const tr = document.createElement('tr');

      const tdItem = document.createElement('td');
      tdItem.textContent = item;
      tr.appendChild(tdItem);

      const tdUnit = document.createElement('td');
      tdUnit.className = 'unit-cell';
      tdUnit.textContent = block.unit;
      tr.appendChild(tdUnit);

      const tdPrice = document.createElement('td');
      tdPrice.style.textAlign = 'center';

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'input-price';
      input.placeholder = 'Enter price';
      const existing = (data[block.category] && data[block.category][item]) ? data[block.category][item] : '';
      input.value = existing;
      // update data on input
      input.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (!data[block.category]) data[block.category] = {};
        data[block.category][item] = val;
        saveData();
        setStatus('Saved locally');
      });

      // Enter navigation: move to next input
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const idx = flatInputs.indexOf(e.target);
          const next = flatInputs[idx + 1];
          if (next) next.focus();
        }
      });

      tdPrice.appendChild(input);
      tr.appendChild(tdPrice);
      tbody.appendChild(tr);

      flatInputs.push(input);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    card.appendChild(wrap);
    container.appendChild(card);
  });
}

function csvEscapeField(s) {
  if (s == null) return '';
  const str = String(s);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function buildCSV() {
  const rows = [['Category','Item','Unit','Price']];
  initialData.forEach(block => {
    block.items.forEach(item => {
      const raw = (data[block.category] && data[block.category][item]) ? data[block.category][item] : '';
      const price = raw === '' ? '' : `₹ ${raw}`;
      rows.push([block.category, item, block.unit, price]);
    });
  });
  return rows.map(r => r.map(csvEscapeField).join(',')).join('\n');
}

function downloadCSVFile(filename='DivasaFreshMarketRates.csv') {
  try {
    const csv = buildCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('CSV downloaded.');
  } catch (err) {
    console.error('Download error', err);
    setStatus('CSV download failed.');
  }
}

function setStatus(msg, timeout=3000) {
  const el = document.getElementById('status');
  el.textContent = msg || '';
  if (timeout>0) {
    clearTimeout(el._t);
    el._t = setTimeout(()=>{ el.textContent = ''; }, timeout);
  }
}

async function postToAppsScript(url) {
  setStatus('Sending to Google Sheet...');
  const payload = { rows: [] };
  initialData.forEach(block => {
    block.items.forEach(item => {
      const raw = (data[block.category] && data[block.category][item]) ? data[block.category][item] : '';
      const price = raw === '' ? '' : `₹ ${raw}`;
      payload.rows.push({ category: block.category, item, unit: block.unit, price });
    });
  });

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    setStatus('Saved to Google Sheet successfully.');
    return true;
  } catch (err) {
    console.error('Apps Script POST failed', err);
    setStatus('Failed to save to Google Sheet: ' + (err.message||err));
    return false;
  }
}

function wireButtons() {
  const submitBtn = document.getElementById('submitBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const appsInput = document.getElementById('appsScriptUrl');

  submitBtn.addEventListener('click', async () => {
    const url = appsInput.value.trim();
    if (url) {
      const ok = await postToAppsScript(url);
      if (!ok) {
        // fallback to CSV
        downloadCSVFile();
      }
    } else {
      downloadCSVFile();
    }
  });

  downloadBtn.addEventListener('click', () => {
    downloadCSVFile();
  });
}

// Initialize
function init() {
  loadData();
  buildUI();
  wireButtons();
  setStatus('Ready', 1200);
}

document.addEventListener('DOMContentLoaded', init);
