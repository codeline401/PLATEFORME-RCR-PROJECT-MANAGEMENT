// src/pages/SignIn.jsx (créez ce fichier)
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import Footer from "./Footer";

const SignIn = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="flex justify-center items-center pt-16 pb-16 p-4">
        <ClerkSignIn />
      </div>
      <Footer />
    </div>
  );
};

export default SignIn;
