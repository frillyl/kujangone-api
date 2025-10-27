import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import Anggota from "../models/Anggota.js";
import Karyawan from "../models/Karyawan.js";
import AuthUser from "../models/AuthUser.js";

const createTokens = (user) => {
    const accessToken = jwt.sign(
        { sub: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { sub: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
    
    return { accessToken, refreshToken };
};

export const registerAnggota = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { nama, nrp, pangkat, email, noHp } = req.body;

        if (!email && !noHp) return res.status(400).json({ message: "Wajib mengisi salah satu: email atau nomor HP." })

        if (await Anggota.findOne({ nrp })) return res.status(400).json({ message: "NRP sudah terdaftar" });

        const anggota = new Anggota({ nama, nrp, pangkat, email, noHp });
        await anggota.save();

        const passwordHash = await argon2.hash(nrp);
        const auth = new AuthUser({
            username: nrp,
            passwordHash,
            role: "anggota",
            refType: "Anggota",
            refId: anggota._id,
            forcePasswordChange: true,
        });
        await auth.save();

        return res.status(201).json({ message: "Registasi anggota berhasil" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) return res.status(400).json({ message: "Identifier dan password diperlukan" });

        let auth = await AuthUser.findOne({ username: identifier });
        if (!auth) {
            const anggotaByEmail = await Anggota.findOne({ email: identifier });
            const karyawanByEmail = await Karyawan.findOne({ email: identifier });
            
            if (anggotaByEmail) auth = await AuthUser.findOne({
                refType: "Anggota",
                refId: anggotaByEmail._id,
            });
            else if (karyawanByEmail) auth = await AuthUser.findOne({
                refType: "Karyawan",
                refId: karyawanByEmail._id,
            });
        }

        if (!auth) return res.status(401).json({ message: "User tidak ditemukan" });

        const ok = await argon2.verify(auth.passwordHash, password);
        if (!ok) return res.status(401).json({ message: "Password salah" });

        let isDefaultPassword = false;
        if (auth.refType === "Anggota") {
            const anggota = await Anggota.findById(auth.refId);
            if (anggota && await argon2.verify(auth.passwordHash, anggota.nrp)) {
                isDefaultPassword = true;
            }
        }

        const tokens = createTokens(auth);
        auth.lastLoginAt = new Date();
        await auth.save();

        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            accessToken: tokens.accessToken,
            role: auth.role,
            forcePasswordChange: auth.forcePasswordChange || isDefaultPassword,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { oldPassword, newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: "Password baru diperlukan" });

        const auth = await AuthUser.findById(userId);
        if (!auth) return res.status(404).json({ message: "User tidak ditemukan" });

        if (oldPassword) {
            const ok = await argon2.verify(auth.passwordHash, oldPassword);
            if (!ok) return res.status(401).json({ message: "Password lama salah" });
        }

        auth.passwordHash = await argon2.hash(newPassword);
        auth.forcePasswordChange = false;
        await auth.save();

        res.json({ message: "Password berhasil diubah" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};