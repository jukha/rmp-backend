function calculateOverallRating(ratings) {
  if (!ratings || ratings.length === 0) {
    return 0;
  }

  const totalOverallRating = ratings.reduce(
    (sum, rating) => sum + rating.overallRating,
    0
  );
  const overallRating = totalOverallRating / ratings.length;

  return overallRating;
}

module.exports = calculateOverallRating;
