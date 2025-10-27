import mongoose from "mongoose";

const AuthUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        index: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["anggota", "admin", "sekretaris", "bendahara", "kasir"],
        default: "anggota"
    },
    refType: {
        type: String,
        enum: ["Anggota", "Karyawan"],
        required: true
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "refType"
    },
    forcePasswordChange: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLoginAt: {
        type: Date
    }
});

const AuthUser = mongoose.model("AuthUser", AuthUserSchema);
export default AuthUser;