import { redirect } from "next/navigation";

// Root redirect: send to /select-group (AuthGuard handles unauthenticated users)
export default function RootPage() {
  redirect("/select-group");
}
