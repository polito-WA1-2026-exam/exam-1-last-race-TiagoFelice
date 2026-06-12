import { get } from '../sqlite.js';

function toPublicUser(row) {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
  };
}

function toAuthUser(row) {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    salt: row.salt,
    passwordHash: row.password_hash,
  };
}

export async function getUserByUsername(username) {
  const row = await get(
    `SELECT id, username, display_name, salt, password_hash
     FROM users
     WHERE username = ?`,
    [username],
  );

  return toAuthUser(row);
}

export async function getUserById(id) {
  const row = await get(
    `SELECT id, username, display_name
     FROM users
     WHERE id = ?`,
    [id],
  );

  return toPublicUser(row);
}
