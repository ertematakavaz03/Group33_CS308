// Mock DB — tests run without a real PostgreSQL connection.
// Set mockDb.query return values per test using mockResolvedValueOnce.

const mockDb = {
    query: jest.fn(),
};

beforeEach(() => {
    mockDb.query.mockReset();
});

module.exports = mockDb;
