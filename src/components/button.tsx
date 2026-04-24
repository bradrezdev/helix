import { useState } from "react";

export default function PasswordField() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-md m-10">
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-200"
          placeholder="Contraseña"
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        </button>
      </div>
    </div>
  );
}