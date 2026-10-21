/**
 * CareTrack - Modern Healthcare Management System
 * Authentication & Session Module (auth.js)
 * Manages user accounts, demo logins, password changes, and active sessions.
 */

const Auth = (function () {
  'use strict';

  const STORAGE_KEY_USERS = 'caretrack_users';
  const STORAGE_KEY_SESSION = 'caretrack_session';

  // Seed standard demo users as required by project specification
  function seedDemoUsers() {
    let users = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      if (stored) {
        users = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading users from localStorage:', e);
      users = [];
    }

    const demoUsers = [
      {
        id: 'user_kartavya',
        name: 'Kartavya Singh',
        email: 'kartavya@caretrack.demo',
        password: '9453583811',
        phone: '+91 94535 83811',
        initials: 'KS',
        role: 'Patient / Member',
        createdAt: '2026-01-15'
      },
      {
        id: 'user_ggit',
        name: 'GGIT',
        email: 'ggit@caretrack.demo',
        password: '209801',
        phone: '+91 98765 43210',
        initials: 'GG',
        role: 'Student / Health Care',
        createdAt: '2026-02-10'
      },
      {
        id: 'user_zcop',
        name: 'ZCOP',
        email: 'zcop@caretrack.demo',
        password: '209801',
        phone: '+91 91234 56789',
        initials: 'ZC',
        role: 'Member / Caregiver',
        createdAt: '2026-03-01'
      }
    ];

    let modified = false;
    demoUsers.forEach(demoUser => {
      const exists = users.some(u => u.email.toLowerCase() === demoUser.email.toLowerCase());
      if (!exists) {
        users.push(demoUser);
        modified = true;
      }
    });

    if (modified || !localStorage.getItem(STORAGE_KEY_USERS)) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }

    // Also ensure each demo user has their rich seed dataset loaded in Storage
    if (typeof Storage !== 'undefined' && Storage.seedDefaultDataForDemoUsers) {
      Storage.seedDefaultDataForDemoUsers();
    }
  }

  // Get all registered users from storage
  function getAllUsers() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  // Generate initials from name
  function getInitials(name) {
    if (!name) return 'CT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Register a new user
  function signup(name, email, phone, password) {
    seedDemoUsers();
    const users = getAllUsers();

    const normalizedEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (existing) {
      return { success: false, message: 'An account with this email address already exists.' };
    }

    if (!name || name.trim().length < 2) {
      return { success: false, message: 'Please enter a valid full name.' };
    }

    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const newUser = {
      id: 'user_' + Date.now(),
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : '+91 90000 00000',
      password: password,
      initials: getInitials(name),
      role: 'Patient / Member',
      createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    // Initialize user's separate database
    if (typeof Storage !== 'undefined' && Storage.initializeNewUserData) {
      Storage.initializeNewUserData(newUser.id, newUser.name);
    }

    // Automatically sign in the new user
    login(newUser.email, password, true);

    return { success: true, user: newUser };
  }

  // Sign in an existing user
  function login(email, password, remember = false) {
    seedDemoUsers();
    const users = getAllUsers();
    const normalizedEmail = (email || '').trim().toLowerCase();

    const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user || user.password !== password) {
      return { success: false, message: 'Invalid email or password. Please verify your credentials.' };
    }

    // Save session
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      token: 'session_' + Math.random().toString(36).substr(2) + Date.now(),
      loginTime: new Date().toISOString(),
      remember: !!remember
    };

    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    return { success: true, user: user };
  }

  // Get current active session
  function getSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSION);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  // Check if someone is logged in
  function isAuthenticated() {
    const session = getSession();
    return !!(session && session.userId);
  }

  // Get full profile of the currently logged in user
  function getCurrentUser() {
    const session = getSession();
    if (!session || !session.userId) return null;

    const users = getAllUsers();
    const user = users.find(u => u.id === session.userId);
    return user || null;
  }

  // Update profile for current user
  function updateProfile(updatedFields) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'No active session found.' };

    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return { success: false, message: 'User not found.' };

    if (updatedFields.name) {
      users[idx].name = updatedFields.name.trim();
      users[idx].initials = getInitials(users[idx].name);
    }
    if (updatedFields.phone) {
      users[idx].phone = updatedFields.phone.trim();
    }
    if (updatedFields.email) {
      const newEmail = updatedFields.email.trim().toLowerCase();
      // check if other user already has this email
      const emailConflict = users.some(u => u.id !== user.id && u.email.toLowerCase() === newEmail);
      if (emailConflict) {
        return { success: false, message: 'That email is already registered to another account.' };
      }
      users[idx].email = newEmail;
    }
    if (updatedFields.role) {
      users[idx].role = updatedFields.role.trim();
    }

    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    // Update active session metadata
    const session = getSession();
    if (session) {
      session.name = users[idx].name;
      session.email = users[idx].email;
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    }

    return { success: true, user: users[idx] };
  }

  // Change password for current user
  function changePassword(currentPassword, newPassword) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'User not authenticated.' };

    if (user.password !== currentPassword) {
      return { success: false, message: 'Current password does not match.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return { success: false, message: 'User record not found.' };

    users[idx].password = newPassword;
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    return { success: true, message: 'Password updated successfully!' };
  }

  // Sign out and clear active session
  function logout() {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    window.location.href = 'login.html';
  }

  // Guard: Protect dashboard pages
  function requireAuth() {
    seedDemoUsers();
    if (!isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // Guard: Redirect from login/signup if already authenticated
  function redirectIfAuth() {
    seedDemoUsers();
    if (isAuthenticated()) {
      window.location.href = 'dashboard.html';
      return true;
    }
    return false;
  }

  // Run seed check immediately
  seedDemoUsers();

  return {
    seedDemoUsers: seedDemoUsers,
    signup: signup,
    login: login,
    logout: logout,
    getSession: getSession,
    isAuthenticated: isAuthenticated,
    getCurrentUser: getCurrentUser,
    updateProfile: updateProfile,
    changePassword: changePassword,
    requireAuth: requireAuth,
    redirectIfAuth: redirectIfAuth,
    getInitials: getInitials
  };
})();
