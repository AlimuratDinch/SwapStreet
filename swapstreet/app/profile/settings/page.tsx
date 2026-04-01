"use client";

import { Header } from "@/components/common/Header";
import { logger } from "@/components/common/logger";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function Separator() {
  return <div className="border-b-2 border-gray-600 w-full" />;
}

export default function SettingsPage() {
  const { accessToken, logout } = useAuth();
  const router = useRouter();
  const [sustainabilityTracking, setSustainabilityTracking] = useState(true);

  async function deleteAcount() {
    try {
      const res = await fetch(`${API_URL}/auth/deleteUser`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        logger.warn(errorText);
        throw Error(errorText);
      }

      logout();
    } catch (exception) {
      const error: Error = exception as Error;
      alert(error?.toString());
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p>Manage your preferences</p>

        <div>
          <div className="my-8">
            <Separator />
          </div>

          <h2 className="text-lg font-medium text-gray-900 my-2">Behavior</h2>

          {/*Sustainability Tracking*/}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 text-sm">
                Sustainability Tracking
              </h3>
              <p className="text-sm text-gray-600 max-w-md">
                Allow tracking purchases to quantitatively understand your
                environmental impact.
              </p>
            </div>

            <button
              onClick={() => setSustainabilityTracking((prev) => !prev)}
              id="toggleSustainabilityTracking"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                sustainabilityTracking ? "bg-teal-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  sustainabilityTracking ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="my-8">
            <Separator />
          </div>

          <h2 className="text-lg font-medium text-gray-900 my-2">Actions</h2>

          {/*Delete Account*/}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-600 text-sm">
                Delete Account
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md">
                Permanently delete your data and account. This action is
                irreversable.
              </p>
            </div>
            <button
              onClick={() => deleteAcount()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
