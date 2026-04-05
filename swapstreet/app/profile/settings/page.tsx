"use client";

import { Header } from "@/components/common/Header";
import { logger } from "@/components/common/logger";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  getLinkedAccounts,
  unlinkAccount,
  initiateOAuthLink,
  type LinkedAccount,
} from "@/lib/api/oauth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function Separator() {
  return <div className="w-full border-b border-gray-600/40" />;
}

export default function SettingsPage() {
  const { accessToken, logout } = useAuth();
  const [sustainabilityTracking, setSustainabilityTracking] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");

  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [accountToUnlink, setAccountToUnlink] = useState<LinkedAccount | null>(
    null,
  );
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadLinkedAccounts() {
      if (!accessToken) return;

      try {
        setIsLoadingAccounts(true);
        setAccountsError(null);
        const response = await getLinkedAccounts(accessToken);
        setLinkedAccounts(response.linkedAccounts);
      } catch (error) {
        logger.error("Failed to load linked accounts", error);
        setAccountsError("Failed to load linked accounts");
      } finally {
        setIsLoadingAccounts(false);
      }
    }

    loadLinkedAccounts();
  }, [accessToken]);

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

  async function handleUnlinkAccount() {
    if (!accountToUnlink || !accessToken) return;

    setIsUnlinking(true);
    setUnlinkError(null);

    try {
      await unlinkAccount(accountToUnlink.provider, accessToken);
      setLinkedAccounts((prev) =>
        prev.filter((acc) => acc.provider !== accountToUnlink.provider),
      );
      setIsUnlinkModalOpen(false);
      setAccountToUnlink(null);
      setSuccessMessage(
        `Successfully unlinked ${accountToUnlink.provider} account`,
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      logger.error("Failed to unlink account", error);
      setUnlinkError(
        error instanceof Error
          ? error.message
          : "Failed to unlink account. Please try again.",
      );
    } finally {
      setIsUnlinking(false);
    }
  }

  function isAccountLinked(provider: "google" | "facebook" | "apple") {
    return linkedAccounts.some((acc) => acc.provider === provider);
  }

  function getLinkedAccountEmail(provider: "google" | "facebook" | "apple") {
    return linkedAccounts.find((acc) => acc.provider === provider)?.email;
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p>Manage your preferences</p>

        {successMessage && (
          <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-teal-800 font-medium">
              {successMessage}
            </p>
          </div>
        )}

        <div>
          <div className="mt-4 mb-10">
            <Separator />
          </div>

          <h2 className="text-lg font-medium text-gray-900 my-2">
            Linked Accounts
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Connect social accounts for quick sign-in
          </p>

          {isLoadingAccounts ? (
            <div className="flex items-center gap-2 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
              <p className="text-sm text-gray-600">
                Loading linked accounts...
              </p>
            </div>
          ) : accountsError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{accountsError}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">
                      Google
                    </h3>
                    {isAccountLinked("google") && (
                      <p className="text-xs text-gray-500">
                        {getLinkedAccountEmail("google")}
                      </p>
                    )}
                  </div>
                </div>
                {isAccountLinked("google") ? (
                  <button
                    onClick={() => {
                      const account = linkedAccounts.find(
                        (acc) => acc.provider === "google",
                      );
                      if (account) {
                        setAccountToUnlink(account);
                        setIsUnlinkModalOpen(true);
                      }
                    }}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Unlink
                  </button>
                ) : (
                  <button
                    onClick={() => initiateOAuthLink("google")}
                    className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
                  >
                    Link Account
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 mb-10">
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

      {isUnlinkModalOpen && accountToUnlink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900">
              Unlink {accountToUnlink.provider} account?
            </h3>
            <p className="mt-2 text-sm text-gray-700">
              You will no longer be able to sign in using this{" "}
              {accountToUnlink.provider} account ({accountToUnlink.email}).
            </p>

            {unlinkError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{unlinkError}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsUnlinkModalOpen(false);
                  setAccountToUnlink(null);
                  setUnlinkError(null);
                }}
                disabled={isUnlinking}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlinkAccount}
                disabled={isUnlinking}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUnlinking ? "Unlinking..." : "Unlink Account"}
              </button>
            </div>
          </div>
        </div>
      )}

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
