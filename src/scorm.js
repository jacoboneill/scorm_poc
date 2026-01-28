import { Scorm2004API } from "scorm-again/scorm2004";

function findAPI(win, attempts = 0) {
  if (attempts > 10) return null;
  if (win.API_1484_11) return win.API_1484_11;
  if (win.parent && win.parent !== win)
    return findAPI(win.parent, attempts + 1);
  if (win.opener) return findAPI(win.opener, attempts + 1);
  return null;
}

const api =
  findAPI(window) || new Scorm2004API({ autocommit: true, logLevel: 4 });

const scorm = {
  init() {
    const result = api.Initialize("");
    if (result === "true" || result === true) {
      api.SetValue("cmi.completion_status", "incomplete");
      api.SetValue("cmi.success_status", "unknown");
      api.SetValue("cmi.exit", "suspend");
      api.Commit("");
      return true;
    }
    return false;
  },

  setStatus(status) {
    api.SetValue("cmi.completion_status", status);
    api.Commit("");
  },

  setSuccessStatus(status) {
    api.SetValue("cmi.success_status", status);
    api.Commit("");
  },

  setScore(percentage) {
    api.SetValue("cmi.score.scaled", String(percentage / 100));
    api.SetValue("cmi.score.raw", String(percentage));
    api.SetValue("cmi.score.min", "0");
    api.SetValue("cmi.score.max", "100");
    api.Commit("");
  },

  setLocation(location) {
    api.SetValue("cmi.location", String(location));
    api.Commit("");
  },

  getLocation() {
    return api.GetValue("cmi.location") || "0";
  },

  complete(score, passingScore = 70) {
    api.SetValue("cmi.score.scaled", String(score / 100));
    api.SetValue("cmi.score.raw", String(score));
    api.SetValue("cmi.score.min", "0");
    api.SetValue("cmi.score.max", "100");
    api.SetValue("cmi.completion_status", "completed");
    api.SetValue("cmi.success_status", score >= passingScore ? "passed" : "failed");
    api.SetValue("cmi.exit", "normal");
    api.Commit("");
  },

  finish() {
    api.Terminate("");
  },
};

export default scorm;
