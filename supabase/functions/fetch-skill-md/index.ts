const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed domains for fetching
const ALLOWED_DOMAINS = [
  'github.com',
  'raw.githubusercontent.com',
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Prevent SSRF attacks
    if (hostname === 'localhost' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        !url.protocol.startsWith('https')) {
      return false;
    }

    return ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sourceType, sourceRef, sourcePath, sourceVersion, originalUrl } = await req.json();

    console.log("Fetch request:", { sourceType, sourceRef, sourcePath, sourceVersion, originalUrl });

    let fetchUrl: string;
    let content: string = "";

    if (sourceType === 'clawhub') {
      // ClawHub doesn't expose raw markdown content via public URLs
      return new Response(
        JSON.stringify({ 
          error: 'ClawHub skills cannot be auto-fetched. Please visit the ClawHub page, copy the skill content, and paste it using "Write SKILL.md manually" mode.',
          isClawHubLimitation: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else if (sourceType === 'github') {
      // For GitHub, construct raw.githubusercontent.com URL
      if (!sourceRef) {
        return new Response(
          JSON.stringify({ error: 'Invalid GitHub repository URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract owner/repo from sourceRef
      const repoMatch = sourceRef.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!repoMatch) {
        return new Response(
          JSON.stringify({ error: 'Could not parse GitHub repository URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const [, owner, repo] = repoMatch;
      const branch = sourceVersion === 'latest' ? 'main' : (sourceVersion || 'main');
      const path = sourcePath ? `${sourcePath}/SKILL.md` : 'SKILL.md';

      // Try main branch first, then master
      const branchesToTry = branch === 'main' ? ['main', 'master'] : [branch];
      
      for (const tryBranch of branchesToTry) {
        fetchUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${tryBranch}/${path}`;
        
        if (!isAllowedUrl(fetchUrl)) {
          console.log(`URL not allowed: ${fetchUrl}`);
          continue;
        }
        
        console.log(`Trying GitHub URL: ${fetchUrl}`);
        
        try {
          const response = await fetch(fetchUrl, {
            headers: {
              'Accept': 'text/plain',
              'User-Agent': 'Querino/1.0',
            },
          });

          if (response.ok) {
            content = await response.text();
            console.log(`Successfully fetched from ${fetchUrl}`);
            break;
          } else {
            console.log(`Failed to fetch ${fetchUrl}: ${response.status}`);
          }
        } catch (e) {
          console.log(`Failed to fetch ${fetchUrl}: ${e}`);
        }
      }

      if (!content) {
        return new Response(
          JSON.stringify({ 
            error: `SKILL.md not found in repository. Tried: ${path} on branches: ${branchesToTry.join(', ')}` 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported source type. Use GitHub URLs for auto-fetch.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in fetch-skill-md:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Failed to fetch SKILL.md' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
