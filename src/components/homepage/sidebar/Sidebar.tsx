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

  function getColorForSha(sha: string | undefined) {
    const key = sha || "__unknown__";
    if (!colorMapRef.current[key]) {
      colorMapRef.current[key] = getRandomColorClass();
    }
    return colorMapRef.current[key];
  }

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-black/90 backdrop-blur-md border-l border-gray-800 flex flex-col">
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
                  const shortSha = sha ? String(sha).slice(0, 7) : "--";

                  return (
                    <div
                      key={sha || message + String(Math.random())}
                      className="bg-gray-900/50 rounded-lg p-3 border border-gray-800"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 ${getColorForSha(
                            sha
                          )} rounded-full mt-1.5`}
                        ></div>
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
                            commit: {shortSha}
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
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask about this file..."
            className="flex-1 bg-gray-900 text-white text-sm rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          Ask questions about commits, changes, or functionality
        </p>
      </div>
    </div>
  );
};
