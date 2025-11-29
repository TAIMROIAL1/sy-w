const firstName = document.getElementById('firstName');
const lastName = document.getElementById('lastName');
const fatherName = document.getElementById('fatherName');
const motherName = document.getElementById('motherName');
const phone = document.getElementById('phone');
const birthDate = document.getElementById('dob');
const issues = document.getElementById('issues');
const codeProblems = document.getElementById('codeProblems');
const satisfaction = document.getElementById('satisfaction');

const submitBtn = document.getElementsByTagName('button')[0];

const { domain } = document.body.dataset;

const ajaxCall = async function(url, method, data = undefined) {
  const fetchOpts = {};
  fetchOpts.method = method;
  fetchOpts.headers = {'Content-Type': 'application/json'};
  if(data) fetchOpts.body = JSON.stringify(data);
  const data2 = await fetch(url, fetchOpts);
  return await data2.json();
}

submitBtn.addEventListener('click', async function(e) {
    e.preventDefault();
     fn = firstName.value;
     ln = lastName.value;
     fathern = fatherName.value;
     mn = motherName.value;
     phoneNumber = phone.value;
     dob = birthDate.value;
     techIssues = issues.value;
     codeIssues = codeProblems.value;
     satLevel = satisfaction.value;

    const Obj = {
        firstName: fn,
        lastName: ln,
        fatherName: fathern,
        motherName: mn,
        phone: phoneNumber,
        dob,
        issues: techIssues,
        codeProblems: codeIssues,
        satisfaction: satLevel
    }

    const result = await ajaxCall(`${domain}/api/v1/forms`, 'POST', Obj);
    
    if(result.status === 'success') location.assign('/')
})