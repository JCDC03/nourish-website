import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Authenticate
    const password = req.headers.authorization?.replace('Bearer ', '');
    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // GET — fetch all submissions (newest first)
        if (req.method === 'GET') {
            const ids = await kv.zrange('submissions', 0, -1, { rev: true });

            if (!ids || ids.length === 0) {
                return res.status(200).json([]);
            }

            const submissions = await Promise.all(
                ids.map(async (id) => {
                    const data = await kv.get(`submission:${id}`);
                    if (!data) return null;
                    return typeof data === 'string' ? JSON.parse(data) : data;
                })
            );

            return res.status(200).json(submissions.filter(Boolean));
        }

        // POST — mark as read/unread
        if (req.method === 'POST') {
            const { id, read } = req.body;
            if (!id) {
                return res.status(400).json({ error: 'Missing submission ID' });
            }

            const data = await kv.get(`submission:${id}`);
            if (!data) {
                return res.status(404).json({ error: 'Submission not found' });
            }

            const submission = typeof data === 'string' ? JSON.parse(data) : data;
            submission.read = !!read;
            await kv.set(`submission:${id}`, JSON.stringify(submission));

            return res.status(200).json({ success: true });
        }

        // DELETE — remove a submission
        if (req.method === 'DELETE') {
            const { id } = req.body;
            if (!id) {
                return res.status(400).json({ error: 'Missing submission ID' });
            }

            await kv.del(`submission:${id}`);
            await kv.zrem('submissions', id);

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Submissions API error:', err);
        return res.status(500).json({ error: 'Something went wrong.' });
    }
}
