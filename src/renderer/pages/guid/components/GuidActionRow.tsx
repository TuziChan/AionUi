/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import AgentModeSelector from '@/renderer/components/AgentModeSelector';
import { getAgentModes, supportsModeSwitch, type AgentModeOption } from '@/renderer/constants/agentModes';
import { useLayoutContext } from '@/renderer/context/LayoutContext';
import { getCleanFileNames } from '@/renderer/services/FileService';
import { iconColors } from '@/renderer/theme/colors';
import type { AcpBackend, AcpBackendConfig, AvailableAgent } from '../types';
import PresetAgentTag from './PresetAgentTag';
import { Button, Tooltip } from '@arco-design/web-react';
import { ArrowUp, FolderOpen, Shield, UploadOne } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../index.module.css';

type GuidActionRowProps = {
  // File handling
  files: string[];
  onFilesUploaded: (paths: string[]) => void;
  onSelectWorkspace: (dir: string) => void;

  // Workspace state
  dir: string;

  // Model selector node (rendered by parent)
  modelSelectorNode: React.ReactNode;

  // Agent mode
  selectedAgent: AcpBackend | 'custom';
  effectiveModeAgent?: string;
  selectedMode: string;
  onModeSelect: (mode: string) => void;

  // Preset agent tag
  isPresetAgent: boolean;
  selectedAgentInfo: AvailableAgent | undefined;
  customAgents: AcpBackendConfig[];
  localeKey: string;
  onClosePresetTag: () => void;

  // Send button
  loading: boolean;
  isButtonDisabled: boolean;
  onSend: () => void;
};

const GuidActionRow: React.FC<GuidActionRowProps> = ({ files, onFilesUploaded, onSelectWorkspace, dir, modelSelectorNode, selectedAgent, effectiveModeAgent, selectedMode, onModeSelect, isPresetAgent, selectedAgentInfo, customAgents, localeKey, onClosePresetTag, loading, isButtonDisabled, onSend }) => {
  const { t } = useTranslation();
  const layout = useLayoutContext();
  const isMobile = Boolean(layout?.isMobile);
  const modeBackend = effectiveModeAgent || selectedAgent;
  const modeOptions = getAgentModes(modeBackend);
  const currentModeOption = modeOptions.find((mode) => mode.value === selectedMode);

  const getModeDisplayLabel = (mode: AgentModeOption): string => t(`agentMode.${mode.value}`, { defaultValue: mode.label });

  const permissionLabel = currentModeOption ? (isMobile ? getModeDisplayLabel(currentModeOption) : `${t('agentMode.permission')} · ${getModeDisplayLabel(currentModeOption)}`) : t('agentMode.permission');

  const handleUploadFile = () => {
    ipcBridge.dialog.showOpen
      .invoke({ properties: ['openFile', 'multiSelections'] })
      .then((uploadedFiles) => {
        if (uploadedFiles && uploadedFiles.length > 0) {
          onFilesUploaded(uploadedFiles);
        }
      })
      .catch((error) => {
        console.error('Failed to open file dialog:', error);
      });
  };

  const handleSelectWorkspace = () => {
    ipcBridge.dialog.showOpen
      .invoke({ properties: ['openDirectory'] })
      .then((dirs) => {
        if (dirs && dirs[0]) {
          onSelectWorkspace(dirs[0]);
        }
      })
      .catch((error) => {
        console.error('Failed to open directory dialog:', error);
      });
  };

  return (
    <div className={styles.actionRow}>
      <div className={styles.actionTools}>
        <Tooltip content={t('conversation.welcome.uploadFile')} position='top' mini>
          <span className='flex items-center gap-4px cursor-pointer lh-[1]'>
            <Button type='text' shape='circle' icon={<UploadOne theme='outline' size='14' strokeWidth={2} fill={iconColors.primary} />} onClick={handleUploadFile} />
            {files.length > 0 && (
              <Tooltip className={'!max-w-max'} content={<span className='whitespace-break-spaces'>{getCleanFileNames(files).join('\n')}</span>}>
                <span className='text-t-primary'>File({files.length})</span>
              </Tooltip>
            )}
          </span>
        </Tooltip>

        <Tooltip content={t('conversation.welcome.specifyWorkspace')} position='top' mini>
          <Button type='text' shape='circle' className={dir ? styles.workspaceButtonActive : ''} icon={<FolderOpen theme={dir ? 'filled' : 'outline'} size='14' strokeWidth={2} fill={dir ? 'rgb(var(--primary-6))' : iconColors.primary} />} onClick={handleSelectWorkspace} />
        </Tooltip>

        {modelSelectorNode}

        {supportsModeSwitch(modeBackend) && <AgentModeSelector backend={modeBackend} compact initialMode={selectedMode} onModeSelect={onModeSelect} compactLabelOverride={permissionLabel} compactLeadingIcon={<Shield theme='outline' size='14' fill={iconColors.secondary} />} modeLabelFormatter={getModeDisplayLabel} />}

        {isPresetAgent && selectedAgentInfo && <PresetAgentTag agentInfo={selectedAgentInfo} customAgents={customAgents} localeKey={localeKey} onClose={onClosePresetTag} />}
      </div>
      <div className={styles.actionSubmit}>
        <Button
          shape='circle'
          type='primary'
          loading={loading}
          disabled={isButtonDisabled}
          className='send-button-custom'
          style={{
            backgroundColor: isButtonDisabled ? undefined : '#000000',
            borderColor: isButtonDisabled ? undefined : '#000000',
          }}
          icon={<ArrowUp theme='filled' size='14' fill='white' strokeWidth={5} />}
          onClick={onSend}
        />
      </div>
    </div>
  );
};

export default GuidActionRow;
