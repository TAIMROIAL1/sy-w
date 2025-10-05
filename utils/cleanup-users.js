// cleanup-users.js
const mongoose = require('mongoose');
const User = require('../models/userModel');
const dotenv = require('dotenv');
dotenv.config({path: '../config.env'});

console.log(process.env.DATABASE_CONNECT_LINK);

mongoose.connect(process.env.DATABASE_CONNECT_LINK, {}).then(async () => {
    console.log('DB connected successfully');
    try {
        const result = await User.deleteMany({ name: { $ne: 'taimroial' } });
        console.log(`Deleted ${result.deletedCount} users.`);
        
        await mongoose.disconnect();
        console.log("Dissconnected");        
    } catch(err) {
        console.log(err);
    }
})