import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Securely access the Doxera corporate management workspace or your authenticated LLC document portal.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Log In | Doxera",
    description:
      "Securely access the Doxera corporate management workspace or your authenticated LLC document portal.",
    url: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
