const { Pool } = require("pg")

jest.setTimeout(30000)

// admin/migration connection -- superuser, used only for seeding test data.
// Never used for the actual RLS-subject queries below (see appPool).
const pool = new Pool({
    host: "localhost",
    port: 5433,
    user: "demo",
    password: "demo",
    database: "rls_demo"
})

// the connection the "application" uses -- a restricted, non-superuser role, so RLS
// actually applies (a superuser connection would silently bypass every policy)
const appPool = new Pool({
    host: "localhost",
    port: 5433,
    user: "app_user",
    password: "app_user_pw",
    database: "rls_demo"
})

let businessA, businessB

beforeAll(async () => {
    // seed data using an unrestricted setup connection (no tenant context set --
    // simulates an admin/migration role that can see and write everything)
    const setup = await pool.connect()
    try {
        const bizA = await setup.query(
            "INSERT INTO businesses (name, slug) VALUES ('Business A', $1) RETURNING id",
            [`business-a-${Date.now()}`]
        )
        const bizB = await setup.query(
            "INSERT INTO businesses (name, slug) VALUES ('Business B', $1) RETURNING id",
            [`business-b-${Date.now()}`]
        )
        businessA = bizA.rows[0].id
        businessB = bizB.rows[0].id

        await setup.query("INSERT INTO bills (business_id, customer_name, total_paise) VALUES ($1, 'Customer A', 100000)", [businessA])
        await setup.query("INSERT INTO bills (business_id, customer_name, total_paise) VALUES ($1, 'Customer B', 200000)", [businessB])
    } finally {
        setup.release()
    }
})

afterAll(async () => {
    await pool.end()
    await appPool.end()
})

// Runs `fn` inside a transaction with app.current_business_id set for that connection's
// session (via set_config, not SET LOCAL, so the value can be safely parameterized rather
// than string-interpolated into SQL). Always rolled back, so no manual cleanup needed.
// Uses appPool (the restricted role) -- this is the whole point of the test.
async function asTenant(businessId, fn) {
    const client = await appPool.connect()
    try {
        await client.query("BEGIN")
        if (businessId) {
            await client.query("SELECT set_config('app.current_business_id', $1, true)", [businessId])
        }
        return await fn(client)
    } finally {
        await client.query("ROLLBACK")
        client.release()
    }
}

test("Business A's session sees only Business A's bill, with NO WHERE clause in the query", async () => {
    const result = await asTenant(businessA, (client) => client.query("SELECT * FROM bills"))
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].customer_name).toBe("Customer A")
})

test("Business B's session sees only Business B's bill, with NO WHERE clause in the query", async () => {
    const result = await asTenant(businessB, (client) => client.query("SELECT * FROM bills"))
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].customer_name).toBe("Customer B")
})

test("no tenant context set at all -> zero rows (fail-closed, not fail-open)", async () => {
    const result = await asTenant(null, (client) => client.query("SELECT * FROM bills"))
    expect(result.rows).toHaveLength(0)
})

test("Business A cannot INSERT a bill under Business B's business_id (WITH CHECK rejects it)", async () => {
    await expect(
        asTenant(businessA, (client) =>
            client.query(
                "INSERT INTO bills (business_id, customer_name, total_paise) VALUES ($1, $2, $3)",
                [businessB, "Sneaky Insert", 999]
            )
        )
    ).rejects.toThrow()
})

test("Business A's UPDATE against Business B's row affects zero rows, not an error (USING silently filters)", async () => {
    const result = await asTenant(businessA, (client) =>
        client.query("UPDATE bills SET total_paise = 1 WHERE business_id = $1", [businessB])
    )
    expect(result.rowCount).toBe(0)
})
