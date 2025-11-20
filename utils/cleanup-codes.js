// cleanup-codes.js
const mongoose = require('mongoose');
// const Code = require('../models/codeModel');
const Workshop = require('../models/workshopsModel');
const dotenv = require('dotenv');
dotenv.config({path: '../config.env'});

console.log(process.env.DATABASE_CONNECT_LINK);

mongoose.connect(process.env.DATABASE_CONNECT_LINK, {}).then(async () => {
    console.log('DB connected successfully');
    try {
        // const result = await Code.deleteMany();
        // console.log(`Deleted ${result.deletedCount} codes.`);
        const result = await Workshop.insertMany([{
            title: "ورشة العصبية",
            chapter: 'First-Chapter',
            description: "ورشة العصبية لكل الأبحاث",
            value: 100,
            active: true,
            photoUrl: 'neurologyWorkshop.webp'
        },{
            title: "ورشة الهرمونات",
            chapter: 'First-Chapter',
            description: "ورشة الهرمونات لكل الأبحاث",
            value: 100,
            active: false,
            photoUrl: 'hormonesWorkshop.webp'
        }]);

        //////////////////////////////////////////

        // console.log(result);
        // const result = await Workshop.collection.dropIndex('title_1');
        // console.log(result);

        // const result2 = await Workshop.collection.dropIndex('name_1');
        // console.log(result2);
        // const result = await Workshop.collection.getIndexes();
        // console.log(result);

        await mongoose.disconnect();
        console.log("Dissconnected");        
    } catch(err) {
        console.log(err);
    }
})