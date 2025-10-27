import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "Unauthorized: token dibutuhkan" });

        const [type, token] = authHeader.split(" ");
        if (type !== "Bearer" || !token) return res.status(401).json({ message: "Format token salah" });

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.sub;
        req.userRole = payload.role;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token tidak valid atau expired" });
    }
};

export const requireRole = (requireRole) => (req, res, next) => {
    if (!req.userRole) return res.status(403).json({ message: "Forbidden: Role tidak ditemukan" });

    if (req.userRole.toLowerCase() !== requireRole.toLowerCase()) return res.status(403).json({ message: "Forbidden: Role tidak sesuai" });

    next();
};