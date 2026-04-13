"use client";

import { Header } from "@/components/common/Header";
import { logger } from "@/components/common/logger";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function Separator() {
  return <div className="w-full border-b border-gray-600/40" />;
}

export default function SettingsPage() {
  const { accessToken, logout } = useAuth();
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");

  async function deleteAcount() {
    setIsDeletingAccount(true);

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

      setIsDeleteModalOpen(false);
      setDeleteConfirmationInput("");
      logout();
    } catch (exception) {
      const error: Error = exception as Error;
      alert(error?.toString());
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p>Manage your preferences</p>

        <div>
          <div className="mt-4 mb-10">
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
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900">
              Delete account?
            </h3>
            <p className="mt-2 text-sm text-gray-700">
              This will permanently remove the following data from SwapStreet:
            </p>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>Your profile information</li>
              <li>Your listings and listing photos</li>
              <li>Your chat history and messages</li>
              <li>Your wishlist and saved items</li>
              <li>Your preferences and account settings</li>
            </ul>

            <p className="mt-4 text-sm font-medium text-red-700">
              This action cannot be undone.
            </p>

            <div className="mt-4">
              <label
                htmlFor="deleteAccountConfirmation"
                className="mb-1 block text-sm font-medium text-gray-800"
              >
                Type DELETE to confirm
              </label>
              <input
                id="deleteAccountConfirmation"
                type="text"
                value={deleteConfirmationInput}
                onChange={(event) =>
                  setDeleteConfirmationInput(event.currentTarget.value)
                }
                placeholder="DELETE"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationInput("");
                }}
                disabled={isDeletingAccount}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAcount()}
                disabled={
                  isDeletingAccount ||
                  deleteConfirmationInput.trim() !== "DELETE"
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingAccount ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
