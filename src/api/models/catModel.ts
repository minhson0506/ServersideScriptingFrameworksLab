import {promisePool} from '../../database/db';
import CustomError from '../../classes/CustomError';
import {ResultSetHeader} from 'mysql2';
import {Cat, GetCat, PostCat, PutCat} from '../../interfaces/Cat';

const getAllCats = async (): Promise<Cat[]> => {
  const [rows] = await promisePool.execute<GetCat[]>(
    `
    SELECT cat_id, cat_name, weight, filename, birthdate, ST_X(coords) as lat, ST_Y(coords) as lng,
    JSON_OBJECT('user_id', sssf_user.user_id, 'user_name', sssf_user.user_name) AS owner 
	  FROM sssf_cat 
	  JOIN sssf_user 
    ON sssf_cat.owner = sssf_user.user_id
    `
  );
  if (rows.length === 0) {
    throw new CustomError('No cats found', 404);
  }
  const cats: Cat[] = rows.map((row) => ({
    ...row,
    owner: JSON.parse(row.owner?.toString() || '{}'),
  }));

  return cats;
};

// TODO: create getCat function to get single cat
const getCat = async (catId: string): Promise<Cat> => {
  const [rows] = await promisePool.execute<GetCat[]>(
    `
    SELECT cat_id, cat_name, weight, filename, birthdate, ST_X(coords) as lat, ST_Y(coords) as lng,
    JSON_OBJECT('user_id', sssf_user.user_id, 'user_name', sssf_user.user_name) AS owner
    FROM sssf_cat
    JOIN sssf_user
    ON sssf_cat.owner = sssf_user.user_id
    WHERE cat_id = ?
    `,
    [catId]
  );
  if (rows.length === 0) {
    throw new CustomError('No cats found', 404);
  }
  const cat: Cat = {
    ...rows[0],
    owner: JSON.parse(rows[0].owner?.toString() || '{}'),
  };
  return cat;
};

const addCat = async (data: PostCat): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `
    INSERT INTO sssf_cat (cat_name, weight, owner, filename, birthdate, coords) 
    VALUES (?, ?, ?, ?, ?, POINT(?, ?))
    `,
    [
      data.cat_name,
      data.weight,
      data.owner,
      data.filename,
      data.birthdate,
      data.lat,
      data.lng,
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('No cats added', 400);
  }
  return headers.insertId;
};

// TODO: create updateCat function to update single cat
// if role is admin, update any cat
// if role is user, update only cats owned by user
const updateCat = async (
  data: PutCat,
  catId: number,
  user_id: number,
  role: string
): Promise<boolean> => {
  if (!Object.keys(data).length) {
    throw new CustomError('No cat data provided', 400);
  }

  const [rows] = await promisePool.execute<GetCat[]>(
    `
    SELECT * 
    FROM sssf_cat 
    LEFT JOIN sssf_user 
    ON sssf_user.user_id = sssf_cat.owner 
    WHERE cat_id = ?
    `,
    [catId]
  );

  let rawSql = `
  UPDATE sssf_cat
  `;
  const values = [];

  for (const key in data) {
    rawSql += !values.length ? 'SET ' + key + ' = ?, ' : key + ' = ?, ';
    values.push(data[key as keyof PutCat]);
  }

  rawSql = rawSql.slice(0, rawSql.length - 2);
  rawSql += ' WHERE cat_id = ?';
  values.push(catId);

  if (role === 'admin' || user_id === rows[0].owner) {
    const [headers] = await promisePool.execute<ResultSetHeader>(
      rawSql,
      values
    );
    if (headers.affectedRows === 0) {
      throw new CustomError('No cats updated', 400);
    }
    return true;
  }

  throw new CustomError('Not authorized', 401);
};

const deleteCat = async (catId: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `
    DELETE FROM sssf_cat 
    WHERE cat_id = ?;
    `,
    [catId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('No cats deleted', 400);
  }
  return true;
};

export {getAllCats, getCat, addCat, updateCat, deleteCat};
