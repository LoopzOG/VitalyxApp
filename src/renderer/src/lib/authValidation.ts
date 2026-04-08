export function validateEmail(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "Email is required.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalized)) {
    return "Enter a valid email address.";
  }

  return null;
}

export function validatePassword(value: string) {
  if (!value.trim()) {
    return "Password is required.";
  }

  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return null;
}

export function validateDisplayName(value: string) {
  if (!value.trim()) {
    return "Display name is required.";
  }

  if (value.trim().length < 2) {
    return "Display name must be at least 2 characters.";
  }

  return null;
}
