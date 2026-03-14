/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge, workspaceHistory as workspaceHistoryBridge } from '@/common';

const MAX_WORKSPACE_ENTRIES = 100;
const RECENT_WORKSPACES_LIMIT = 10;

/**
 * Normalize a workspace path for consistent storage keys.
 * - Converts backslashes to forward slashes
 * - Removes trailing slashes
 * - Preserves Windows drive root (C:/) and UNC prefix (//)
 */
export function normalizePath(p: string): string {
  let normalized = p.replace(/\\/g, '/').replace(/\/+$/, '');
  if (/^[a-zA-Z]:$/.test(normalized)) {
    normalized += '/';
  }
  return normalized || '/';
}

/**
 * 获取 workspace 的最后更新时间
 */
export const getWorkspaceUpdateTime = async (workspace: string): Promise<number> => {
  try {
    const normalizedKey = normalizePath(workspace);
    return await workspaceHistoryBridge.getTime.invoke({ path: normalizedKey });
  } catch {
    return 0;
  }
};

/**
 * 更新 workspace 的最后更新时间
 * 在创建新会话时调用此函数
 */
export const updateWorkspaceTime = async (workspace: string): Promise<void> => {
  try {
    const nk = normalizePath(workspace);
    await workspaceHistoryBridge.updateTime.invoke({ path: nk });
  } catch (error) {
    console.error('[WorkspaceHistory] Failed to update workspace time:', error);
  }
};

/**
 * Get recently used workspaces sorted by time descending.
 */
export const getRecentWorkspaces = async (limit: number = RECENT_WORKSPACES_LIMIT): Promise<Array<{ path: string; time: number }>> => {
  try {
    return await workspaceHistoryBridge.getRecent.invoke({ limit });
  } catch {
    return [];
  }
};

/**
 * Validate workspace paths and clean up stale entries.
 * - Removes entries where the directory no longer exists (ENOENT)
 * - Retains entries with non-ENOENT errors (e.g. permissions, network offline)
 * - Evicts oldest entries beyond maxEntries limit
 */
export const cleanupWorkspaces = async (maxEntries: number = MAX_WORKSPACE_ENTRIES): Promise<void> => {
  try {
    const entries = await workspaceHistoryBridge.getAll.invoke();
    if (!entries || entries.length === 0) return;

    const pathsToRemove: string[] = [];

    await Promise.all(
      entries.map(async ({ path }) => {
        try {
          await ipcBridge.fs.getFileMetadata.invoke({ path });
          // Path is valid, keep it
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (/enoent|not found/i.test(message)) {
            // Directory no longer exists — mark for removal
            pathsToRemove.push(path);
          }
          // Other errors (permissions, network, etc.) — keep the entry
        }
      })
    );

    // Remove invalid entries
    if (pathsToRemove.length > 0) {
      await workspaceHistoryBridge.removeMany.invoke({ paths: pathsToRemove });
    }

    // Trim to maxEntries
    await workspaceHistoryBridge.trim.invoke({ maxEntries });
  } catch (error) {
    console.error('[WorkspaceHistory] Failed to cleanup workspaces:', error);
  }
};
