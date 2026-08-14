import { formatDate, formatTime } from "@/lib/format";

function wrapper(bodyHtml: string): string {
  return `
    <div style="font-family: 'Work Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #2D2D2D;">
      <div style="padding: 24px 0; text-align: center;">
        <span style="font-size: 20px; font-weight: 700; color: #1A5C52;">CareSlot</span>
      </div>
      <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 14px; padding: 28px;">
        ${bodyHtml}
      </div>
      <div style="padding: 20px 0; text-align: center; font-size: 13px; color: #6B7280;">
        Unity Hospital, Eleyele, Ibadan, Oyo State
      </div>
    </div>
  `;
}

interface AppointmentEmailInput {
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
}

export function appointmentBookedEmail({ doctorName, appointmentDate, appointmentTime }: AppointmentEmailInput) {
  return {
    subject: "Your CareSlot appointment request was received",
    html: wrapper(`
      <h1 style="font-size: 18px; margin: 0 0 12px;">Appointment requested</h1>
      <p style="font-size: 15px; line-height: 1.5;">
        You've requested an appointment with <strong>${doctorName}</strong> on
        <strong>${formatDate(appointmentDate)}</strong> at <strong>${formatTime(appointmentTime)}</strong>.
        We'll email you again once the clinic confirms it.
      </p>
    `),
  };
}

export function appointmentConfirmedEmail({ doctorName, appointmentDate, appointmentTime }: AppointmentEmailInput) {
  return {
    subject: "Your CareSlot appointment is confirmed",
    html: wrapper(`
      <h1 style="font-size: 18px; margin: 0 0 12px; color: #1E7A46;">Appointment confirmed</h1>
      <p style="font-size: 15px; line-height: 1.5;">
        Your appointment with <strong>${doctorName}</strong> on
        <strong>${formatDate(appointmentDate)}</strong> at <strong>${formatTime(appointmentTime)}</strong>
        is confirmed. See you then.
      </p>
    `),
  };
}

export function appointmentCancelledEmail({ doctorName, appointmentDate, appointmentTime }: AppointmentEmailInput) {
  return {
    subject: "Your CareSlot appointment was cancelled",
    html: wrapper(`
      <h1 style="font-size: 18px; margin: 0 0 12px; color: #B23A2E;">Appointment cancelled</h1>
      <p style="font-size: 15px; line-height: 1.5;">
        Your appointment with <strong>${doctorName}</strong> on
        <strong>${formatDate(appointmentDate)}</strong> at <strong>${formatTime(appointmentTime)}</strong>
        has been cancelled. Book a new time whenever you're ready.
      </p>
    `),
  };
}

export function appointmentRescheduledEmail({ doctorName, appointmentDate, appointmentTime }: AppointmentEmailInput) {
  return {
    subject: "Your CareSlot appointment was rescheduled",
    html: wrapper(`
      <h1 style="font-size: 18px; margin: 0 0 12px;">Appointment rescheduled</h1>
      <p style="font-size: 15px; line-height: 1.5;">
        Your appointment with <strong>${doctorName}</strong> is now set for
        <strong>${formatDate(appointmentDate)}</strong> at <strong>${formatTime(appointmentTime)}</strong>.
      </p>
    `),
  };
}

export function medicationReadyEmail({ medicationName }: { medicationName: string }) {
  return {
    subject: "Your medication is ready for pickup",
    html: wrapper(`
      <h1 style="font-size: 18px; margin: 0 0 12px;">Ready for pickup</h1>
      <p style="font-size: 15px; line-height: 1.5;">
        <strong>${medicationName}</strong> is ready for you to collect from the Unity Hospital pharmacy desk.
      </p>
    `),
  };
}

export function staffVerificationCodeEmail({ code }: { code: string }) {
  return {
    subject: `${code} is your CareSlot staff verification code`,
    html: wrapper(`
      <h1 style="font-size: 18px; margin: 0 0 12px;">Verify your staff account</h1>
      <p style="font-size: 15px; line-height: 1.5; margin: 0 0 18px;">
        Enter this code to finish creating your CareSlot staff account. It expires in 10 minutes.
      </p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1A5C52; text-align: center; padding: 16px; background: #F8F9FA; border-radius: 10px;">
        ${code}
      </div>
      <p style="font-size: 13px; color: #6B7280; margin: 18px 0 0;">
        If you didn't request this, you can ignore this email.
      </p>
    `),
  };
}
