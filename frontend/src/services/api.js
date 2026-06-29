import localJobs from "../../../jobs.json";

const gradients = [
  "from-blue-500 to-cyan-600",
  "from-indigo-600 to-indigo-900",
  "from-sky-400 to-blue-600",
  "from-red-500 to-rose-700",
  "from-amber-600 to-yellow-800",
  "from-emerald-500 to-teal-700",
  "from-purple-500 to-indigo-700",
  "from-pink-500 to-rose-600",
  "from-violet-600 to-purple-900",
  "from-teal-500 to-emerald-600",
  "from-orange-500 to-red-600",
  "from-fuchsia-600 to-pink-700",
  "from-cyan-500 to-blue-600",
  "from-yellow-500 to-amber-600",
  "from-blue-800 to-indigo-950",
];

function getLogoBg(companyName) {
  if (!companyName) return gradients[0];
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export async function getJobs() {
  return localJobs.map((job, index) => {
    const company = job.company || "Companie Necunoscută";
    return {
      id: job._version_ ? `${job._version_}-${index}` : `job-${index}`,
      title: job.title || "Job Fără Titlu",
      company: company,
      logoBg: getLogoBg(company),
      location: Array.isArray(job.location)
        ? job.location.join(", ")
        : job.location || "Nespecificat",
      salary: Array.isArray(job.salary)
        ? job.salary.join(", ")
        : job.salary || null,
      date: job.date || null,
      status: job.status || "published",
      f_tag: job.f_tag || [],
      url: job.url || "",
      _root_: job._root_ || job.url || "",
    };
  });
}
