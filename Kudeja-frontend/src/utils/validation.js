export const isValidPasswordStrength = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

export const getPasswordRequirementsText = () => {
  return "Password must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number, and a special character (e.g. !@#$%).";
};
