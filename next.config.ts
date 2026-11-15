import type { NextConfig } from "next";
import { execSync } from "child_process";
import packageJson from "./package.json";

let gitCommitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "";
if (!gitCommitSha) {
  try {
    gitCommitSha = execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    gitCommitSha = "";
  }
} else {
  gitCommitSha = gitCommitSha.substring(0, 7);
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_GIT_COMMIT_SHA: gitCommitSha,
  },
};

export default nextConfig;
