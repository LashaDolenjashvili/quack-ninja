import { redirect } from "next/navigation";

export default function AppDocsCatchAll() {
  redirect("/docs");
}
