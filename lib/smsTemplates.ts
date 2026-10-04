import { formatDate, formatTime } from "@/lib/format";

interface AppointmentSmsInput {
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
}

export function appointmentBookedSms({ doctorName, appointmentDate, appointmentTime }: AppointmentSmsInput) {
  return `CareSlot: Your appointment request with ${doctorName} on ${formatDate(appointmentDate)} at ${formatTime(appointmentTime)} was received. We'll text you again once it's confirmed.`;
}

export function appointmentConfirmedSms({ doctorName, appointmentDate, appointmentTime }: AppointmentSmsInput) {
  return `CareSlot: Your appointment with ${doctorName} on ${formatDate(appointmentDate)} at ${formatTime(appointmentTime)} is confirmed. See you then.`;
}

export function appointmentCancelledSms({ doctorName, appointmentDate, appointmentTime }: AppointmentSmsInput) {
  return `CareSlot: Your appointment with ${doctorName} on ${formatDate(appointmentDate)} at ${formatTime(appointmentTime)} was cancelled. Book a new time anytime.`;
}

export function appointmentRescheduledSms({ doctorName, appointmentDate, appointmentTime }: AppointmentSmsInput) {
  return `CareSlot: Your appointment with ${doctorName} is now set for ${formatDate(appointmentDate)} at ${formatTime(appointmentTime)}.`;
}

export function medicationReadySms({ medicationName }: { medicationName: string }) {
  return `CareSlot: ${medicationName} is ready for you to collect from the pharmacy desk.`;
}
