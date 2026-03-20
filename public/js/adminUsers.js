'use strict'

const searchBtn = document.getElementById('searchBtn');
const searchBar = document.getElementById('searchName');
const btnsContainer = document.querySelector('.btns');
const pagesDiv = document.querySelector('.pages');
const currentCounterDiv = document.querySelector('.current-counter')
const searchResultsTable = document.getElementById('resultsTable');
const allResultsTable = document.getElementById('allResults')
const searchOptionsBar = document.querySelector('.search-options')
const loginBtn = document.getElementById("login");

const errorMessage = document.querySelector('.error-message');

const domain = document.body.dataset.domainid;

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");


const allUsers = [];
let counter = 0;
let pages = 0;
const pageLength = 3;

let timer;

const ajaxCall = async function(url, method, data = undefined) {
  const fetchOpts = {};
  fetchOpts.method = method;
  fetchOpts.headers = {'Content-Type': 'application/json'};
  if(data) fetchOpts.body = JSON.stringify(data);
  const data2 = await fetch(url, fetchOpts);
  return await data2.json();
}

function renderUsers(body, users) {
  let html = ``;
  body.innerHTML = '';

  if(users.length === 0) return;

  users.forEach(user => {
    html += `<tr>
  <td class="username">${user.name}</td>
  <td>${user.email}</td>
  <td>${user.value}</td>
  <td class="user-active">${user.active}</td>
  <td class="activate-btn">activate</td> 
  </tr>
  `
  });

  body.insertAdjacentHTML('beforeend', html);
}

const getUsersByValue = async function() {

      if(timer) {
        errorMessage.classList.add('hidden');
        clearInterval(timer);
        timer = undefined;
      }

    const searchMethod = [...document.querySelectorAll('.search-option-btn')].find(btn => btn.classList.contains('selected')).textContent;

    const res = await ajaxCall(`${domain}/api/v1/forms/get-users`, 'POST', {
        searchMethod,
        searchValue: searchBar.value
    });
    const body = document.getElementById('search-body');

    if(res.status === 'success')
      renderUsers(body, res.users ?? []);

    else{
      errorMessage.textContent = res.message;
      errorMessage.classList.remove('hidden');

      timer = setInterval(() => {
        errorMessage.classList.add('hidden')
        timer = undefined;
      }, 6000);
    }

}

const handleActivate = async function(e) {
  const { target } = e;

  const activateBtn = target.closest('.activate-btn');
  if(!activateBtn) return;

  const username = activateBtn.closest('tr').querySelector('.username').textContent;

  const res = await ajaxCall(`${domain}/api/v1/users/activate-user`, 'POST', {username});

  if(res.status === 'success')
    activateBtn.closest('tr').querySelector('.user-active').textContent = 'true'

}

const handleLogin = async function () {
  const username = usernameInput.value;
  const password = passwordInput.value;

  await ajaxCall(`${domain}/api/v1/users/update-certain-password`, "POST", {
    userID: username,
    password,
  });

  usernameInput.value = "";
  passwordInput.value = "";
};


searchBtn.addEventListener('click', getUsersByValue);

const getAllUsers = async function() {
  const users = await ajaxCall(`${domain}/api/v1/forms/get-users`, 'POST', {
    searchMethod: 'All',
    searchValue: 'smatak'
  })

  allUsers.push(...users.users);

  pages = Math.ceil(allUsers.length / pageLength);
  pagesDiv.textContent = pages;
  currentCounterDiv.textContent = 1;
  const body = document.getElementById('all-body');
  renderUsers(body, users.users.slice(0, pageLength));
}

btnsContainer.addEventListener('click', function(e) {
  const {target} = e;

  console.log(target);

  if(!target.classList.contains('scroll-btn')) return;

  if(target.id === 'left-btn') {
    if(counter === 0) counter = pages;
    else counter--;
  }

  else if(target.id === 'right-btn') {
    if(counter === pages - 1) counter = 0; 
    else counter++;
  }

  currentCounterDiv.textContent = counter + 1;
  const body = document.getElementById('all-body');

  console.log(counter);
  console.log(allUsers);
  renderUsers(body, allUsers.slice(counter * pageLength, counter * pageLength + pageLength))
})

loginBtn.addEventListener("click", handleLogin);

searchResultsTable.addEventListener('click', handleActivate);
allResultsTable.addEventListener('click', handleActivate);

searchOptionsBar.addEventListener('click', function(e) {
  const { target } = e;

  const searchOptionBtn = target.closest('.search-option-btn');
  if(!searchOptionBtn) return;

  [...document.querySelectorAll('.search-option-btn')].forEach(btn => btn.classList.remove('selected'))
  searchOptionBtn.classList.add('selected');
})

getAllUsers();