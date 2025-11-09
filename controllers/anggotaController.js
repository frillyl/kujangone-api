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

        if (email && await Anggota.findOne({ email })) {
            return res.status(400).json({ message: "Email sudah terdaftar." });
        }

        if (noHp && await Anggota.findOne({ noHp })) {
            return res.status(400).json({ message: "Nomor HP sudah terdaftar." })
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
            createdBy: req.userId,
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
        const { nrp } = req.body;

        const updateData = { ...req.body, updatedBy: req.userId };
        const anggota = await Anggota.findByIdAndUpdate(id, updateData, { new: true });

        if (!anggota) return res.status(404).json({ message: "Data tidak ditemukan." });

        const authUser = await AuthUser.findOne({ refType: "Anggota", refId: anggota._id });
        if (authUser) {
            if (nrp && authUser.username !== nrp) {
                const usernameExist = await AuthUser.findOne({ username: nrp });
                if (usernameExist) {
                    return res.status(400).json({ message: "NRP baru sudah digunakan oleh akun lain." });
                }

                authUser.username = nrp;
                authUser.updatedAt = new Date();
                authUser.updatedBy = req.userId;
                await authUser.save();
            }
        }

        res.json({ message: "Data anggota berhasil diperbarui", anggota });
    } catch (err) {
        console.error("Gagal memperbarui data anggota:", err);
        res.status(500).json({ message: err.message });
    }
};

export const deleteAnggota = async (req, res) => {
    try {
        const { id } = req.params;
        const anggota = await Anggota.findByIdAndDelete(id);
        if (!anggota) return res.status(404).json({ message: "Data tidak ditemukan" });

        await AuthUser.findOneAndDelete({ refType: "Anggota", refId: id });

        res.json({ message: "Data anggota dan akun terkait berhasil dihapus" });
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

export const assignToKaryawan = async (req, res) => {
    try {
        const { id } = req.params;
        const { posisi } = req.body;

        if (!posisi) {
            return res.status(400).json({ message: "Posisi karyawan wajib diisi." });
        }

        const anggota = await Anggota.findById(id);
        if (!anggota) {
            return res.status(404).json({ message: "Data anggota tidak ditemukan." });
        }

        if (anggota.status !== "Aktif") {
            return res.status(400).json({
                message: `Anggota dengan status ${anggota.status} tidak dapat dijadikan karyawan.`
            })
        }

        const auth = await AuthUser.findOne({ refType: "Anggota", refId: anggota._id });
        if (!auth) {
            return res.status(404).json({ message: "Akun anggota tidak ditemukan." });
        }

        if (["admin", "sekretaris", "bendahara", "kasir"].includes(auth.role)) {
            return res.status(400).json({ message: "Anggota ini sudah menjadi karyawan." });
        }

        auth.role = posisi.toLowerCase();
        auth.updatedAt = new Date();
        await auth.save();

        res.status(200).json({
            message: `Anggota ${anggota.nama} berhasil diubah menjadi ${posisi}.`,
            updatedRole: auth.role,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Gagal assign anggota ke karyawan." });
    }
};