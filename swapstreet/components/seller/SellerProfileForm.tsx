"use client";

import React from "react";
import ImageCropModal from "@/components/image/ImageCropModal";
import type { UseSellerProfileFormReturn } from "@/components/seller/useSellerProfileForm";

export interface SellerProfileFormProps extends UseSellerProfileFormReturn {
  idPrefix: string;
  title: string;
  subtitle: string;
  submitLabel: string;
  showNotSignedInWarning?: boolean;
  cancelButton?: { label: string; onClick: () => void };
}

export function SellerProfileForm({
  idPrefix,
  title,
  subtitle,
  submitLabel,
  showNotSignedInWarning,
  cancelButton,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  bio,
  setBio,
  fsa,
  setFsa,
  selectedProvinceId,
  setSelectedProvinceId,
  selectedCityId,
  setSelectedCityId,
  cityInputValue,
  setCityInputValue,
  cityDropdownOpen,
  setCityDropdownOpen,
  provinces,
  citiesFilteredByName,
  avatarInputRef,
  bannerInputRef,
  handleAvatarChange,
  handleBannerChange,
  closeCropModal,
  handleCropConfirm,
  cropTarget,
  cropPreviewUrl,
  cropFile,
  error,
  loading,
  handleSubmit,
  currentAvatarUrl,
  currentBannerUrl,
  setError,
}: SellerProfileFormProps) {
  return (
    <>
      <ImageCropModal
        open={!!(cropTarget && cropPreviewUrl)}
        imageUrl={cropPreviewUrl}
        aspect={cropTarget === "avatar" ? 1 : 3}
        cropShape={cropTarget === "avatar" ? "round" : "rect"}
        onConfirm={handleCropConfirm}
        onCancel={closeCropModal}
        onError={setError}
        sourceFileName={cropFile?.name}
      />

      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6 rounded-lg bg-white p-6 shadow-sm border border-gray-200"
      >
        {showNotSignedInWarning && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
            It looks like you&apos;re not signed in. If you&apos;re already
            signed, try refreshing this page.
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor={`${idPrefix}-first-name`}
              className="block text-sm font-medium text-gray-700"
            >
              First name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id={`${idPrefix}-first-name`}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}-last-name`}
              className="block text-sm font-medium text-gray-700"
            >
              Last name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id={`${idPrefix}-last-name`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Your last name"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor={`${idPrefix}-province`}
              className="block text-sm font-medium text-gray-700"
            >
              Province <span className="text-red-500">*</span>
            </label>
            <select
              id={`${idPrefix}-province`}
              value={selectedProvinceId ?? ""}
              onChange={(e) =>
                setSelectedProvinceId(
                  e.target.value ? parseInt(e.target.value) : null,
                )
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
              disabled={loading}
            >
              <option value="" disabled>
                Select province
              </option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <label
              htmlFor={`${idPrefix}-city`}
              className="block text-sm font-medium text-gray-700"
            >
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id={`${idPrefix}-city`}
              value={cityInputValue}
              onChange={(e) => {
                setCityInputValue(e.target.value);
                setCityDropdownOpen(true);
              }}
              onFocus={() => selectedProvinceId && setCityDropdownOpen(true)}
              onBlur={() => setTimeout(() => setCityDropdownOpen(false), 150)}
              placeholder={
                selectedProvinceId
                  ? "Type to search city..."
                  : "Select province first"
              }
              disabled={loading || !selectedProvinceId}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-50 disabled:text-gray-500"
              autoComplete="off"
            />
            {cityDropdownOpen && selectedProvinceId && (
              <ul
                className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                role="listbox"
              >
                {citiesFilteredByName.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-gray-500">
                    No matching city
                  </li>
                ) : (
                  citiesFilteredByName.map((c) => (
                    <li
                      key={c.id}
                      role="option"
                      aria-selected={selectedCityId === c.id}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-teal-50 focus:bg-teal-50 focus:outline-none"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedCityId(c.id);
                        setCityInputValue(c.name);
                        setCityDropdownOpen(false);
                      }}
                    >
                      {c.name}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}-fsa`}
              className="block text-sm font-medium text-gray-700"
            >
              FSA <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              id={`${idPrefix}-fsa`}
              value={fsa}
              onChange={(e) => setFsa(e.target.value.toUpperCase())}
              placeholder="A1A"
              maxLength={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-bio`}
            className="block text-sm font-medium text-gray-700"
          >
            Bio
          </label>
          <textarea
            id={`${idPrefix}-bio`}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What makes your mini shop special?"
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor={`${idPrefix}-avatar`}
              className="block text-sm font-medium text-gray-700"
            >
              Avatar image
            </label>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              id={`${idPrefix}-avatar`}
              onChange={handleAvatarChange}
              className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-500 file:px-3 file:py-2 file:text-white hover:file:bg-teal-600"
            />
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentAvatarUrl}
                alt="Avatar"
                className="h-24 w-24 rounded-full object-cover ring-1 ring-gray-200"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}-banner`}
              className="block text-sm font-medium text-gray-700"
            >
              Banner image
            </label>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              id={`${idPrefix}-banner`}
              onChange={handleBannerChange}
              className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-500 file:px-3 file:py-2 file:text-white hover:file:bg-teal-600"
            />
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentBannerUrl}
                alt="Banner"
                className="h-24 w-full rounded-md object-cover ring-1 ring-gray-200"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {cancelButton && (
            <button
              type="button"
              onClick={cancelButton.onClick}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {cancelButton.label}
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}
