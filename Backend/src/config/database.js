const mongoose = require('mongoose')

async function main(){
    mongoose.connect(process.env.DB_URL)
}

module.exports = main