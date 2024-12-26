const otpStore = {};

function saveOtp(email, otp) {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const attempts = 0; // Initialize attempt counter
    otpStore[email] = { otp, expiresAt, attempts };
}

function incrementAttempts(email) {
    if (otpStore[email]) {
        otpStore[email].attempts += 1;
    }
}

function isBlocked(email) {
    const record = otpStore[email];
    return record && record.attempts >= 3; // Block after 3 failed attempts
}

function verifyOtp(email, enteredOtp) {
    const record = otpStore[email];
    if (record) {
        if (isBlocked(email)) {
            return 'blocked'; // Indicate the user is blocked
        }
        if (record.otp === enteredOtp && Date.now() < record.expiresAt) {
            delete otpStore[email]; // Clear OTP after successful verification
            return true;
        }
        incrementAttempts(email);
    }
    return false;
}


module.exports = { saveOtp, verifyOtp };
