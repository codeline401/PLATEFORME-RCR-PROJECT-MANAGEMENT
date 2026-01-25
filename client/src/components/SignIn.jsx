// src/pages/SignIn.jsx (créez ce fichier)
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";

const SignIn = () => {
  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <ClerkSignIn />
    </div>
  );
};

export default SignIn;
