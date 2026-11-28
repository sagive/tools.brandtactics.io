"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md shadow-lg rounded-xl">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            BT Staff Registration
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Account registration is by administrator invitation only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-gray-600">
            Existing team members can log in directly using Google Workspace or by requesting a Magic Link.
          </p>
          <Link href="/login" className="block w-full">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Go to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
