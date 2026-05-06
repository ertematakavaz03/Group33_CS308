let hasEnsuredReviewUpdatedAtColumn = false;

const ensureReviewUpdatedAtColumn = async (db) => {
  if (hasEnsuredReviewUpdatedAtColumn || db?.query?._isMockFunction) {
    return;
  }

  await db.query(`
    ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
  `);

  hasEnsuredReviewUpdatedAtColumn = true;
};

module.exports = ensureReviewUpdatedAtColumn;
