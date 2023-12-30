class APIFeatures {
  constructor(query, queryObj) {
    this.query = query;
    this.queryObj = queryObj;
    this.totalRecords = 0; // Initialize totalRecords to 0
  }

  paginate() {
    const page = this.queryObj.page * 1 || 1;
    const limit = this.queryObj.limit * 1 || 1;
    const skip = page * limit - limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  async getTotalRecords() {
    // Use countDocuments to get the total number of records without pagination
    this.totalRecords = await this.query.model.countDocuments(
      this.query._conditions
    );
    return this.totalRecords;
  }

  getPaginationInfo() {
    const currentPage = this.queryObj.page * 1 || 1;
    const limit = this.queryObj.limit * 1 || 1;

    return {
      currentPage,
      totalRecords: this.totalRecords,
      totalPages: Math.ceil(this.totalRecords / limit),
    };
  }
}

module.exports = APIFeatures;
