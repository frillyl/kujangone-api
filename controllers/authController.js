import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import crypto from "crypto";
import nodemailer from "nodemailer";
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

const sendVerificationEmail = async (email, nama, code) => {
    try {
        if (!email) return;

        let transporter;

        if (process.env.NODE_ENV !== "production") {
            const testAccount = await nodemailer.createTestAccount();

            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        } else {
            transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }


        const info = await transporter.sendMail({
            from: `"KujangOne" <no-reply@kujangone.id>`,
            to: email,
            subject: "Kode Verifikasi Akun KujangOne",
            text: `Halo ${nama},\n\nKode verifikasi akun Anda adalah: ${code}\n\nKode ini berlaku selama 15 menit.\n\nTerima kasih,\nTim KujangOne`,
        });

        if (process.env.NODE_ENV !== "production") {
            console.log("📬 Email verifikasi (preview):", nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error("Gagal mengirim email verifikasi:", error.message);
    }
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
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const auth = new AuthUser({
            username: nrp,
            passwordHash,
            role: "anggota",
            refType: "Anggota",
            refId: anggota._id,
            forcePasswordChange: true,
            verificationCode,
            verificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });
        await auth.save();

        if (email) await sendVerificationEmail(email, nama, verificationCode);

        return res.status(201).json({ message: "Registasi anggota berhasil" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

export const verifyAccount = async (req, res) => {
    try {
        const { username, code } = req.body;

        const auth = await AuthUser.findOne({ username });
        if (!auth) return res.status(404).json({ message: "User tidak ditemukan" });
        if (auth.isVerified) return res.status(400).json({ message: "Akun sudah terverifikasi" });
        if (auth.verificationCode !== code) return res.status(400).json({ message: "Kode verifikasi salah" });
        if (auth.verificationExpiresAt < Date.now()) return res.status(400).json({ message: "Kode verifikasi kadaluarsa" });

        auth.isVerified = true;
        auth.verificationCode = null;
        auth.verificationExpiresAt = null;
        await auth.save();

        res.json({ message: "Akun berhasil diverifikasi. Anda sekarang dapat login." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ message: "Username wajib diisi" });

        const auth = await AuthUser.findOne({ username }).populate("refId");
        if (!auth) return res.status(404).json({ message: "User tidak ditemukan" });
        if (auth.isVerified) return res.status(400).json({ message: "Akun sudah terverifikasi" });

        const now = Date.now();
        const lastSentAt = auth.lastVerificationSentAt ? auth.lastVerificationSentAt.getTime() : 0;
        const cooldown = 60 * 1000;
        if (now - lastSentAt < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastSentAt)) / 1000);
            return res.status(429).json({
                message: `Tunggu ${remaining} detik sebelum mengirim ulang kode verifikasi.`,
            });
        }

        const newCode = crypto.randomInt(100000, 999999).toString();
        auth.verificationCode = newCode;
        auth.verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        auth.lastVerificationSentAt = new Date();
        await auth.save();

        const userData = auth.refId;
        if (userData?.email) await sendVerificationEmail(userData.email, userData.nama, newCode);

        return res.json({ message: "Kode verifikasi baru telah dikirim." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
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

        if (!auth.isVerified) {
            return res.status(403).json({
                message: "Akun belum diverifikasi. Silahkan periksa email atau nomor HP Anda.",
            });
        }

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