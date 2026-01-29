import { Resend } from "resend";
import fs from "fs/promises";
import path from "path";


// ✅ Usa import.meta.env en Astro/Vite
const API_KEY = import.meta.env.RESEND_API_KEY as string | undefined;
if (!API_KEY) {
  throw new Error("RESEND_API_KEY no está definido. Configúralo en .env");
}
const resend = new Resend(API_KEY);

export type IzuContactPayload = {
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  message?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  source?: string;
};

function resolveFrom() {
  return (
    (import.meta.env.RESEND_FROM_IZU as string | undefined) ||
    "Villas Izu Garden <no-reply@tudominio.com>"
  );
}
function resolveToList() {
  const raw = (import.meta.env.RESEND_TO_IZU as string | undefined) || "";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : ["reservas@villasizugarden.com"];
}

function replaceAll(template: string, map: Record<string, string>) {
  return Object.entries(map).reduce((acc, [k, v]) => {
    const re = new RegExp(String.raw`\{\{\{\s*${k}\s*\}\}\}`, "g");
    return acc.replace(re, v ?? "");
  }, template);
}

export async function sendContactEmailIzu(payload: IzuContactPayload) {
  const {
    firstname,
    lastname,
    email,
    phone = "—",
    message = "Sin mensaje",
    checkIn,
    checkOut,
    adults,
    children,
    source = "Web",
  } = payload;

  const fullName = `${firstname} ${lastname}`.trim();

  // Fix path: remove /izu/ if it doesn't exist, or ensure it works
  const filePath = path.resolve(
    process.cwd(),
    "src/emails/GuestConfirmation.html" // Using GuestConfirmation since BookingNotification is empty
  );
  let html = await fs.readFile(filePath, "utf-8");

  const nights = (() => {
    if (!checkIn || !checkOut) return "";
    const inD = new Date(checkIn);
    const outD = new Date(checkOut);
    const diff = outD.getTime() - inD.getTime();
    if (!Number.isFinite(diff) || diff <= 0) return "";
    return String(Math.round(diff / (1000 * 60 * 60 * 24)));
  })();

  html = replaceAll(html, {
    fullName,
    email,
    phone,
    message,
    checkIn: checkIn ?? "—",
    checkOut: checkOut ?? "—",
    nights: nights || "—",
    adults: adults != null ? String(adults) : "—",
    children: children != null ? String(children) : "—",
    source,
    now: new Date().toLocaleString("es-CR", { hour12: false }),
  });

  return await resend.emails.send({
    from: resolveFrom(),
    to: resolveToList(),
    replyTo: email,
    subject: `📩 Nueva consulta (${source}) - Villas Izu Garden`,
    html,
  });
}

/**
 * Envia un correo de confirmación al HUESPED
 */
export async function sendGuestConfirmationIzu(payload: IzuContactPayload) {
  const { firstname, email, source = "Web" } = payload;

  const filePath = path.resolve(
    process.cwd(),
    "src/emails/GuestConfirmation.html"
  );
  let html = await fs.readFile(filePath, "utf-8");

  // Personalización mínima para el huésped si el template lo permite
  // (El template actual parece ser una notificación de contacto, pero lo usaremos para cumplir con la API)
  const fullName = `${payload.firstname} ${payload.lastname}`.trim();
  html = replaceAll(html, {
    fullName,
    email,
    phone: payload.phone ?? "—",
    message: "Gracias por contactarnos. Hemos recibido su consulta y le responderemos pronto.",
    checkIn: payload.checkIn ?? "—",
    checkOut: payload.checkOut ?? "—",
    nights: "—",
    adults: payload.adults != null ? String(payload.adults) : "—",
    children: payload.children != null ? String(payload.children) : "—",
    source,
    now: new Date().toLocaleString("es-CR", { hour12: false }),
  });

  return await resend.emails.send({
    from: resolveFrom(),
    to: email, // Se envía al correo del cliente
    subject: `Confirmación de contacto - Villas Izu Garden`,
    html,
  });
}
