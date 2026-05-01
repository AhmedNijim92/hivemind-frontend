import { redirect } from "next/navigation";

// Root redirect: send to /feed (AuthGuard handles unauthenticated users)
export default function RootPage() {
  redirect("/feed");
}
