export const cn = (...inputs: (string | false | null | undefined)[]) =>
  inputs.filter(Boolean).join(" ");
