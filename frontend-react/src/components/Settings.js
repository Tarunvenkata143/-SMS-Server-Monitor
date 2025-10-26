
  import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Settings = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    loadUserData();
  }, [navigate]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/auth/profile");
      setName(res.data.name || "");
      setPhone(res.data.phone || "");
      setEmail(res.data.email || "");
    } catch (err) {
      console.error(err);
      setError("Failed to load user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!name || !phone || !email) {
      setError("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setError("");
      await axios.put("/api/auth/profile", { name, phone, email });
      setMessage(
        "✅ Profile updated successfully!."
      );
    } catch (err) {
      console.error(err);
      setError(
        "Error updating profile: " +
          (err.response?.data?.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-lg transition-all duration-300 hover:shadow-xl">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          User Profile 
        </h1>

        {message && (
          <div className="bg-green-100 text-green-700 border border-green-400 px-4 py-2 rounded mb-4 text-sm text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 border border-red-400 px-4 py-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="9985252395"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="user@example.com"
            />
          </div>

          <button
            onClick={updateProfile}
            disabled={loading}
            className={`w-full mt-4 py-3 text-white font-semibold rounded-lg transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Need help?{" "}
          <a
            href="mailto:support@example.com"
            className="text-indigo-600 hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default Settings;
