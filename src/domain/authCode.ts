export const normalizeEmailCode = (value: string) => value.replace(/\D/g, '').slice(0, 8);
export const isEmailCode = (value: string) => /^(?:\d{6}|\d{8})$/.test(value);
