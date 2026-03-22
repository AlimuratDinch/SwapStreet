"use client";

import { Header } from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function SettingsPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [sustainabilityTracking, setSustainabilityTracking] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  
  async function deleteAcount() {
    const res = await fetch(`${API_URL}/auth/deleteUser`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Could not delete user.");
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
      <Header />

      <div className="mx-auto max-w-4xl px-4 pt-24 pb-12">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">
          Settings
        </h1>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Sustainability Tracking
              </h2>
              <p className="text-sm text-gray-600 mt-1 max-w-md">
                Enable tracking of your environmental impact based on your
                purchases.
              </p>
            </div>
            
            <button
              onClick={() =>
                setSustainabilityTracking((prev) => !prev)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                sustainabilityTracking ? "bg-teal-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  sustainabilityTracking
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
            <h2 className="text-lg font-medium text-red-600 mb-2">
              Delete Account
            </h2>
            <p className="text-sm text-gray-600 mb-4 max-w-md">
              Permanently delete your account and all associated data. You cannot undo this action.
            </p>

            {showDeleteConfirm ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-700">
                  Type <span className="font-semibold">DELETE</span> to confirm.
                </p>

                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Type DELETE"
                />

                <div className="flex gap-3">
                  <button
                    onClick={deleteAcount}
                    disabled={confirmText !== "DELETE"}
                    className={`px-4 py-2 rounded-lg font-medium text-white ${
                      confirmText === "DELETE"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    Confirm Deletion
                  </button>

                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmText("");
                    }}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
              >
                Delete Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}