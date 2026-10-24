// service to handle course-related operations

const Course = require("../models/Course");

// escape user input so it is matched literally inside a RegExp
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getCourses = async (query) => {
  const {
    page = 1,
    limit = 8,
    search = "",
    sort = "",
    category,
    tags,
  } = query;

  // Validate and sanitize pagination parameters
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 8)); // Max 100 items per page

  const filter = {};

  if (search && typeof search === "string" && search.trim()) {
    const pattern = escapeRegex(search.trim());
    filter.$or = [
      { title: { $regex: pattern, $options: "i" } },
      { instructorName: { $regex: pattern, $options: "i" } },
    ];
  }

  if (category && typeof category === "string" && category.trim()) {
    // case-insensitive partial match, e.g. "web" -> "Web Development"
    filter.category = { $regex: escapeRegex(category.trim()), $options: "i" };
  }

  if (tags && typeof tags === "string") {
    const tagArray = tags.split(",").map(t => t.trim()).filter(t => t); // "mern,react"
    if (tagArray.length > 0) {
      filter.tags = { $in: tagArray.map((t) => new RegExp(`^${escapeRegex(t)}$`, "i")) };
    }
  }

  let sortObj = {};
  if (sort === "price_asc") sortObj.price = 1;
  if (sort === "price_desc") sortObj.price = -1;

  const skip = (pageNum - 1) * limitNum;

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum),
    Course.countDocuments(filter),
  ]);

  return {
    courses,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  };
};

const getCourseById = async (id) => {
  const course = await Course.findById(id);
  if (!course) throw new Error("Course not found");
  return course;
};

module.exports = { getCourses, getCourseById };
