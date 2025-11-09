import mongoose from "mongoose";

const AnggotaSchema = new mongoose.Schema({
    nama: {
        type: String,
        required: true
    },
    nrp: {
        type: String,
        required: true,
        unique: true
    },
    pangkat: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Aktif", "Non-Aktif"],
        default: "Aktif"
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    noHp: {
        type: String,
        unique: true,
        sparse: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AuthUser"
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AuthUser"
    }
}, { timestamps: true });

AnggotaSchema.pre("validate", function (next) {
    if (!this.email && !this.noHp) {
        next(new Error("Wajib mengisi salah satu: email atau nomor HP."));
    } else {
        next();
    }
});

const Anggota = mongoose.model("Anggota", AnggotaSchema);
export default Anggota;