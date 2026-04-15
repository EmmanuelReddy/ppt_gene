const API_HOST = window.location.hostname || 'localhost';
const API_URL = `http://${API_HOST}:8000/api`;

export async function generateContent(
  prompt,
  file = null,
  options = {
    founderMode: 'fundraising',
    density: 'balanced',
    themePack: 'neon_vc',
    deckArchetype: 'auto',
    lockedLayouts: {},
  },
) {
  let body, headers;
  
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('founder_mode', options.founderMode || 'fundraising');
  formData.append('density', options.density || 'balanced');
  formData.append('theme_pack', options.themePack || 'random');
  formData.append('deck_archetype', options.deckArchetype || 'auto');
  formData.append('locked_layouts', JSON.stringify(options.lockedLayouts || {}));
  if (file) {
    formData.append('file', file);
  }
  body = formData;
  headers = {};

  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(`${API_URL}/generate-content`, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (response.ok) {
      return response.json();
    }

    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody.detail || 'Failed to generate pitch deck';
    lastError = new Error(detail);

    if (response.status === 429 && attempt < maxAttempts) {
      const delay = 1200 * attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    break;
  }

  throw lastError || new Error('Failed to generate pitch deck');
}

export async function regenerateSlide(payload) {
  const response = await fetch(`${API_URL}/regenerate-slide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || 'Failed to regenerate slide');
  }

  return response.json();
}

export async function downloadPresentation(title, images) {
  const response = await fetch(`${API_URL}/download-pptx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, images }),
  });
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || 'Failed to export presentation');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  
  const contentDisposition = response.headers.get('content-disposition');
  let filename = title.replace(/\s+/g, '_').toLowerCase() + '.pptx';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename=(.+)/);
    if (filenameMatch && filenameMatch.length === 2) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
