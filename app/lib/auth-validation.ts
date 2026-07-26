const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};

  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

export function validateSignupForm(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string
) {
  const errors: {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = {};

  if (!fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered")
  ) {
    return "An account with this email already exists.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (
    normalized.includes("password should be at least") ||
    normalized.includes("weak password") ||
    normalized.includes("password is too weak")
  ) {
    return "Password is too weak. Use at least 8 characters with a mix of letters and numbers.";
  }

  if (normalized.includes("invalid email")) {
    return "Enter a valid email address.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (normalized.includes("signup is disabled")) {
    return "New sign ups are currently disabled. Please contact support.";
  }

  return message;
}
