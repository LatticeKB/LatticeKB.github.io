import type { CorpusFile } from './types';
import { createId } from '../../../shared/lib/ids';

const now = new Date().toISOString();

export const sampleCorpus: CorpusFile = {
  version: '1.1',
  owner: {
    name: 'LatticeKB Demo',
    team: 'IT Support',
  },
  entries: [
    {
      id: createId('entry'),
      title: 'VPN reconnect loop after password rotation',
      summary: 'Reset cached credentials, confirm SSO token expiry, and force a fresh tunnel profile download.',
      product: 'GlobalProtect',
      category: 'Access',
      tags: ['vpn', 'authentication', 'incident'],
      aliases: ['globalprotect reconnect loop', 'vpn password changed'],
      pinned: true,
      createdAt: now,
      updatedAt: now,
      body: {
        format: 'blocknote@0.47',
        blocks: [
          {
            id: createId('block'),
            type: 'heading',
            props: { level: 2 },
            content: 'Symptoms',
          },
          {
            id: createId('block'),
            type: 'bulletListItem',
            content: 'User enters new password and the VPN client reconnects every few seconds.',
          },
          {
            id: createId('block'),
            type: 'bulletListItem',
            content: 'Portal logs show valid MFA but stale cached credentials on the endpoint.',
          },
          {
            id: createId('block'),
            type: 'heading',
            props: { level: 2 },
            content: 'Resolution',
          },
          {
            id: createId('block'),
            type: 'numberedListItem',
            content: 'Disconnect the tunnel and clear saved OS credentials for the VPN profile.',
          },
          {
            id: createId('block'),
            type: 'numberedListItem',
            content: 'Remove the local GlobalProtect app settings cache if the client still loops.',
          },
          {
            id: createId('block'),
            type: 'numberedListItem',
            content: 'Reconnect and confirm the portal downloads a fresh profile before testing access to internal resources.',
          },
        ],
      },
    },
    {
      id: createId('entry'),
      title: 'Outlook shared mailbox opens but search returns no results',
      summary: 'Rebuild the local search index only after verifying shared mailbox caching is enabled for the affected profile.',
      product: 'Outlook',
      category: 'Messaging',
      tags: ['outlook', 'search', 'mailbox'],
      aliases: ['shared mailbox no search', 'outlook cache shared mailbox'],
      pinned: false,
      createdAt: now,
      updatedAt: now,
      body: {
        format: 'blocknote@0.47',
        blocks: [
          {
            id: createId('block'),
            type: 'paragraph',
            content: 'Confirm the mailbox is set to download shared folders, then rebuild Windows Search if indexing is stale.',
          },
          {
            id: createId('block'),
            type: 'paragraph',
            content: 'If the mailbox is accessed through online mode only, Outlook can open content without delivering local instant search results.',
          },
        ],
      },
    },
    {
      id: createId('entry'),
      title: 'macOS screenshot permissions block remote support capture',
      summary: 'Guide the user through Screen Recording approval and capture a before/after screenshot for the case notes.',
      product: 'macOS',
      category: 'Endpoint',
      tags: ['macos', 'privacy', 'screensharing'],
      aliases: ['screen recording denied', 'screen capture blocked'],
      pinned: false,
      createdAt: now,
      updatedAt: now,
      body: {
        format: 'blocknote@0.47',
        blocks: [
          {
            id: createId('block'),
            type: 'paragraph',
            content: 'Open System Settings → Privacy & Security → Screen Recording, enable the remote support tool, then fully quit and relaunch it.',
          },
          {
            id: createId('block'),
            type: 'paragraph',
            content: 'Paste the user-provided screenshot directly into this article to preserve what they saw before the permission reset.',
          },
        ],
      },
    },
  ],
};
