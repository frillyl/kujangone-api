import Anggota from "../models/Anggota.js";

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

        const anggota = new Anggota({ nama, nrp, pangkat, status, email, noHp, createdBy: req.userId });
        await anggota.save();

        res.status(201).json({ message: "Data anggota berhasil ditambahkan", anggota });
    } catch (err) {
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