import { redirect } from 'next/navigation';

export default function ProtocolsPage() {
  redirect('/docs?tab=standards');
}
