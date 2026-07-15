-- gen_random_uuid() is built into core Postgres since v13, no extension needed

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    customer_name TEXT NOT NULL,
    total_paise INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills FORCE ROW LEVEL SECURITY;

-- NULLIF(...,'') matters: for a custom (unregistered) GUC like this one, a pooled
-- connection that previously had it SET LOCAL and then rolled back can read back as an
-- empty string rather than a true NULL. ''::uuid is a hard cast ERROR, not "no match" --
-- so without this, "no tenant context" would crash the query instead of returning zero
-- rows. NULLIF folds '' back to NULL first, so the comparison fails closed as intended.
CREATE POLICY tenant_isolation ON bills
    FOR ALL
    USING (business_id = NULLIF(current_setting('app.current_business_id', true), '')::uuid);

-- The app connection must NOT be the superuser (POSTGRES_USER, "demo", is a superuser by
-- default in this image). Superusers bypass RLS unconditionally -- FORCE ROW LEVEL SECURITY
-- only overrides the *table owner* bypass, it cannot override the superuser bypass at all.
-- A real app should always connect as a restricted role like this one, never as the admin.
CREATE ROLE app_user LOGIN PASSWORD 'app_user_pw';
GRANT SELECT, INSERT, UPDATE, DELETE ON bills TO app_user;
GRANT SELECT ON businesses TO app_user;
