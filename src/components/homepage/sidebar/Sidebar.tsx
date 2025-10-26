import React, { useRef } from "react";
import type { Commit, InitializedNodeData } from "../types";
import getRandomColorClass from "./colors";

interface SidebarProps {
  setSelectedNodeId: (id: string | null) => void;
  selectedNodeId: string | null;
  nodesRef: React.RefObject<InitializedNodeData[]>;
  loading: boolean;
  commits: Commit[];
}

export const Sidebar = ({
  setSelectedNodeId,
  selectedNodeId,
  nodesRef,
  loading,
  commits,
}: SidebarProps) => {
  // memoize colors per commit sha so colors stay stable across re-renders
  const colorMapRef = useRef<Record<string, string>>({});
  const [selectedCommits, setSelectedCommits] = React.useState<string[]>([]);
  const [copiedMessage, setCopiedMessage] = React.useState<string | null>(null);

  function getColorForSha(sha: string | undefined) {
    const key = sha || "__unknown__";
    if (!colorMapRef.current[key]) {
      colorMapRef.current[key] = getRandomColorClass();
    }
    return colorMapRef.current[key];
  }

  function toggleCommitSelection(sha: string | undefined) {
    if (!sha) return;

    setSelectedCommits((prev) => {
      if (prev.includes(sha)) {
        return prev.filter((s) => s !== sha);
      }
      if (prev.length >= 2) {
        return [prev[1], sha];
      }
      return [...prev, sha];
    });
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessage(label);
      setTimeout(() => setCopiedMessage(null), 2000);
    });
  }

  function getCommitRange() {
    if (selectedCommits.length !== 2) return null;

    const indices = selectedCommits.map((sha) =>
      commits.findIndex((c) => c.sha === sha)
    );
    const [idx1, idx2] = indices.sort((a, b) => a - b);

    return {
      older: commits[idx2],
      newer: commits[idx1],
      inBetween: commits.slice(idx1, idx2 + 1),
    };
  }

  const commitRange = getCommitRange();
  const fileName =
    nodesRef.current.find((n) => n.id === selectedNodeId)?.name || "this file";

  return (
    <div className="absolute top-0 right-0 h-full w-[475px] bg-black/90 backdrop-blur-md border-l border-gray-800 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex-1">
          <h2 className="text-white font-semibold text-lg">
            {nodesRef.current.find((n) => n.id === selectedNodeId)?.name}
          </h2>
          <p className="text-gray-400 text-sm">
            {nodesRef.current.find((n) => n.id === selectedNodeId)?.editCount}{" "}
            edits
          </p>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">
              Commit History
            </h3>
            <div className="space-y-3">
              {(commits.length ?? 0) === 0 ? (
                <div className="text-gray-400 text-sm">No commits found.</div>
              ) : (
                commits.map((commit: Commit) => {
                  const sha: string | undefined =
                    commit.sha ||
                    (commit.commit as unknown as { sha?: string })?.sha;
                  const rawMessage = commit.commit?.message as
                    | string
                    | undefined;
                  const message: string =
                    (rawMessage && String(rawMessage).split("\n")[0]) ||
                    "(no message)";
                  const author: string =
                    (commit.commit?.author?.name as string | undefined) ||
                    (commit.author?.login as string | undefined) ||
                    "Unknown";
                  const date =
                    (commit.commit?.author?.date as string | undefined) ||
                    (commit.commit?.committer?.date as string | undefined);

                  const isSelected = sha && selectedCommits.includes(sha);

                  return (
                    <div
                      key={sha || message + String(Math.random())}
                      onClick={() => toggleCommitSelection(sha)}
                      className={`bg-gray-900/50 rounded-lg p-3 border cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-900/20"
                          : "border-gray-800 hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col pt-[6px] items-center gap-1">
                          <div
                            className={`w-2 h-2 ${getColorForSha(
                              sha
                            )} rounded-full`}
                          ></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {message}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {date
                              ? new Date(date).toLocaleString()
                              : "Unknown date"}{" "}
                            • {author}
                          </p>
                          <p className="text-gray-500 text-xs mt-2">
                            commit: {sha}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-800">
        {selectedCommits.length === 2 && commitRange ? (
          <div className="space-y-2">
            <div className="text-white text-sm font-semibold mb-3">
              Copy Preset Messages
            </div>

            <button
              onClick={() => {
                const older = commitRange.older;
                const newer = commitRange.newer;
                const olderSha = older.sha;
                const newerSha = newer.sha;
                const text = `Between commits ${olderSha} and ${newerSha}, something changed in ${fileName} and it no longer works. Can you help me identify what broke?`;
                copyToClipboard(text, "bug");
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Report Bug Between Commits
            </button>

            <button
              onClick={() => {
                const older = commitRange.older;
                const newer = commitRange.newer;
                const olderSha = older.sha;
                const newerSha = newer.sha;
                const commitList = commitRange.inBetween
                  .map((c, i) => {
                    const sha = c.sha;
                    const msg = String(c.commit?.message || "").split("\n")[0];
                    return `${i + 1}. ${sha}: ${msg}`;
                  })
                  .join("\n");
                const text = `Here's the commit history for ${fileName} from ${olderSha} to ${newerSha}. Can you explain how this file evolved?\n\n${commitList}`;
                copyToClipboard(text, "evolution");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Show File Evolution
            </button>

            <button
              onClick={() => {
                const commitList = commitRange.inBetween
                  .map((c: Commit) => {
                    const sha = c.sha;
                    const msg = String(c.commit?.message || "").split("\n")[0];
                    const author =
                      c.commit?.author?.name || c.author?.login || "Unknown";
                    const date =
                      c.commit?.author?.date || c.commit?.committer?.date;
                    return `${sha}\n${msg}\nBy ${author} on ${
                      date ? new Date(date).toLocaleString() : "Unknown date"
                    }`;
                  })
                  .join("\n\n");
                copyToClipboard(commitList, "raw");
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Commit Range (Raw)
            </button>

            {copiedMessage && (
              <div className="text-green-400 text-xs text-center py-2 bg-green-900/20 rounded">
                ✓ Copied to clipboard!
              </div>
            )}

            <button
              onClick={() => setSelectedCommits([])}
              className="w-full text-gray-400 hover:text-white px-4 py-1 text-xs"
            >
              Clear Selection
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-sm mb-2">
              {selectedCommits.length === 0
                ? "Select 2 commits to generate preset messages"
                : "Select 1 more commit"}
            </p>
            <div className="flex gap-2">
              <button className="bg-gray-700 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed text-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Copy commit context to use in Claude.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
