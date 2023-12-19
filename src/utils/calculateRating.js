function calculateOverallRating(ratings) {
    const totalRatings = ratings.length;
    if (totalRatings === 0) return 0;
  
    const sum = ratings.reduce(
      (accumulator, rating) =>
        accumulator +
        Object.values(rating)
          .filter((value) => typeof value === 'number')
          .reduce((subAcc, subValue) => subAcc + subValue, 0),
      0
    );
  
    return sum / (totalRatings * Object.keys(ratings[0]).length);
  }
  
  module.exports = calculateOverallRating;