/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IDirOrFile } from '@/common/ipcBridge';
import { iconColors } from '@/renderer/theme/colors';
import { getLastDirectoryName } from '@/renderer/utils/workspace';
import { Empty, Tooltip, Tree } from '@arco-design/web-react';
import { Down, FolderOpen, Refresh } from '@icon-park/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type GuidWorkspacePreviewProps = {
  dir: string;
};

const PLACEHOLDER_CONVERSATION_ID = '__guid_preview__';

const GuidWorkspacePreview: React.FC<GuidWorkspacePreviewProps> = ({ dir }) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<IDirOrFile[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const loadSeqRef = useRef(0);

  const loadWorkspace = useCallback(
    (path: string) => {
      const seq = ++loadSeqRef.current;
      setLoading(true);
      ipcBridge.conversation.getWorkspace
        .invoke({ conversation_id: PLACEHOLDER_CONVERSATION_ID, workspace: path, path, search: '' })
        .then((res) => {
          if (seq !== loadSeqRef.current) return;
          setFiles(res);
          // Expand first level
          const keys: string[] = [];
          if (res[0]?.children) {
            for (const child of res[0].children) {
              if (!child.isFile && child.relativePath) {
                keys.push(child.relativePath);
              }
            }
          }
          // APPEND_MARKER
