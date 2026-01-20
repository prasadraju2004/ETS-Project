"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import SocialAuth from "../components/SocialAuth";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      return setError(data.message || "Registration failed");
    }

    // Auto-login
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: true,
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          Create Account
        </h1>

        {error && (
          <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder="Name"
            required
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />

          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            required
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <SocialAuth />

        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import { signIn } from "next-auth/react";
// import { useRouter } from "next/navigation";

// export default function RegisterPage() {
//   const router = useRouter();
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

// //   const handleRegister = async (e) => {
// //     e.preventDefault();
// //     setLoading(true);
// //     setError("");

// //     const res = await fetch(
// //       `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
// //       {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ name, email, password }),
// //       }
// //     );

// //     const data = await res.json();

// //     if (!res.ok) {
// //       setError(data.message || "Registration failed");
// //       setLoading(false);
// //       return;
// //     }

// //     // Auto-login after successful signup
// //     await signIn("credentials", {
// //       email,
// //       password,
// //       redirect: false,
// //     });

// //     router.push("/dashboard");
// //   };

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const handleChange = (e) =>
//     setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (form.password !== form.confirmPassword) {
//       return setError("Passwords do not match");
//     }

//     const res = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(form),
//       }
//     );

//     if (!res.ok) {
//       const data = await res.json();
//       return setError(data.message);
//     }

//     await signIn("credentials", {
//       email: form.email,
//       password: form.password,
//       redirect: true,
//       callbackUrl: "/dashboard",
//     });
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">
//       <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
//         <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>

//         {error && (
//           <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium">Name</label>
//             <input
//               required
//               value={form.name}
//               onChange={handleChange}
//               name="name"
//               className="w-full px-3 py-2 border rounded-md"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Email</label>
//             <input
//               type="email"
//               required
//               value={form.email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full px-3 py-2 border rounded-md"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Password</label>
//             <input
//               type="password"
//               required
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full px-3 py-2 border rounded-md"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Confirm Password</label>
//             <input
//               type="password"
//               required
//               name="confirmPassword"
//               value={password}
//               onChange={handleChange}
//               className="w-full px-3 py-2 border rounded-md"
//             />
//           </div>
          
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
//           >
//             {loading ? "Creating..." : "Sign Up"}
//           </button>
//         </form>

//         <p className="mt-4 text-sm text-center">
//           Already have an account?{" "}
//           <a href="/login" className="text-indigo-600 hover:underline">
//             Sign in
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// }
