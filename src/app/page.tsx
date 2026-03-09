import { redirect } from "next/navigation";

export default function Home() {
  // Redirect users to the dashboard since there is no public landing page for this internal tool
  redirect("/dashboard");
}
