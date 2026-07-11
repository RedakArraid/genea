/**
 * Tests basiques pour l'API geneamap
 */

const { buildTreeInviteEmail, buildTreeAccessEmail } = require('../src/lib/treeInviteTemplates');

describe('geneamap Backend Tests', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have required dependencies', () => {
    const express = require('express');
    const prisma = require('../src/lib/prisma');
    
    expect(express).toBeDefined();
    expect(prisma).toBeDefined();
  });

  test('should load environment variables', () => {
    // Test que les variables d'environnement de base sont définies
    expect(process.env.NODE_ENV).toBeDefined();
  });

  test('buildTreeInviteEmail includes invite link', () => {
    const { subject, text } = buildTreeInviteEmail({
      treeName: 'Famille Traoré',
      inviterName: 'Kader',
      role: 'EDITOR',
      inviteUrl: 'https://geneamap.com/invite/abc',
      locale: 'fr',
    });
    expect(subject).toContain('Famille Traoré');
    expect(text).toContain('https://geneamap.com/invite/abc');
    expect(text).toContain('modifier');
  });

  test('buildTreeAccessEmail includes tree link', () => {
    const { subject, text } = buildTreeAccessEmail({
      treeName: 'Ma Famille',
      inviterName: 'Kader',
      role: 'VIEWER',
      treeUrl: 'https://geneamap.com/family-tree/xyz',
      locale: 'en',
    });
    expect(subject).toContain('Ma Famille');
    expect(text).toContain('https://geneamap.com/family-tree/xyz');
    expect(text).toContain('view');
  });
});
