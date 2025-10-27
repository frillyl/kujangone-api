import express from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import Anggota from "../models/Anggota.js";
import Karyawan from "../models/Karyawan.js";
import AuthUser from "../models/AuthUser.js";
import argon2 from "argon2";

const router = express.Router();

router.post("/assign-karyawan", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { anggotaId, posisi } = req.body;
        if (!anggotaId || !posisi) return res.status(400).json({ message: "anggotaId dan posisi diperlukan" });

        const anggota = await Anggota.findById(anggotaId);
        if (!anggota) return res.status(400).json({ message: "Anggota sudah menjadi karyawan" });

        const karyawan = new Karyawan({
            nama: anggota.nama,
            nrp: anggota.nrp,
            pangkat: anggota.pangkat,
            posisi,
            email: anggota.email,
            noHp: anggota.noHp,
            createdBy: req.userId,
        });
        await karyawan.save();

        let auth = await AuthUser.findOne({ refType: "Anggota", refId: anggota._id });
        if (auth) {
            auth.refType = "Karyawan";
            auth.refId = karyawan._id;
            auth.role = posisi.toLowerCase();
            await auth.save();
        } else {
            const passwordHash = await argon2.hash(anggota.nrp);
            auth = new AuthUser({
                username: anggota.nrp,
                passwordHash,
                role: posisi.toLowerCase(),
                refType: "Karyawan",
                refId: karyawan._id,
                forcePasswordChange: true,
            });
            await auth.save();
        }

        res.json({ message: "Anggota berhasil dijadikan karyawan", karyawan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;