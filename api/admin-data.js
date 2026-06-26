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

function typeToPath(type) {
  const map = { notices: 'data/notices.json', press: 'data/press.json', archive: 'data/archive.json', faq: 'data/faq.json' };
  return map[type] || null;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function getFile(owner, repo, path) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${BRANCH}&_=${Date.now()}`, {
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Cache-Control': 'no-cache' }
  });
  if (res.status === 404) return { content: { items: [] }, sha: null };
  if (!res.ok) throw new Error(`GitHub GET error: ${res.status}`);
  const data = await res.json();
  const text = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
  return { content: JSON.parse(text), sha: data.sha };
}

async function putFile(owner, repo, path, content, sha, message) {
  const body = { message, content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'), branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub PUT error: ${res.status} — ${JSON.stringify(err)}`);
  }
  return res.json();
}

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!verifyAuth(req)) return res.status(401).json({ ok: false, message: '인증 실패' });

  const { owner, repo } = getOwnerRepo();
  const type = req.method === 'GET' ? req.query.type : (req.body || {}).type;
  const path = typeToPath(type);
  if (!path) return res.status(400).json({ ok: false, message: '잘못된 타입' });

  try {
    if (req.method === 'GET') {
      const { content } = await getFile(owner, repo, path);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ok: true, items: content.items || [] });
    }

    if (req.method === 'POST') {
      const { item } = req.body;
      const { content, sha } = await getFile(owner, repo, path);
      const newItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
      content.items = [newItem, ...(content.items || [])];
      await putFile(owner, repo, path, content, sha, `admin: add ${type}`);
      return res.status(200).json({ ok: true, item: newItem, items: content.items });
    }

    if (req.method === 'PUT') {
      const { item } = req.body;
      const { content, sha } = await getFile(owner, repo, path);
      const idx = (content.items || []).findIndex(i => i.id === item.id);
      if (idx === -1) return res.status(404).json({ ok: false, message: '항목 없음' });
      content.items[idx] = { ...content.items[idx], ...item };
      await putFile(owner, repo, path, content, sha, `admin: update ${type}`);
      return res.status(200).json({ ok: true, items: content.items });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { content, sha } = await getFile(owner, repo, path);
      content.items = (content.items || []).filter(i => i.id !== id);
      await putFile(owner, repo, path, content, sha, `admin: delete ${type}`);
      return res.status(200).json({ ok: true, items: content.items });
    }

    if (req.method === 'PATCH') {
      const { items } = req.body;
      const { content, sha } = await getFile(owner, repo, path);
      content.items = items;
      await putFile(owner, repo, path, content, sha, `admin: reorder ${type}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};
