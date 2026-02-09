import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, TrendingUp, ArrowRight } from "lucide-react";
import api from "../configs/api.js";
import toast from "react-hot-toast";

const Home = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [publicProjects, setPublicProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTeamMembers: 0,
  });

  useEffect(() => {
    fetchPublicProjects();
  }, []);

  const fetchPublicProjects = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/public/projects/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPublicProjects(data);

      // Calculer les stats
      setStats({
        totalProjects: data.length,
        activeProjects: data.filter((p) => p.status === "ACTIVE").length,
        totalTeamMembers: data.reduce(
          (acc, p) => acc + (p.members?.length || 0),
          0,
        ),
      });
    } catch (error) {
      console.error("❌ Error fetching public projects:", error);
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectClick = (projectId, workspaceId) => {
    navigate(`/project/${projectId}?workspace=${workspaceId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Featured project (first one)
  const featuredProject = publicProjects[0];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left Content */}
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Tongasoa, {user?.firstName || "User"}! 👋
              </h1>
              <p className="text-xl text-gray-600 dark:text-zinc-300 mb-8">
                Jereo ny tetikasa ivelany sy hiara-hiasa amin'ny ekipa
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalProjects}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-zinc-400">
                    Tetikasa Ivelany
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats.activeProjects}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-zinc-400">
                    Efa Mandeha
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.totalTeamMembers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-zinc-400">
                    Mpikambana
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/publicProjects")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                Jereo ny tetikasa rehetra
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Right Image/Illustration */}
            <div className="flex-1">
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 shadow-lg">
                <div className="aspect-video bg-gradient-to-br from-blue-200 to-indigo-200 dark:from-blue-900 dark:to-indigo-900 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🚀</div>
                    <p className="text-gray-700 dark:text-zinc-300 font-medium">
                      Mandeha amin'ny Tetikasa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Project Section */}
      {featuredProject && (
        <div className="max-w-6xl mx-auto py-16 px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Tetikasa Nivoatra
          </h2>

          <div
            onClick={() =>
              handleProjectClick(
                featuredProject.id,
                featuredProject.workspaceId,
              )
            }
            className="bg-white dark:bg-zinc-800 rounded-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
          >
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Left: Image */}
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center min-h-80">
                <div className="text-center">
                  <div className="text-8xl mb-4">📊</div>
                </div>
              </div>

              {/* Right: Content */}
              <div className="flex flex-col justify-center">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                    {featuredProject.status}
                  </span>
                </div>

                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {featuredProject.name}
                </h3>

                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                  {featuredProject.workspace?.name}
                </p>

                {featuredProject.description && (
                  <p className="text-gray-600 dark:text-zinc-300 mb-6 leading-relaxed">
                    {featuredProject.description}
                  </p>
                )}

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      Fizotran'ny
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {featuredProject.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${featuredProject.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 pt-6 border-t border-gray-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Users
                      size={18}
                      className="text-gray-600 dark:text-zinc-400"
                    />
                    <span className="text-sm text-gray-600 dark:text-zinc-400">
                      {featuredProject.members?.length || 0} mpikambana
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      size={18}
                      className="text-gray-600 dark:text-zinc-400"
                    />
                    <span className="text-sm text-gray-600 dark:text-zinc-400">
                      {featuredProject.tasks?.length || 0} asa
                    </span>
                  </div>
                  {featuredProject.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar
                        size={18}
                        className="text-gray-600 dark:text-zinc-400"
                      />
                      <span className="text-sm text-gray-600 dark:text-zinc-400">
                        {new Date(
                          featuredProject.start_date,
                        ).toLocaleDateString("mg-MG", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Projects Section */}
      {publicProjects.length > 1 && (
        <div className="bg-gray-50 dark:bg-zinc-900/50 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Tetikasa Vao Avy Ko Hita
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicProjects.slice(1, 7).map((project) => (
                <div
                  key={project.id}
                  onClick={() =>
                    handleProjectClick(project.id, project.workspaceId)
                  }
                  className="bg-white dark:bg-zinc-800 rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                        {project.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        {project.workspace?.name}
                      </p>
                    </div>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex-shrink-0 ml-2">
                      {project.status}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}

                  {project.progress !== undefined && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                        {project.progress}% complete
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{project.members?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={14} />
                      <span>{project.tasks?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => navigate("/publicProjects")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                Jereo ny tetikasa rehetra
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {publicProjects.length === 0 && (
        <div className="max-w-6xl mx-auto py-16 px-4 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Tsy misy tetikasa hita ny vao avy ko
          </h3>
          <p className="text-gray-600 dark:text-zinc-400 mb-8">
            Ndao hanasa tetikasa ivelany fampiasa rehetra
          </p>
          <button
            onClick={() => navigate("/projects")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Hamorona tetikasa ivelany
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
