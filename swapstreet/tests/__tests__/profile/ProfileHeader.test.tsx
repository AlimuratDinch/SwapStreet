import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import type { ProfileResponse } from "@/lib/api/profile";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={String(props.alt ?? "")} src={String(props.src ?? "")} />
  ),
}));

function buildProfile(overrides: Partial<ProfileResponse>): ProfileResponse {
  return {
    id: "p1",
    status: "Offline",
    verifiedSeller: false,
    firstName: "A",
    lastName: "B",
    rating: 4.2,
    cityId: 1,
    fsa: "M5V",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderHeader(profile: ProfileResponse) {
  return render(
    <ProfileHeader
      profile={profile}
      fullName="A B"
      location={null}
      memberSince="January 2025"
      profileImageUrl="/images/default-avatar-icon.jpg"
      bannerImageUrl="/images/default-seller-banner.png"
      activeTab="listings"
      onTabChange={jest.fn()}
    />,
  );
}

describe("ProfileHeader verified badge", () => {
  it("shows blue check styling when verifiedSeller is true", () => {
    renderHeader(buildProfile({ verifiedSeller: true }));
    const badge = screen.getByLabelText("Verified seller");
    expect(badge).toHaveClass("text-blue-600");
    expect(badge).not.toHaveClass("text-gray-300");
  });

  it("shows muted styling when not verified", () => {
    renderHeader(buildProfile({ verifiedSeller: false }));
    const badge = screen.getByLabelText("Not verified");
    expect(badge).toHaveClass("text-gray-300");
    expect(badge).not.toHaveClass("text-blue-600");
  });
});
