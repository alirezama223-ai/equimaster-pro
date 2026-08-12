const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};

  if (!email.trim()) {
    errors.email = "emailRequired";
  } else if (!emailPattern.test(email.trim())) {
    errors.email = "emailInvalid";
  }

  if (!password) {
    errors.password = "passwordRequired";
  } else if (password.length < 6) {
    errors.password = "passwordMinLengthLogin";
  }

  return errors;
}

export function validateForgotPasswordForm(email: string) {
  const errors: { email?: string } = {};

  if (!email.trim()) {
    errors.email = "emailRequired";
  } else if (!emailPattern.test(email.trim())) {
    errors.email = "emailInvalid";
  }

  return errors;
}

export function validateUpdatePasswordForm(
  password: string,
  confirmPassword: string
) {
  const errors: {
    password?: string;
    confirmPassword?: string;
  } = {};

  if (!password) {
    errors.password = "passwordRequired";
  } else if (password.length < 8) {
    errors.password = "passwordMinLength";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "confirmPasswordRequired";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "passwordsMismatch";
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
    errors.fullName = "nameRequired";
  }

  if (!email.trim()) {
    errors.email = "emailRequired";
  } else if (!emailPattern.test(email.trim())) {
    errors.email = "emailInvalid";
  }

  if (!password) {
    errors.password = "passwordRequired";
  } else if (password.length < 8) {
    errors.password = "passwordMinLength";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "confirmPasswordRequired";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "passwordsMismatch";
  }

  return errors;
}

export function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "invalidCredentials";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered")
  ) {
    return "emailAlreadyExists";
  }

  if (normalized.includes("email not confirmed")) {
    return "emailNotConfirmed";
  }

  if (
    normalized.includes("password should be at least") ||
    normalized.includes("weak password") ||
    normalized.includes("password is too weak")
  ) {
    return "passwordTooWeak";
  }

  if (normalized.includes("invalid email")) {
    return "emailInvalid";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "rateLimitExceeded";
  }

  if (
    normalized.includes("otp expired") ||
    normalized.includes("session expired") ||
    normalized.includes("invalid refresh token") ||
    normalized.includes("token has expired")
  ) {
    return "genericError";
  }

  if (normalized.includes("signup is disabled")) {
    return "signupDisabled";
  }

  return "genericError";
}
