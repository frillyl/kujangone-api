import crypto from "crypto";
import Agen from "../models/Agen.js";

export const getAllAgen = async (req, res) => {
    try {
        const data = await Agen.find()
            .populate({
                path: "createdBy",
                select: "nama email refType refId",
                populate: {
                    path: "refId",
                    select: "nama",
                    model: "Anggota"
                }
            })
            .populate({
                path: "updatedBy",
                select: "nama email refType refId",
                populate: {
                    path: "refId",
                    select: "nama",
                    model: "Anggota"
                }
            })
            .sort({ createdAt: -1 });

        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createAgen = async (req, res) => {
    try {
        const { nama, alamat, email, noHp } = req.body;

        if (!email && !noHp) {
            return res.status(400).json({ message: "Wajib mengisi salah satu: email atau nomor HP." })
        }

        const kodeRandom = "AG" + crypto.randomBytes(5).toString("hex").toUpperCase();

        const existing = await Agen.findOne({ kode: kodeRandom });
        if (existing) {
            return res.status(500).json({ message: "Gagal generate kode unik, coba lagi." })
        }
        
        const agen = new Agen({ kode: kodeRandom, nama, alamat, email, noHp, createdBy: req.userId });
        await agen.save();

        res.status(201).json({ message: "Data agen berhasil ditambahkan", agen });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const updateAgen = async (req, res) => {
    try {
        const { id } = req.params;
        
        const updateData = { ...req.body, updatedBy: req.userId };
        const agen = await Agen.findByIdAndUpdate(id, updateData, { new: true });

        if (!agen) return res.status(404).json({ message: "Data tidak ditemukan." });

        res.json({ message: "Data agen berhasil diperbarui", agen });
    } catch (err) {
        console.error("Gagal memperbarui data agen:", err);
        res.status(500).json({ message: err.message });
    }
};

export const deleteAgen = async (req, res) => {
    try {
        const { id } = req.params;
        const agen = await Agen.findByIdAndDelete(id);
        
        if (!agen) return res.status(404).json({ message: "Data tidak ditemukan" });

        res.json({ message: "Data agen berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};