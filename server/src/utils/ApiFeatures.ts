import type { Query } from "mongoose";

export class APIFeatures<T> {
  query: Query<T[], T>;
  queryString: Record<string, any>;

  constructor(query: Query<T[], T>, queryString: Record<string, any>) {
    this.query = query;
    this.queryString = queryString;
  }

  // 1. Filtreleme (Filtering & Advanced Filtering: gte, lte vb.)
  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Gelişmiş operatörleri dönüştürme (örn: price[gte]=100 -> { price: { $gte: 100 } })
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  // 2. Arama (Search by title or description)
  search(): this {
    if (this.queryString.search) {
      const searchRegex = new RegExp(this.queryString.search as string, "i");
      this.query = this.query.find({
        $or: [{ title: searchRegex }, { description: searchRegex }],
      });
    }
    return this;
  }

  // 3. Sıralama (Sorting)
  sort(): this {
    if (this.queryString.sort) {
      const sortBy = (this.queryString.sort as string).split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt"); // Varsayılan: En yeni
    }
    return this;
  }

  // 4. Alan Sınırlandırma (Field Limiting / Projection)
  limitFields(): this {
    if (this.queryString.fields) {
      const fields = (this.queryString.fields as string).split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  // 5. Sayfalama (Pagination)
  paginate(): this {
    const page = Math.max(1, Number(this.queryString.page) || 1);
    const limit = Math.max(1, Number(this.queryString.limit) || 10);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
