namespace backend.DTOs.Profile
{
    public static class ProfileReviewMapper
    {
        public static ProfileReviewResponseDto ToProfileReviewResponseDto(
            this global::ChatRating review,
            string? reviewerProfileImagePath)
        {
            return new ProfileReviewResponseDto
            {
                Id = review.Id,
                ChatroomId = review.ChatroomId,
                ReviewerId = review.ReviewerId,
                ReviewerFirstName = review.Reviewer?.FirstName ?? string.Empty,
                ReviewerLastName = review.Reviewer?.LastName ?? string.Empty,
                ReviewerProfileImagePath = reviewerProfileImagePath,
                RevieweeId = review.RevieweeId,
                Stars = review.Stars,
                Description = review.Description,
                CreatedAt = review.CreatedAt
            };
        }
    }
}
