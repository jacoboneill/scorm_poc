import { Scorm2004API } from "scorm-again/scorm2004";

/**
 * SCORM 2004 API Wrapper
 * Provides a clean interface for SCO-LMS communication
 */
export class SCORM2004 {
  constructor() {
    this.api = null;
    this.initialized = false;
  }

  /**
   * Find and store reference to the SCORM API
   */
  findAPI() {
    if (this.api !== null) {
      return this.api;
    }

    let win = window;
    let findAttempts = 0;
    const maxAttempts = 7;

    // Search up the parent chain
    while (
      win.API_1484_11 == null &&
      win.parent != null &&
      win.parent !== win &&
      findAttempts < maxAttempts
    ) {
      findAttempts++;
      win = win.parent;
    }

    if (win.API_1484_11 != null) {
      this.api = win.API_1484_11;
      return this.api;
    }

    // Search opener and its parent chain
    if (win.opener != null) {
      win = win.opener;
      findAttempts = 0;
      while (
        win.API_1484_11 == null &&
        win.parent != null &&
        win.parent !== win &&
        findAttempts < maxAttempts
      ) {
        findAttempts++;
        win = win.parent;
      }
      if (win.API_1484_11 != null) {
        this.api = win.API_1484_11;
        return this.api;
      }
    }

    return null;
  }

  /**
   * Initialize the SCORM session
   */
  initialize() {
    this.findAPI();

    // Fallback to mock API for local development
    if (this.api === null) {
      console.warn("SCORM API not found - using mock API for development");
      this.api = new Scorm2004API({ autocommit: true, logLevel: 4 });
    }

    const result = this.api.Initialize("");
    this.initialized = result === "true";

    if (!this.initialized) {
      this.logError("Initialize");
    } else {
      // Set initial values
      this.setValue("cmi.completion_status", "incomplete");
      this.setValue("cmi.success_status", "unknown");
      this.setValue("cmi.exit", "suspend");
      this.commit();
    }

    return this.initialized;
  }

  /**
   * Terminate the SCORM session
   */
  terminate() {
    if (!this.initialized || this.api === null) {
      return false;
    }

    const result = this.api.Terminate("");
    this.initialized = false;
    return result === "true";
  }

  /**
   * Get a value from the CMI data model
   */
  getValue(element) {
    if (!this.initialized || this.api === null) {
      return "";
    }

    const value = this.api.GetValue(element);
    const errorCode = this.api.GetLastError();

    if (errorCode !== "0") {
      this.logError("GetValue", element);
    }

    return value;
  }

  /**
   * Set a value in the CMI data model
   */
  setValue(element, value) {
    if (!this.initialized || this.api === null) {
      return false;
    }

    const result = this.api.SetValue(element, String(value));

    if (result !== "true") {
      this.logError("SetValue", element);
    }

    return result === "true";
  }

  /**
   * Commit data to the LMS
   */
  commit() {
    if (!this.initialized || this.api === null) {
      return false;
    }

    const result = this.api.Commit("");

    if (result !== "true") {
      this.logError("Commit");
    }

    return result === "true";
  }

  /**
   * Log SCORM errors with diagnostic information
   */
  logError(method, element) {
    if (this.api === null) return;

    const errorCode = this.api.GetLastError();
    const errorString = this.api.GetErrorString(errorCode);
    const diagnostic = this.api.GetDiagnostic(errorCode);

    console.error(
      `SCORM ${method} error${element ? " for " + element : ""}: ` +
        `[${errorCode}] ${errorString} - ${diagnostic}`
    );
  }

  // ─────────────────────────────────────────────
  // Convenience methods
  // ─────────────────────────────────────────────

  /**
   * Set the learner's location (bookmark)
   */
  setLocation(location) {
    return this.setValue("cmi.location", location);
  }

  /**
   * Get the learner's location (bookmark)
   */
  getLocation() {
    return this.getValue("cmi.location");
  }

  /**
   * Complete the course with a score and terminate the session
   */
  complete(score, passingScore = 70) {
    this.setValue("cmi.score.scaled", score / 100);
    this.setValue("cmi.score.raw", score);
    this.setValue("cmi.score.min", 0);
    this.setValue("cmi.score.max", 100);
    this.setValue("cmi.completion_status", "completed");
    this.setValue("cmi.success_status", score >= passingScore ? "passed" : "failed");
    this.setValue("cmi.exit", "normal");
    this.commit();
    return this.terminate();
  }
}

export default SCORM2004;
