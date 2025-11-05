import Anggota from "../models/Anggota.js";
import AuthUser from "../models/AuthUser.js";
import argon2 from "argon2";
import crypto from "crypto";

export const getAllAnggota = async (req, res) => {
    try {
        const data = await Anggota.find().populate("createdBy", "nama email").populate("updatedBy", "nama email").sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createAnggota = async (req, res) => {
    try {
        const { nama, nrp, pangkat, status, email, noHp } = req.body;

        if (!email && !noHp) {
            return res.status(400).json({ message: "Wajib mengisi salah satu: email atau nomor HP." })
        }

        if (await Anggota.findOne({ nrp })) {
            return res.status(400).json({ message: "NRP sudah terdaftar." });
        }

        const anggota = new Anggota({ nama, nrp, pangkat, status, email, noHp, createdBy: req.userId });
        await anggota.save();

        const passwordHash = await argon2.hash(nrp);

        const auth = new AuthUser({
            username: nrp,
            passwordHash,
            role: "anggota",
            refType: "Anggota",
            refId: anggota._id,
            forcePasswordChange: true,
            isVerified: true,
        });
        await auth.save();

        res.status(201).json({ message: "Data anggota berhasil ditambahkan", anggota });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const updateAnggota = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body, updatedBy: req.userId };

        const anggota = await Anggota.findByIdAndUpdate(id, updateData, { new: true });
        if (!anggota) return res.status(404).json({ message: "Data tidak ditemukan." });

        res.json({ message: "Data anggota berhasil diperbarui", anggota });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteAnggota = async (req, res) => {
    try {
        const { id } = req.params;
        const anggota = await Anggota.findByIdAndDelete(id);
        if (!anggota) return res.status(404).json({ message: "Data tidak ditemukan" });

        res.json({ message: "Data anggota berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const resetPasswordAnggota = async (req, res) => {
    try {
        const { id } = req.params;
        const anggota = await Anggota.findById(id);
        if (!anggota) return res.status(404).json({ message: "Anggota tidak ditemukan." });

        const auth = await AuthUser.findOne({ refType: "Anggota", refId: anggota._id });
        if (!auth) return res.status(404).json({ message: "Akun anggota tidak ditemukan." });

        const newHash = await argon2.hash(anggota.nrp);
        auth.passwordHash = newHash;
        auth.forcePasswordChange = true;
        await auth.save();

        res.json({ message: `Password anggota ${anggota.nama} telah direset ke NRP.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Gagal mereset password." });
    }
};