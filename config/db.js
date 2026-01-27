
const mongoose = require('mongoose');

const initiateDataLayer = async () => {
    try {
        const connectionString = process.env.MONGO_URI;
        
        const connectionInstance = await mongoose.connect(connectionString, {
            
        });

        console.log(`📡 DataStore Active: Host ${connectionInstance.connection.host}`);
    } catch (systemFailure) {
        console.error(`❌ DataStore Failure: ${systemFailure.message}`);
        process.exit(1); 
    }
};

module.exports = initiateDataLayer;