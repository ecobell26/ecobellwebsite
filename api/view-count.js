const GITHUB_API = 'https://api.github.com';
const BRANCH = 'main';
const DATA_PATH = 'data/views.json';

function getOwnerRepo() {
  const [owner, repo] = (process.env.GITHUB_REPO || '').split('/');
  return { owner, repo };
}

async function getFile(owner, repo) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${DATA_PATH}?ref=${BRANCH}&_=${Date.now()}`, {
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Cache-Control': 'no-cache' }
  });
  if (res.status === 404) return { content: {}, sha: null };
  if (!res.ok) throw new Error(`GitHub GET error: ${res.status}`);
  const data = await res.json();
  const text = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
  return { content: JSON.parse(text), sha: data.sha };
}

async function putFile(owner, repo, content, sha) {
  const body = { message: 'views: update', content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'), branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${DATA_PATH}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`GitHub PUT error: ${res.status}`);
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { owner, repo } = getOwnerRepo();
  const id = (req.method === 'GET' ? req.query.id : (req.body || {}).id) || '';
  if (!id) return res.status(400).json({ ok: false, message: 'id 필요' });

  try {
    const { content, sha } = await getFile(owner, repo);

    if (req.method === 'GET') {
      // 조회수 반환
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ok: true, id, count: content[id] || 0 });
    }

    if (req.method === 'POST') {
      // 조회수 +1
      content[id] = (content[id] || 0) + 1;
      await putFile(owner, repo, content, sha);
      return res.status(200).json({ ok: true, id, count: content[id] });
    }

    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};
