"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <main className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
        {!session ? (
          <>
            <h1 className="text-2xl font-bold mb-4">
              Welcome to ETS
            </h1>
            <p className="text-gray-600 mb-6">
              Please login to continue
            </p>
            <button
              onClick={() => signIn()}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Login
            </button>
            <p className="mt-4 text-sm text-center">
  Don’t have an account?{" "}
  <a href="/register" className="text-indigo-600 hover:underline">
    Sign up
  </a>
</p>

          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">
              Welcome, {session.user.name}
            </h1>
            <p className="text-gray-600 mb-4">
              Role: {session.user.role}
            </p>

            <div className="space-y-3">
              <a
                href="/dashboard"
                className="block w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
              >
                Go to Dashboard
              </a>

              <button
                onClick={() => signOut()}
                className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
