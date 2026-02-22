import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import Button from "../components/ui/Button";
import logo from "../assets/logo/logo-colored.svg";
import { supabase } from "../utils/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        navigate("/stats");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("بيانات الدخول غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={logo} alt="وَذَكِّرْ" className="h-16 w-auto" />
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary">لوحة التحكم</h1>
          <p className="text-sm text-gray-400">سجّل دخولك للمتابعة</p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-pill bg-red-50 px-4 py-3 text-center text-sm text-danger">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-600">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-pill bg-surface px-5 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-600">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-pill bg-surface px-5 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={!email || !password}
          >
            تسجيل الدخول
          </Button>
        </form>
      </div>
    </div>
  );
}
