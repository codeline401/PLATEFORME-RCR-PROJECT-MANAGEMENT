// src/pages/SignUp.jsx (créez ce fichier)
import { SignUp as ClerkSignUp } from "@clerk/clerk-react";

const SignUp = () => {
  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <ClerkSignUp />
    </div>
  );
};

export default SignUp;
