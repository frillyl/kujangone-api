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
        required: false
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        refPath: "refType"
    },
    isSuperAdmin: {
        type: Boolean,
        default: false
    },
    forcePasswordChange: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastLoginAt: {
        type: Date
    }
}, {
    timestamps: true,
});

AuthUserSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

const AuthUser = mongoose.model("AuthUser", AuthUserSchema);
export default AuthUser;