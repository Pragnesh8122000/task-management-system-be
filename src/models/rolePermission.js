import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema({
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    permission: {
        type: String,
        required: true
    }
});

const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);
export default RolePermission;
