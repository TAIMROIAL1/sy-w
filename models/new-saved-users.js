const mongoose = require('mongoose');

const newUsersSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Enter First Name']
    },
    lastName: {
        type: String,
        required: [true, 'Enter Last Name']
    },
    fathersName: {
        type: String,
        required: [true, 'Enter Father`s name']
    },
    MothersName: {

    },
    codesProblems: {

    },
})