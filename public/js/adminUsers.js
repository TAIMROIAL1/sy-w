'use strict'

const searchBtn = document.getElementById('searchBtn');
const searchBar = document.getElementById('searchName');
const btnsContainer = document.querySelector('.btns');
const pagesDiv = document.querySelector('.pages');
const currentCounterDiv = document.querySelector('.current-counter')

const domain = document.body.dataset.domainid;

const allUsers = [];
let counter = 0;
let pages = 0;
const pageLength = 3;

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
  <td>${user.firstName}</td>
  <td>${user.lastName}</td>
  <td>${user.phone}</td>
  <td>${user.dob}</td>
  <td>${user.fatherName}</td>
  </tr>
  `
  });

  body.insertAdjacentHTML('beforeend', html);
}

const getUsersByName = async function() {
    const users = await ajaxCall('http://127.0.0.1:3000/api/v1/forms/get-users', 'POST', {
        searchMethod: "Name",
        searchValue: searchBar.value
    });
    const body = document.getElementById('search-body');

    renderUsers(body, users.users ?? []);
}

searchBtn.addEventListener('click', getUsersByName);

const getUsersByDOB = async function() {
  const users = await ajaxCall(`${domain}/api/v1/forms/get-users`, 'POST', {
    searchMethod: 'Date',
    searchValue: 'smatak'
  })

  const body = document.getElementById('dob-body');
  renderUsers(body, users.users);
}

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

getUsersByDOB();
getAllUsers();