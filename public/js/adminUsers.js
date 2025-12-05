'use strict'

const searchBtn = document.getElementById('searchBtn');
const searchBar = document.getElementById('searchName');

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
  const users = await ajaxCall('http://127.0.0.1:3000/api/v1/forms/get-users', 'POST', {
    searchMethod: 'Date',
    searchValue: 'smatak'
  })

  const body = document.getElementById('dob-body');
  renderUsers(body, users.users);
}

getUsersByDOB();