const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

const enrollCourse = async (studentId, courseId, batchId = null) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");

  // Check if already enrolled
  let enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  });

  if (enrollment) {
    // Already enrolled, return existing enrollment
    return enrollment;
  }

  // batch (if provided) must belong to this course
  if (batchId && !course.batches.id(batchId)) {
    throw new Error("Selected batch does not belong to this course");
  }

  // Create new enrollment
  enrollment = await Enrollment.create({
    student: studentId,
    course: courseId,
    batchId,
    progress: { completedLessons: [], percent: 0 },
  });

  return enrollment;
};

const getMyEnrollments = async (studentId) => {
  return Enrollment.find({ student: studentId })
    .populate("course", "title instructorName price category tags")
    .sort({ createdAt: -1 });
};

const completeLesson = async (studentId, enrollId, lessonId) => {
  const enrollment = await Enrollment.findOne({ _id: enrollId, student: studentId });
  if (!enrollment) throw new Error("Enrollment not found");

  const course = await Course.findById(enrollment.course);
  if (!course) throw new Error("Course not found");

  const lessonIds = course.syllabus.flatMap((mod) => mod.lessons.map((l) => String(l._id)));
  if (!lessonIds.includes(String(lessonId))) {
    throw new Error("Lesson does not belong to this course");
  }

  // avoid duplicates
  const alreadyDone = enrollment.progress.completedLessons
    .map(String)
    .includes(String(lessonId));

  if (!alreadyDone) {
    enrollment.progress.completedLessons.push(lessonId);
  }

  // calculate percent (only count lessons that still exist in the course)
  const totalLessons = lessonIds.length;
  const completed = enrollment.progress.completedLessons.filter((id) =>
    lessonIds.includes(String(id))
  ).length;
  enrollment.progress.percent =
    totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);

  await enrollment.save();
  return enrollment;
};

module.exports = { enrollCourse, getMyEnrollments, completeLesson };
