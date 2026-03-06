import bcrypt from 'bcrypt';

// Middleware to check if user is authenticated
export function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

// Hash password
export async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// Compare password with hash
export async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Export user session data for views
export function getUserFromSession(req) {
    if (req.session && req.session.userId) {
        return {
            id: req.session.userId,
            email: req.session.userEmail,
            name: req.session.userName || 'User'
        };
    }
    return null;
}
