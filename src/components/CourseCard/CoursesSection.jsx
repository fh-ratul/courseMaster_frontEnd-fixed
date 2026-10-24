import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getCourses } from "../../services/courses.api";
import CoursesFilters from "./CoursesFilters";
import CoursesGrid from "./CoursesGrid";
import CoursesPagination from "./CoursesPagination";

export default function CoursesSection() {
    const { user } = useSelector((state) => state.auth);
    const [courses, setCourses] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // query states
    const [page, setPage] = useState(1);
    const [limit] = useState(8);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");

    // values actually sent to the API: search applies on submit, text filters are debounced
    const [appliedSearch, setAppliedSearch] = useState("");
    const [debouncedCategory, setDebouncedCategory] = useState("");
    const [debouncedTags, setDebouncedTags] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            if (category === debouncedCategory && tags === debouncedTags) return;
            setDebouncedCategory(category);
            setDebouncedTags(tags);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [category, tags, debouncedCategory, debouncedTags]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page,
                limit,
                search: appliedSearch || undefined,
                sort: sort || undefined,
                category: debouncedCategory || undefined,
                tags: debouncedTags || undefined,
            };

            const res = await getCourses(params);
            setCourses(res.data.courses || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            setError("Failed to load courses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
        // eslint-disable-next-line
    }, [page, sort, appliedSearch, debouncedCategory, debouncedTags]);

    const onSearchSubmit = (e) => {
        e.preventDefault();
        setAppliedSearch(search.trim());
        setPage(1);
    };

    // reset to first page in the same render as the sort change (avoids a second request)
    const handleSortChange = (value) => {
        setSort(value);
        setPage(1);
    };

    return (
        <div className="space-y-6">

            <CoursesFilters
                search={search} setSearch={setSearch}
                sort={sort} setSort={handleSortChange}
                category={category} setCategory={setCategory}
                tags={tags} setTags={setTags}
                onSearchSubmit={onSearchSubmit}
            />

            {/* states */}
            {loading && (
                <div className="flex justify-center py-10">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span>{error}</span>
                </div>
            )}

            {!loading && !error && courses.length === 0 && (
                <div className="rounded-xl border border-primary/20 bg-base-200 p-6 text-center">
                    <h3 className="text-lg font-semibold text-primary">
                        No courses found
                    </h3>
                    <p className="mt-1 text-base-content/70">
                        Try adjusting your search or filters.
                    </p>
                </div>
            )}


            {!loading && !error && courses.length > 0 && (
                <>
                    <CoursesGrid courses={courses} />
                    {user?.role === "admin" && (
                        <div className="flex justify-center pt-4">
                            <Link
                                to="/admin/courses"
                                className="btn btn-primary btn-wide"
                            >
                                Manage Courses
                            </Link>
                        </div>
                    )}
                </>
            )}

            <CoursesPagination
                page={page}
                totalPages={totalPages}
                setPage={setPage}
            />
        </div>
    );
}
