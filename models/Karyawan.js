import mongoose from "mongoose";

const KaryawanSchema = new mongoose.Schema({
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
        type: String
    },
    posisi: {
        type: String,
        enum: ["Admin", "Sekretaris", "Bendahara", "Kasir"],
        required: true
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AuthUser"
    },
    updatedAt: {
        type: Date
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AuthUser"
    }
});

const Karyawan = mongoose.model("Karyawan", KaryawanSchema);
export default Karyawan;