// src/pages/api/contacto.ts
import type { APIContext } from "astro";
import {
  sendContactEmailIzu,
  sendGuestConfirmationIzu,
} from "@/lib/sendContactEmailIzu";

export const prerender = false;

function getStr(v: FormDataEntryValue | null | undefined): string {
  return typeof v === "string" ? v : "";
}

function parseNumberMaybe(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function POST({ request }: APIContext) {
  try {
    // 🔹 Inicialización
    let firstname = "";
    let lastname = "";
    let email = "";
    let phone = "";
    let message = "";
    let website = ""; // honeypot

    // Campos opcionales para hospedaje
    let checkIn = "";
    let checkOut = "";
    let adults: number | undefined;
    let children: number | undefined;
    let source = "";

    // 📦 Leer datos (JSON o formData)
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json();
      firstname = body.firstname || "";
      lastname = body.lastname || "";
      email = body.email || "";
      phone = body.phone || "";
      message = body.message || "";
      website = body.website || ""; // honeypot
      checkIn = body.checkIn || "";
      checkOut = body.checkOut || "";
      adults = parseNumberMaybe(body.adults);
      children = parseNumberMaybe(body.children);
      source = body.source || "Web";
    } else {
      const formData = await request.formData();
      firstname = getStr(formData.get("firstname"));
      lastname = getStr(formData.get("lastname"));
      email = getStr(formData.get("email"));
      phone = getStr(formData.get("phone"));
      message = getStr(formData.get("message"));
      website = getStr(formData.get("website")); // honeypot
      checkIn = getStr(formData.get("checkIn"));
      checkOut = getStr(formData.get("checkOut"));
      adults = parseNumberMaybe(formData.get("adults"));
      children = parseNumberMaybe(formData.get("children"));
      source = getStr(formData.get("source")) || "Web";
    }

    // 🕸️ Honeypot (para bots)
    if (website) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ✅ Validación básica
    if (!firstname || !lastname || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Nombre, apellidos y correo electrónico son obligatorios.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 🚀 Enviar correos con Resend
    await Promise.all([
      sendContactEmailIzu({
        firstname,
        lastname,
        email,
        phone,
        message,
        checkIn,
        checkOut,
        adults,
        children,
        source,
      }),
      sendGuestConfirmationIzu({
        firstname,
        lastname,
        email,
        phone,
        message,
        checkIn,
        checkOut,
        adults,
        children,
        source,
      }),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: "✅ Mensaje enviado correctamente.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error al procesar contacto:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "❌ Ocurrió un error al enviar tu mensaje.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
