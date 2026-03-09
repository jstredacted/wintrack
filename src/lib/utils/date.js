export function getLocalDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  // en-CA locale produces YYYY-MM-DD natively — no string manipulation needed
}
