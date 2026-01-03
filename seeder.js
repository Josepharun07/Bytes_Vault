const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Admin = require('./models/Admin');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const seedSuperAdmin = async () => {
    try {
        const email = 'delvinjoseph07@gmail.com';
        const password = 'Black@07';

        // 1. Check/Remove from User Collection (since we are moving logic)
        // To optionally preserve 'User' account logic if they want to be a customer too, we could keep it.
        // But usually super admin is strictly an Admin. 
        // I will checking if it exists in Users and optionally delete or ignore. 
        // Given the prompt "transfer", implying movement, let's remove from User if present to avoid confusion.
        await User.deleteOne({ email });

        // 2. Upsert into Admin Collection
        let admin = await Admin.findOne({ email });

        if (admin) {
            console.log('Super Admin already exists in Admin collection. Updating...');
            admin.role = 'superadmin';
            admin.department = 'Management';
            admin.password = password;
            await admin.save();
            console.log('Super Admin updated.');
        } else {
            console.log('Creating Super Admin in Admin collection...');
            await Admin.create({
                name: 'Super Admin',
                email,
                password,
                role: 'superadmin',
                department: 'Management'
            });
            console.log('Super Admin created.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedSuperAdmin();
