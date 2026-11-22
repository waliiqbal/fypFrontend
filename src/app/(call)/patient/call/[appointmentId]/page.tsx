import { VideoCallScreen } from "@/modules/video";

export default async function PatientCallPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  return <VideoCallScreen appointmentId={Number(appointmentId)} portal="patient" />;
}
