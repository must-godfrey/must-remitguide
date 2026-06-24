import pg from "pg";
import { EMBED_DIM } from "./embed.js";

// pgvector-backed document store. Each row holds a natural-language `content`
// (what we embed) plus structured `metadata` (jsonb) used to rebuild rich
// tool results. Safe to import without a DB — isConfigured() gates all use.

let pool;

export function isConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

const toVectorLiteral = (vec) => `[${vec.join(",")}]`;

export async function ensureSchema() {
  const sql = getPool();
  await sql.query("CREATE EXTENSION IF NOT EXISTS vector");
  await sql.query(`
    CREATE TABLE IF NOT EXISTS kb_docs (
      id        TEXT PRIMARY KEY,
      content   TEXT NOT NULL,
      metadata  JSONB NOT NULL DEFAULT '{}'::jsonb,
      embedding vector(${EMBED_DIM})
    )`);
  await sql.query(
    `CREATE INDEX IF NOT EXISTS kb_docs_embedding_idx
       ON kb_docs USING hnsw (embedding vector_cosine_ops)`
  );
}

export async function upsertDoc({ id, content, metadata, embedding }) {
  const sql = getPool();
  await sql.query(
    `INSERT INTO kb_docs (id, content, metadata, embedding)
     VALUES ($1, $2, $3, $4::vector)
     ON CONFLICT (id) DO UPDATE
       SET content = EXCLUDED.content,
           metadata = EXCLUDED.metadata,
           embedding = EXCLUDED.embedding`,
    [id, content, metadata, toVectorLiteral(embedding)]
  );
}

// Cosine-distance nearest neighbours (smaller = closer). Optional metadata filter.
export async function search(queryEmbedding, { k = 4, type } = {}) {
  const sql = getPool();
  const params = [toVectorLiteral(queryEmbedding)];
  let where = "";
  if (type) {
    params.push(type);
    where = `WHERE metadata->>'type' = $${params.length}`;
  }
  params.push(k);
  const { rows } = await sql.query(
    `SELECT id, content, metadata, 1 - (embedding <=> $1::vector) AS score
       FROM kb_docs
       ${where}
       ORDER BY embedding <=> $1::vector
       LIMIT $${params.length}`,
    params
  );
  return rows;
}

export async function close() {
  if (pool) await pool.end();
}
