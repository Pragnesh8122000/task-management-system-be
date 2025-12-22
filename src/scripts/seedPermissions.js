import mongoose from 'mongoose';
import Permission from '../models/permissions.js';
import Role from '../models/roleModel.js';
import dotenv from 'dotenv';
dotenv.config();

const permissionsData = [
    { name: 'task_create', description: 'Create a task' },
    { name: 'task_read', description: 'Read/view tasks' },
    { name: 'task_update', description: 'Update/edit a task' },
    { name: 'task_delete', description: 'Delete a task' },
    { name: 'task_assign', description: 'Assign a task to a user' },
    { name: 'task_change_status', description: 'Change status of a task' },
    { name: 'user_manage', description: 'Manage users' },
    { name: 'role_manage', description: 'Manage roles and permissions' }
];

const rolePermissions = {
    admin: [
        'task_create', 'task_read', 'task_update', 'task_delete', 'task_assign', 'task_change_status', 'user_manage', 'role_manage'
    ],
    manager: [
        'task_create', 'task_read', 'task_update', 'task_assign', 'task_change_status'
    ],
    user: [
        'task_read', 'task_update', 'task_change_status'
    ]
};

async function seedPermissionsAndRoles() {
    const mongoDBUri = process.env.MONGO_URL;
    if (!mongoDBUri) {
        console.error("MONGO_URL is not defined in .env file");
        process.exit(1);
    }

    await mongoose.connect(mongoDBUri);
    console.log("Connected to MongoDB");
    // Seed permissions
    const insertedPermissions = await Permission.insertMany(permissionsData, { ordered: false }).catch(() => { });
    const allPermissions = await Permission.find();
    const permMap = Object.fromEntries(allPermissions.map(p => [p.name, p._id]));

    // Seed roles
    for (const [role, perms] of Object.entries(rolePermissions)) {
        const roleDoc = await Role.findOneAndUpdate(
            { name: role },
            {
                name: role,
                description: `${role.charAt(0).toUpperCase() + role.slice(1)} role`,
                permissions: perms.map(p => permMap[p])
            },
            { upsert: true, new: true }
        );
        console.log(`Role seeded: ${roleDoc.name}`);
    }
    console.log('Seeding complete.');
    process.exit(0);
}

seedPermissionsAndRoles().catch(e => { console.error(e); process.exit(1); });
