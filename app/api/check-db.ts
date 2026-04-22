// pages/api/check-db.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../DATABASE/drizzle';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await db.execute('SELECT 1'); // Drizzle raw query
    res.status(200).json({ message: 'DB OK', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'DB connection failed', error: err });
  }
}