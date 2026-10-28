import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPanel } from "./login-panel";

export const metadata: Metadata = { title: "ログイン" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPanel />
    </Suspense>
  );
}
