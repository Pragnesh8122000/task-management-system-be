import mongoose from 'mongoose';
import { USER_ROLES } from '../common/constants.js';
const { Schema } = mongoose;
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    password: { type: String, set: (val) => bcrypt.hashSync(val, 10), required: true },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true, versionKey: false });

const User = mongoose.model('User', userSchema);
export default User;