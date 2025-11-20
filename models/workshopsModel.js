const mongoose = require('mongoose');

const workshopsSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'الرجاء ادخال اسم للورشة']
    },
    chapter: {
        type: String,
        required: [true, 'الرجاء ادخال الفصل'],
        default: 'First-Chapter'
    }, 
    photoUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    active: {
        type: Boolean,
        default: false
    },

});

const Workshop = mongoose.model('Workshop', workshopsSchema);

module.exports = Workshop;