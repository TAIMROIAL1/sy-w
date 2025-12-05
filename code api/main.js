import { nanoid } from "https://cdn.jsdelivr.net/npm/nanoid/nanoid.js";

const domain = "http://127.0.0.1:3000";
// const domain = 'https://studyou.online'

// Codes
const categoryInput = document.getElementById("category");
const codeLengthInput = document.getElementById("length");
const countInput = document.getElementById("count");
const codeValueInput = document.getElementById("value");

const generateCodesBtn = document.getElementById("generate");

// login
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("login");

// Categories
const categoriesContainer = document.querySelector('.categs');

const categoryCodesCount = document.getElementById('categoryCount');

const categoryActiveCodesCount = document.getElementById('categoryActiveCount');

// displayed codes
const codesSection = document.getElementById('codes-section');

const tableBody = document.getElementById('codeTable');

// Statistics
const allCodesLabel = document.getElementById('all-codes');
const allActiveCodesLabel = document.getElementById('all-active-codes');

// State
const allCodes = [];

const ajaxCall = async function (url, method, data = undefined) {
  const fetchOpts = {};
  fetchOpts.method = method;
  fetchOpts.headers = { "Content-Type": "application/json" };
  fetchOpts.credentials = "include";
  if (data) fetchOpts.body = JSON.stringify(data);
  const response = await fetch(url, fetchOpts);

  if (!response.ok) {
    throw new Error(`HTTP error! Status ${response.status}`);
  }

  if(response.status === 204) {
    return 'deleted';
  }
  const text = await response.text();
  try {
    return JSON.parse(text).data;
  } catch (err) {
    console.error(`Failed to parse JSON: `, text);
    throw new Error(`Invalid JSON response`);
  }
};

const handleGenerateCodes = async function () {
  const category = categoryInput.value;
  const codeLength = +codeLengthInput.value;
  const count = +countInput.value;
  const codeValue = +codeValueInput.value;
  if(!codeValue || !category || !codeLength || !count) return;
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = nanoid(codeLength);
    codes.push({
      code,
      value: codeValue,
      category,
    });
  }
  await ajaxCall(`${domain}/api/v1/codes/create-codes`, "POST", {
    codes,
  });

  displayCategories();
};

const handleLogin = async function () {
  const username = usernameInput.value;
  const password = passwordInput.value;

  // await ajaxCall(`${domain}/api/v1/users/login`, "POST", {
  //   name: username,
  //   password,
  //   screenWidth: screen.width,
  //   screenHeight: screen.height,
  //   userAgent: navigator.userAgent,
  // });

  await ajaxCall(`${domain}/api/v1/users/update-certain-password`, "POST", {
    userID: username,
    password,
  });

  usernameInput.value = "";
  passwordInput.value = "";
};

const updateAllCodes = function() {
   allCodesLabel.querySelector('span').textContent = allCodes.length;
  allActiveCodesLabel.querySelector('span').textContent = allCodes.filter(c => c.activated === true).length;
}

const updateCategoryCodes = function(codesToLoad) {
  categoryCodesCount.querySelector('span').textContent = codesToLoad.length;
  
  categoryActiveCodesCount.querySelector('span').textContent = codesToLoad.filter(c => c.activated === true).length;
}
generateCodesBtn.addEventListener("click", handleGenerateCodes);

loginBtn.addEventListener("click", handleLogin);


// Init

const handleCodesClick = async function(e) {
  const clicked = e.target.closest('.delete-btn');
  if(!clicked) return;

  
  const code = clicked.closest('tr').querySelector('.code-value');

  const deletecount = +code.dataset.deletecount;
  if(deletecount !== 2) {
    code.dataset.deletecount++;
    return;
  } else {
    const result = await ajaxCall(`${domain}/api/v1/codes/${code.textContent}`, "DELETE")

    if(result === 'deleted') {
      allCodes.splice([allCodes.findIndex(c => c.code === code.textContent)], 1);
      updateAllCodes();
      categoryCodesCount.querySelector('span').textContent--;
      if(code.closest('tr').querySelector('#activated').textContent === 'Yes')
      categoryActiveCodesCount.textContent--;
    if(categoryCodesCount.querySelector('span').textContent == 0) {
      
      [...document.querySelectorAll('.categ-box')].find(c => c.textContent.trim() === code.closest('tr').querySelector('#category').textContent.trim()).remove()

      codesSection.classList.add('hidden');
      categoryCodesCount.classList.add('hidden');
      categoryActiveCodesCount.classList.add('hidden');
    }
      code.closest('tr').remove();

    }
    else {
      code.dataset.deletecount = 0;
    }
  }
}

const renderCodes = function(codes) {
  console.log(codes.map(c => c.code));
  [...tableBody.querySelectorAll('tr')].forEach(tr => tr.remove());
  codes.forEach(item => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
    <td class="code-value" data-deletecount= 0>${item.code}</td>
    <td>${item.value}</td>
    <td id="activated">${item.activated ? 'Yes' : 'No'}</td>
    <td id="category">${item.category}</td>
    <td><button class="delete-btn">Delete</button></td>
    `;
    
    tableBody.appendChild(row);
  });
  
  
  codesSection.classList.remove('hidden');
}

const handleCategoriesClick = function(e) {
  const clicked = e.target.closest('.categ-box');
  if(!clicked) return;
  
  const category = clicked.textContent.trim();
  
  const codesToLoad = allCodes.filter(c => c.category === category);
  
  codesSection.classList.remove('hidden');
  
  updateCategoryCodes(codesToLoad);
  
  categoryCodesCount.classList.remove('hidden');
  categoryActiveCodesCount.classList.remove('hidden');
  
  renderCodes(codesToLoad);
}

const fetchCodes = async function () {
  const codes = await ajaxCall(`${domain}/api/v1/codes/`, "GET");
  
  allCodes.length = 0;
  allCodes.push(...codes.codes);
  
  updateAllCodes();
  return codes.codes;
};

const getCategories = function (codes) {
  const categories = [...new Set(codes.map((c) => c.category))];
  return categories;
};

const createCategories = function (categories) {
  
  [...document.querySelectorAll('.categ-box')].forEach(c => c.remove());
  
  categories.forEach((c) => {
    const html = `
    <div class="categ-box">
    ${c}
    </div>
    `;
    categoriesContainer.insertAdjacentHTML('beforeend', html);
  });
};

const displayCategories = async function () {
  const codes = await fetchCodes();
  
  const categories = getCategories(codes);
  
  createCategories(categories);
  
  categoriesContainer.addEventListener('click', handleCategoriesClick);
};

codesSection.addEventListener('click', handleCodesClick);

displayCategories();
