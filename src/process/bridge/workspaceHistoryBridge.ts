/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { workspaceHistory } from '@/common/ipcBridge';
import { getDatabase } from '../database';

/**
 * Initialize workspace history IPC bridge
 */
export function initWorkspaceHistoryBridge(): void {
  const db = getDatabase();

  workspaceHistory.getTime.provider(({ path }) => {
    const result = db.getWorkspaceTime(path);
    return Promise.resolve(result.data ?? 0);
  });

  workspaceHistory.updateTime.provider(({ path, timestamp }) => {
    const result = db.updateWorkspaceTime(path, timestamp);
    return Promise.resolve(result.success);
  });

  workspaceHistory.getRecent.provider(({ limit }) => {
    const result = db.getRecentWorkspaces(limit ?? 10);
    return Promise.resolve(result.data ?? []);
  });

  workspaceHistory.remove.provider(({ path }) => {
    const result = db.removeWorkspace(path);
    return Promise.resolve(result.success);
  });

  workspaceHistory.getAll.provider(() => {
    const result = db.getAllWorkspaces();
    return Promise.resolve(result.data ?? []);
  });

  workspaceHistory.removeMany.provider(({ paths }) => {
    const result = db.removeWorkspaces(paths);
    return Promise.resolve(result.data ?? 0);
  });

  workspaceHistory.trim.provider(({ maxEntries }) => {
    const result = db.trimWorkspaceHistory(maxEntries);
    return Promise.resolve(result.data ?? 0);
  });
}
