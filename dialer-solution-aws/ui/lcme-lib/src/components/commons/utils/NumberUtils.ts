export const nth = (n) => {
  return [, 'st', 'nd', 'rd'][(n / 10) % 10 ^ 1 && n % 10] || 'th';
};
