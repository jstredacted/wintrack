export function getLocalDateString(date: Date = new Date(), dayStartHour: number = 0): string {
  let target = date;
  if (dayStartHour > 0 && date.getHours() < dayStartHour) {
    // Night-owl mode: before day boundary, treat as previous calendar day
    // Uses setDate (DST-safe) — NOT millisecond subtraction
    const adjusted = new Date(date);
    adjusted.setDate(adjusted.getDate() - 1);
    target = adjusted;
  }
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(target);
  // en-CA locale produces YYYY-MM-DD natively — no string manipulation needed
}
