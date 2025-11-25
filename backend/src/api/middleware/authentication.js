const jwt = require('jsonwebtoken');
const db = require('./db');

class AuthService {
  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role || 'customer'
      },
      process.env.JWT_SECRET || 'your-fallback-secret',
      { expiresIn: '24h' }
    );
  }

  // Verify JWT token middleware
  requireAuth(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
  }

  // Optional auth - attaches user if token exists
  optionalAuth(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret');
        req.user = decoded;
      } catch (error) {
        // Invalid token, but continue without user
      }
    }
    next();
  }

  // Admin-only middleware
  requireAdmin(req, res, next) {
    this.requireAuth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
      }
      next();
    });
  }

  // Validate user credentials (login)
  async validateUser(email, password) {
    try {
      const user = await db.getUserByEmail(email);
      if (!user) {
        return { valid: false, error: 'User not found' };
      }

      // In a real app, you'd use bcrypt to compare hashed passwords
      const isValidPassword = await this.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return { valid: false, error: 'Invalid password' };
      }

      // Don't return password hash in the user object
      const { password_hash, ...userWithoutPassword } = user;
      return { valid: true, user: userWithoutPassword };

    } catch (error) {
      console.error('Auth validation error:', error);
      return { valid: false, error: 'Authentication failed' };
    }
  }

  // Compare password with hash (using bcrypt in production)
  async comparePassword(password, hash) {
    // For now, simple comparison - REPLACE WITH BCRYPT IN PRODUCTION
    return password === hash;
  }

  // Hash password (using bcrypt in production)
  async hashPassword(password) {
    // For now, return plain text - REPLACE WITH BCRYPT IN PRODUCTION
    return password;
  }

  // Register new user
  async registerUser(userData) {
    try {
      const { email, password, name } = userData;
      
      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return { success: false, error: 'User already exists' };
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user
      const user = await db.createUser({
        email,
        password_hash: passwordHash,
        name,
        role: 'customer'
      });

      return { success: true, user };

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }
}

module.exports = new AuthService();