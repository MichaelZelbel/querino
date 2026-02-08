/**
 * Parses a Skill Source URL and extracts structured data for storage.
 * 
 * Supported URL formats:
 * - https://github.com/org/repo
 * - https://github.com/org/repo/tree/main/skills/web-search
 * - https://github.com/org/repo/tree/v1.2.0/skills/web-search
 * - https://github.com/org/repo/commit/abc123
 * - https://clawhub.ai/skills/web-search
 */

export interface ParsedSkillSource {
  isValid: boolean;
  sourceType: 'github' | 'clawhub' | null;
  sourceRef: string | null;       // Normalized repo URL or ClawHub identifier
  sourcePath: string | null;      // Folder path (if present)
  sourceVersion: string | null;   // Branch, tag, or commit SHA
  error?: string;
}

/**
 * Parse a GitHub URL into its components
 */
function parseGitHubUrl(url: string): ParsedSkillSource {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname !== 'github.com' && urlObj.hostname !== 'www.github.com') {
      return { isValid: false, sourceType: null, sourceRef: null, sourcePath: null, sourceVersion: null };
    }

    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Need at least owner/repo
    if (pathParts.length < 2) {
      return {
        isValid: false,
        sourceType: 'github',
        sourceRef: null,
        sourcePath: null,
        sourceVersion: null,
        error: 'Invalid GitHub URL: needs owner/repo'
      };
    }

    const owner = pathParts[0];
    const repo = pathParts[1];
    const baseRepoUrl = `https://github.com/${owner}/${repo}`;

    // Simple repo URL: https://github.com/org/repo
    if (pathParts.length === 2) {
      return {
        isValid: true,
        sourceType: 'github',
        sourceRef: baseRepoUrl,
        sourcePath: null,
        sourceVersion: 'latest'
      };
    }

    const pathType = pathParts[2]; // 'tree', 'blob', or 'commit'

    // Commit URL: https://github.com/org/repo/commit/abc123
    if (pathType === 'commit' && pathParts.length >= 4) {
      const commitSha = pathParts[3];
      return {
        isValid: true,
        sourceType: 'github',
        sourceRef: baseRepoUrl,
        sourcePath: null,
        sourceVersion: commitSha
      };
    }

    // Tree/Blob URL: https://github.com/org/repo/tree/branch/path/to/folder
    if ((pathType === 'tree' || pathType === 'blob') && pathParts.length >= 4) {
      const version = pathParts[3]; // Branch, tag, or commit SHA
      const folderPath = pathParts.length > 4 ? pathParts.slice(4).join('/') : null;

      return {
        isValid: true,
        sourceType: 'github',
        sourceRef: baseRepoUrl,
        sourcePath: folderPath,
        sourceVersion: version
      };
    }

    // Fallback for other GitHub URL patterns
    return {
      isValid: true,
      sourceType: 'github',
      sourceRef: baseRepoUrl,
      sourcePath: null,
      sourceVersion: 'latest'
    };
  } catch {
    return {
      isValid: false,
      sourceType: null,
      sourceRef: null,
      sourcePath: null,
      sourceVersion: null,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Parse a ClawHub URL into its components
 */
function parseClawHubUrl(url: string): ParsedSkillSource {
  try {
    const urlObj = new URL(url);
    
    // Support clawhub.ai, clawhub.com, or similar
    if (!urlObj.hostname.includes('clawhub')) {
      return { isValid: false, sourceType: null, sourceRef: null, sourcePath: null, sourceVersion: null };
    }

    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Expected format: /skills/skill-name or /@author/skill-name
    if (pathParts.length < 2) {
      return {
        isValid: false,
        sourceType: 'clawhub',
        sourceRef: null,
        sourcePath: null,
        sourceVersion: null,
        error: 'Invalid ClawHub URL: needs skill identifier'
      };
    }

    // Extract skill identifier
    let skillId: string;
    if (pathParts[0] === 'skills') {
      skillId = pathParts.slice(1).join('/');
    } else if (pathParts[0].startsWith('@')) {
      skillId = pathParts.join('/');
    } else {
      skillId = pathParts.join('/');
    }

    // Check for version in URL (e.g., /skills/web-search/v1.0.0)
    const versionMatch = skillId.match(/^(.+)\/v?(\d+\.\d+\.\d+)$/);
    if (versionMatch) {
      return {
        isValid: true,
        sourceType: 'clawhub',
        sourceRef: versionMatch[1],
        sourcePath: null,
        sourceVersion: versionMatch[2]
      };
    }

    return {
      isValid: true,
      sourceType: 'clawhub',
      sourceRef: skillId,
      sourcePath: null,
      sourceVersion: 'latest'
    };
  } catch {
    return {
      isValid: false,
      sourceType: null,
      sourceRef: null,
      sourcePath: null,
      sourceVersion: null,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Main parser function - determines source type and delegates to specific parser
 */
export function parseSkillSourceUrl(url: string): ParsedSkillSource {
  const trimmedUrl = url.trim();
  
  if (!trimmedUrl) {
    return {
      isValid: false,
      sourceType: null,
      sourceRef: null,
      sourcePath: null,
      sourceVersion: null
    };
  }

  // Try to parse as URL
  let urlObj: URL;
  try {
    urlObj = new URL(trimmedUrl);
  } catch {
    return {
      isValid: false,
      sourceType: null,
      sourceRef: null,
      sourcePath: null,
      sourceVersion: null,
      error: 'Please enter a valid URL'
    };
  }

  // Check for GitHub
  if (urlObj.hostname === 'github.com' || urlObj.hostname === 'www.github.com') {
    return parseGitHubUrl(trimmedUrl);
  }

  // Check for ClawHub
  if (urlObj.hostname.includes('clawhub')) {
    return parseClawHubUrl(trimmedUrl);
  }

  return {
    isValid: false,
    sourceType: null,
    sourceRef: null,
    sourcePath: null,
    sourceVersion: null,
    error: 'URL must be from GitHub or ClawHub'
  };
}

/**
 * Validate if a URL is a valid skill source
 */
export function isValidSkillSourceUrl(url: string): boolean {
  return parseSkillSourceUrl(url).isValid;
}

/**
 * Get a user-friendly description of the parsed URL
 */
export function getSkillSourceDescription(parsed: ParsedSkillSource): string {
  if (!parsed.isValid || !parsed.sourceType) {
    return '';
  }

  if (parsed.sourceType === 'github') {
    let desc = parsed.sourceRef || 'GitHub repository';
    if (parsed.sourcePath) {
      desc += ` → ${parsed.sourcePath}`;
    }
    if (parsed.sourceVersion && parsed.sourceVersion !== 'latest') {
      desc += ` @ ${parsed.sourceVersion}`;
    }
    return desc;
  }

  if (parsed.sourceType === 'clawhub') {
    let desc = `ClawHub: ${parsed.sourceRef}`;
    if (parsed.sourceVersion && parsed.sourceVersion !== 'latest') {
      desc += ` @ ${parsed.sourceVersion}`;
    }
    return desc;
  }

  return '';
}
