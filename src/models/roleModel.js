import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
        required: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Role = mongoose.model('Role', roleSchema);
export default Role;
