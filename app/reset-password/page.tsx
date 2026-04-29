"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/30">
      <Container className="flex flex-col items-center justify-center w-full">
        <Card className="w-full md:w-5/12 max-w-2xl p-8 md:p-10 rounded-3xl shadow-2xl border border-primary/10 bg-card/90 backdrop-blur-lg mt-20">
          <div className="mb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold auth-heading mb-1 tracking-tight">
              Reset Password
            </h1>
            <p className="text-base auth-subtext font-medium">
              Enter your new password below.
            </p>
          </div>
          {success ? (
            <div className="text-center py-8">
              <p className="text-lg text-primary font-semibold mb-2">
                Password reset successful!
              </p>
              <Link
                href="/login"
                className="auth-link font-semibold underline"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="block text-base font-semibold mb-1 auth-subtext"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-base font-semibold mb-1 auth-subtext"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && (
                <p className="text-red-500 text-base text-center font-medium">
                  {error}
                </p>
              )}
              <Button
                className="w-full py-2 text-base rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 shadow-md hover:from-primary/80 hover:to-primary"
                size="lg"
                type="submit"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
          <div className="my-6 border-t border-primary/10" />
          <p className="text-base text-center auth-subtext">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="auth-link font-semibold underline"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
}