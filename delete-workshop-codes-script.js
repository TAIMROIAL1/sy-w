const dotenv = require('dotenv')
const mongoose = require('mongoose');
const Code = require('./models/codeModel');
const User = require('./models/userModel')

dotenv.config({path: "./config.env"});

mongoose.connect(process.env.DATABASE_CONNECT_LINK, {}).then(() => {
  console.log('DB connected successfully');
});

(
    async function(){
        const deleted = [];
        const result = await User.updateMany({workshops: "691edf42fd8044d1c944208f"}, {$pull: {workshops: "691edf42fd8044d1c944208f"}});
        console.log(result); 
        
    }()
)

// mongoose.disconnect().then(() => {
//     console.log("DB disconnected successfully");
// })