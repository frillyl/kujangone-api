import AuthUser from "../models/AuthUser.js";
import Anggota from "../models/Anggota.js";

export const getAllKaryawan = async (req, res) => {
    try {
        const users = await AuthUser.find({
            role: { $in: ["admin", "sekretaris", "bendahara", "kasir"] },
            refType: "Anggota",
        })
            .populate({
                path: "refId",
                model: "Anggota",
                select: "nama nrp pangkat status email noHp",
            })
            .lean();

        const karyawanData = users.map((user) => ({
            _id: user._id,
            username: user.username,
            role: user.role,
            nama: user.refId?.nama || "-",
            nrp: user.refId?.nrp || "-",
            pangkat: user.refId?.pangkat || "-",
            status: user.refId?.status || "-",
            email: user.refId?.email || "-",
            noHp: user.refId?.noHp || "-",
        }));

        res.status(200).json(karyawanData);
    } catch (error) {
        console.error("Error getAllKaryawan:", error);
        res.status(500).json({ message: error.message });
    }
};

export const unassignKaryawan = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await AuthUser.findById(id);
        if (!user) return res.status(404).json({ message: "User tidak ditemukan." });

        user.role = "anggota";
        await user.save();

        res.status(200).json({ message: `Karyawan ${user.username} telah dikembalikan menjadi anggota.` });
    } catch (error) {
        console.error("Error Unassign Karyawan:", error);
        res.status(500).json({ message: error.message });
    }
};