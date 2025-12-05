const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');

const User = require('./../models/userModel');

const express = require('express');
const fs = require('fs');
const XLSX = require('xlsx');

exports.addForm = catchAsync(async function(req, res, next) {
    const user = res.locals;

    if(!user) return res.status(400).json({
      status: 'fail',
      message: "انت غير مسجل!"
    })

    const data = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    fatherName: req.body.fatherName,
    motherName: req.body.motherName,
    phone: req.body.phone,
    dob: req.body.dob,
    issues: req.body.issues,
    codeProblems: req.body.codeProblems,
    satisfaction: req.body.satisfaction
  };
  // Check if Excel file exists
  let workbook;
  if (fs.existsSync('responses.xlsx')) {
    workbook = XLSX.readFile('responses.xlsx');
  } else {
    workbook = XLSX.utils.book_new();
  }

  const sheetName = 'Responses';

// ✅ If sheet exists, load it. Otherwise create a new empty sheet.
let worksheet = workbook.Sheets[sheetName];
let rows = worksheet ? XLSX.utils.sheet_to_json(worksheet) : [];

// ✅ Add the new row
rows.push(data);

// ✅ Convert updated rows back to a sheet
worksheet = XLSX.utils.json_to_sheet(rows);

// ✅ Write the sheet back into the workbook
workbook.Sheets[sheetName] = worksheet;

// ✅ Ensure sheet is listed in SheetNames
if (!workbook.SheetNames.includes(sheetName)) {
  workbook.SheetNames.push(sheetName);
}

// ✅ Save file
XLSX.writeFile(workbook, 'responses.xlsx');

  res.status(200).json({
    status: 'success',
    message: 'added sheet'
  });
})

function readResponses(sm, sv) {
  if (!fs.existsSync('responses.xlsx')) {
    return []; // No file yet → return empty array
  }

  const workbook = XLSX.readFile('responses.xlsx');
  const sheetName = 'Responses';
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return []; // Sheet doesn't exist yet
  }

  // ✅ Convert sheet to array of objects
  const rows = XLSX.utils.sheet_to_json(worksheet);
  
  if(sm === 'Name'){
    const users = rows.filter(row => row.firstName.includes(sv));
    
    return users;
  }
  else if(sm === 'Date') {
    const date = new Date();
    const users = rows.filter(row => {
      const parts = row.dob.split('-');
      const [_, day, month] = parts;

      const targetDate = new Date(
        date.getFullYear(),
      Number(month) - 1,
      Number(day));

      const diffMs = targetDate - date;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if(diffDays <= 5 && diffDays > -1)
          return row;
    })
    console.log(users);
    return users;
  }
}

exports.getUsers = catchAsync(async function(req, res, next) {
  const {searchMethod, searchValue} = req.body;

  const users = readResponses(searchMethod, searchValue);

     if(users.length > 0)
      res.status(200).json({
      status: 'success',
      users
     })
     else
      res.status(400).json({
    status: 'fail',
  message: 'no results'})
})