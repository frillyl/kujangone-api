import mongoose from "mongoose";

const AgenSchema = new mongoose.Schema({
    kode: {
        type: String,
        required: true,
        unique: true
    },
    nama: {
        type: String,
        required: true
    },
    alamat: {
        type: String,
        required: true
    },
    email: {
        type: String,
    },
    noHp: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AuthUser",
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AuthUser"
    }
}, { timestamps: true });

const Agen = mongoose.model("Agen", AgenSchema);
export default Agen;