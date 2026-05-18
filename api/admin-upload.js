const GITHUB_API = 'https://api.github.com';
const BRANCH = 'main';

function getOwnerRepo() {
  const [owner, repo] = (process.env.GITHUB_REPO || '').split('/');
  return { owner, repo };
}

function verifyAuth(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Basic ')) return false;
  const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
  const colon = decoded.indexOf(':');
  if (colon === -1) return false;
  const user = decoded.slice(0, colon);
  const pass = decoded.slice(colon + 1);
  return user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS;
}

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
};

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  if (!verifyAuth(req)) return res.status(401).json({ ok: false, message: '인증 실패' });

  const { owner, repo } = getOwnerRepo();
  const { filename, content: fileContent, folder } = req.body || {};
  if (!filename || !fileContent || !folder) return res.status(400).json({ ok: false, message: '필수값 누락' });

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `assets/uploads/${folder}/${Date.now()}_${safeName}`;

  // 기존 파일 sha 확인 (덮어쓰기 시 필요)
  let sha = null;
  try {
    const check = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${BRANCH}`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (check.ok) { const d = await check.json(); sha = d.sha; }
  } catch (_) {}

  const body = { message: `admin: upload ${safeName}`, content: fileContent, branch: BRANCH };
  if (sha) body.sha = sha;

  const up = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!up.ok) {
    const err = await up.json().catch(() => ({}));
    return res.status(500).json({ ok: false, message: JSON.stringify(err) });
  }

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${BRANCH}/${path}`;
  return res.status(200).json({ ok: true, url: rawUrl, path });
};
