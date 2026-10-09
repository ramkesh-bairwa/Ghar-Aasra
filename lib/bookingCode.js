import { randomInt } from "crypto";
import { query } from "./db";

// No 0/O, 1/I/L — codes get read out over the phone and typed back in.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function newBookingCode(prefix) {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${code}`;
}

// Runs an INSERT that takes the code as its first parameter, retrying with a
// fresh code on the (very unlikely) chance it collides with an existing one.
// prefix: "BK" for bookings, "VR" for schedule requests.
export async function insertWithBookingCode(prefix, sql, params) {
  for (let attempt = 0; ; attempt++) {
    const code = newBookingCode(prefix);
    try {
      const result = await query(sql, [code, ...params]);
      return { result, code };
    } catch (err) {
      if (err.code !== "ER_DUP_ENTRY" || !String(err.message).includes("code") || attempt >= 4) throw err;
    }
  }
}

