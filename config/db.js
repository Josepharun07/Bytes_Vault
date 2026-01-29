// config/db.js
const mongoose = require('mongoose');

const initiateDataLayer = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`\n\x1b[32m%s\x1b[0m`, `✔ MongoDB Connected Successfully!`);
        console.log(`   🔸 Host: ${conn.connection.host}`);
        console.log(`   🔸 Database: ${conn.connection.name}`);
        console.log(`   🔸 State: Connected`);

    } catch (error) {
        console.error(`\x1b[31m%s\x1b[0m`, `❌ Database Connection Failed: ${error.message}`);
        console.log(error);
        process.exit(1);
    }
};

module.exports = initiateDataLayer;