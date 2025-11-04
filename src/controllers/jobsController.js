// backend/controllers/jobsController.js
import axios from "axios";

export async function getJobs(req, res) {
  try {
    const q = req.query.q || "software engineer";
    const limit = parseInt(req.query.limit || "10", 10);

    // ✅ Free public Remotive API
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}`;
    const response = await axios.get(url);

    // Extract jobs safely
    const jobs = (response.data.jobs || []).slice(0, limit).map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || "Remote",
      date: job.publication_date,
      url: job.url,
      category: job.category || "General",
    }));

    // ✅ Return plain array, not an object
    res.json(jobs);
  } catch (err) {
    console.error("❌ Error fetching jobs:", err.message);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
}
