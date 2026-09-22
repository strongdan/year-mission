export function getAuthErrorMessage(error: string | null, message: string | null) {
  if (!error) return null;
  if (message) return message;
  if (error === "callback") return "Sign-in could not be completed. Try again.";
  return "Sign-in failed. Try again.";
}
