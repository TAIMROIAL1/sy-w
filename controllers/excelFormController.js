const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');

const express = require('express');
const fs = require('fs');
const XLSX = require('xlsx');

exports.addForm = catchAsync(async function(req, res, next) {
    const user = res.locals;

    console.log(user);

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

  // Append new row
  const sheetName = 'Responses';
  let worksheet = workbook.Sheets[sheetName];
  let rows = worksheet ? XLSX.utils.sheet_to_json(worksheet) : [];
  rows.push(data);
  worksheet = XLSX.utils.json_to_sheet(rows);
  workbook.Sheets[sheetName] = worksheet; // overwrite existing sheet

  XLSX.writeFile(workbook, 'responses.xlsx');

  res.status(200).json({
    status: 'success',
    message: 'added sheet'
  });
})