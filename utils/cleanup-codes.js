// cleanup-codes.js
const mongoose = require('mongoose');
const Code = require('../models/codeModel');
const dotenv = require('dotenv');
dotenv.config({path: '../config.env'});

console.log(process.env.DATABASE_CONNECT_LINK);

mongoose.connect(process.env.DATABASE_CONNECT_LINK, {}).then(async () => {
    console.log('DB connected successfully');
    try {
        const result = await Code.deleteMany();
        console.log(`Deleted ${result.deletedCount} codes.`);
        
        await mongoose.disconnect();
        console.log("Dissconnected");        
    } catch(err) {
        console.log(err);
    }
})