-- Security Hardening SQL Diff Script
-- This script contains all database changes made for security hardening and DSGVO compliance

-- ==============================================
-- PHASE 1: ROLES AND PERMISSIONS
-- ==============================================

-- Create specialized service roles
CREATE ROLE api_service_role NOLOGIN;
CREATE ROLE migration_service_role NOLOGIN;
CREATE ROLE admin_service_role NOLOGIN;
CREATE ROLE audit_service_role NOLOGIN;

-- Grant minimal necessary permissions to service roles
GRANT USAGE ON SCHEMA public TO api_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO api_service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO api_service_role;

GRANT USAGE ON SCHEMA public TO migration_service_role;
GRANT CREATE ON SCHEMA public TO migration_service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO migration_service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO migration_service_role;

GRANT USAGE ON SCHEMA public TO admin_service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin_service_role;

GRANT USAGE ON SCHEMA public TO audit_service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO audit_service_role;

-- Remove excessive permissions from public role
REVOKE ALL ON SCHEMA public FROM public;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;

-- Grant minimal necessary permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create audit logging table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
    user_id UUID,
    user_email TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT
);

-- Create consent tracking table for DSGVO compliance
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('marketing', 'analytics', 'necessary', 'functional')),
    granted BOOLEAN NOT NULL,
    consent_text TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    withdrawn_ip_address INET,
    withdrawn_user_agent TEXT
);

-- Create data retention policy table
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    column_name TEXT,
    retention_days INTEGER NOT NULL,
    anonymization_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default retention policies
INSERT INTO data_retention_policies (table_name, retention_days, anonymization_method) VALUES
('audit_logs', 2555, 'DELETE'), -- 7 years for audit logs
('consent_records', 2555, 'DELETE'), -- 7 years for consent records
('event_requests', 1095, 'ANONYMIZE'), -- 3 years, then anonymize
('events', 1095, 'ANONYMIZE'), -- 3 years, then anonymize
('uploaded_files', 365, 'DELETE'); -- 1 year for uploaded files

-- Enable RLS on new tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PHASE 2: ENCRYPTION
-- ==============================================

-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption/decryption functions
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key TEXT DEFAULT 'default_key_change_me')
RETURNS TEXT AS $$
BEGIN
    RETURN encode(encrypt(data::bytea, key, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT, key TEXT DEFAULT 'default_key_change_me')
RETURNS TEXT AS $$
BEGIN
    RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), key, 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add encrypted columns for sensitive data
ALTER TABLE profiles ADD COLUMN email_encrypted TEXT;
ALTER TABLE profiles ADD COLUMN full_name_encrypted TEXT;

ALTER TABLE event_requests ADD COLUMN requester_email_encrypted TEXT;
ALTER TABLE event_requests ADD COLUMN requester_name_encrypted TEXT;
ALTER TABLE event_requests ADD COLUMN requester_phone_encrypted TEXT;

ALTER TABLE events ADD COLUMN requester_email_encrypted TEXT;
ALTER TABLE events ADD COLUMN requester_name_encrypted TEXT;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    user_email TEXT;
BEGIN
    user_email := COALESCE(
        auth.email(),
        (current_setting('request.headers', true)::json ->> 'x-user-email')
    );
    
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;
    
    INSERT INTO audit_logs (
        table_name,
        operation,
        user_id,
        user_email,
        old_values,
        new_values,
        ip_address,
        user_agent,
        session_id
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        user_email,
        old_data,
        new_data,
        inet_client_addr(),
        current_setting('request.headers', true)::json ->> 'user-agent',
        current_setting('request.headers', true)::json ->> 'x-session-id'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
CREATE TRIGGER profiles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER event_requests_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON event_requests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER events_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER uploaded_files_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON uploaded_files
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ==============================================
-- PHASE 3: RLS POLICIES
-- ==============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_authenticated_full_access" ON profiles;
DROP POLICY IF EXISTS "Anyone can create initial event requests" ON event_requests;
DROP POLICY IF EXISTS "Users can insert their own event requests" ON event_requests;
DROP POLICY IF EXISTS "Users can update their pending requests" ON event_requests;
DROP POLICY IF EXISTS "Users can view their own event requests" ON event_requests;
DROP POLICY IF EXISTS "Users can view their own requests by email" ON event_requests;
DROP POLICY IF EXISTS "event_requests_anon_public_read" ON event_requests;
DROP POLICY IF EXISTS "event_requests_email_access" ON event_requests;
DROP POLICY IF EXISTS "event_requests_public_insert" ON event_requests;
DROP POLICY IF EXISTS "event_requests_public_read" ON event_requests;
DROP POLICY IF EXISTS "event_requests_user_access" ON event_requests;
DROP POLICY IF EXISTS "event_requests_admin_full_access" ON event_requests;
DROP POLICY IF EXISTS "events_anon_public_read" ON events;
DROP POLICY IF EXISTS "events_public_read" ON events;
DROP POLICY IF EXISTS "events_admin_full_access" ON events;
DROP POLICY IF EXISTS "Admins can delete any file" ON uploaded_files;
DROP POLICY IF EXISTS "Admins can view all files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can delete their own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can upload their own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can view their own files" ON uploaded_files;

-- Implement proper least-privilege RLS policies

-- Profiles policies
CREATE POLICY profiles_self_access ON profiles
    FOR ALL TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY profiles_admin_read ON profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Event requests policies
CREATE POLICY event_requests_authenticated_insert ON event_requests
    FOR INSERT TO authenticated
    WITH CHECK (requested_by = auth.uid());

CREATE POLICY event_requests_public_initial_insert ON event_requests
    FOR INSERT TO anon
    WITH CHECK (
        request_stage = 'initial' 
        AND requester_email IS NOT NULL
        AND requester_name IS NOT NULL
    );

CREATE POLICY event_requests_self_access ON event_requests
    FOR ALL TO authenticated
    USING (requested_by = auth.uid())
    WITH CHECK (requested_by = auth.uid());

CREATE POLICY event_requests_email_access ON event_requests
    FOR SELECT TO anon
    USING (
        requester_email = (current_setting('request.headers', true)::json ->> 'x-user-email')
    );

CREATE POLICY event_requests_public_read ON event_requests
    FOR SELECT TO anon
    USING (
        is_private = false 
        AND status = 'approved'
    );

CREATE POLICY event_requests_admin_full_access ON event_requests
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Events policies
CREATE POLICY events_public_read ON events
    FOR SELECT TO anon
    USING (is_private = false OR is_private IS NULL);

CREATE POLICY events_authenticated_read ON events
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY events_authenticated_insert ON events
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY events_self_update ON events
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY events_admin_full_access ON events
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Uploaded files policies
CREATE POLICY uploaded_files_self_access ON uploaded_files
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY uploaded_files_admin_access ON uploaded_files
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ==============================================
-- PHASE 4: DSGVO COMPLIANCE FUNCTIONS
-- ==============================================

-- Create helper functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_user_data(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = target_user_id OR is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DSGVO compliance functions
CREATE OR REPLACE FUNCTION get_user_data_export(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    IF NOT can_access_user_data(user_id_param) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    SELECT jsonb_build_object(
        'profile', (SELECT to_jsonb(p) FROM profiles p WHERE p.id = user_id_param),
        'event_requests', (SELECT jsonb_agg(to_jsonb(er)) FROM event_requests er WHERE er.requested_by = user_id_param),
        'events', (SELECT jsonb_agg(to_jsonb(e)) FROM events e WHERE e.created_by = user_id_param),
        'uploaded_files', (SELECT jsonb_agg(to_jsonb(uf)) FROM uploaded_files uf WHERE uf.user_id = user_id_param),
        'consent_records', (SELECT jsonb_agg(to_jsonb(cr)) FROM consent_records cr WHERE cr.user_id = user_id_param),
        'export_timestamp', NOW(),
        'exported_by', auth.uid()
    ) INTO result;
    
    INSERT INTO audit_logs (table_name, operation, user_id, new_values)
    VALUES ('data_export', 'SELECT', auth.uid(), jsonb_build_object('exported_user_id', user_id_param));
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_user_data(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT can_access_user_data(user_id_param) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    DELETE FROM uploaded_files WHERE user_id = user_id_param;
    DELETE FROM event_requests WHERE requested_by = user_id_param;
    DELETE FROM events WHERE created_by = user_id_param;
    DELETE FROM consent_records WHERE user_id = user_id_param;
    DELETE FROM profiles WHERE id = user_id_param;
    
    INSERT INTO audit_logs (table_name, operation, user_id, new_values)
    VALUES ('user_data_deletion', 'DELETE', auth.uid(), jsonb_build_object('deleted_user_id', user_id_param));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_data(
    user_id_param UUID,
    new_email TEXT DEFAULT NULL,
    new_full_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    IF NOT can_access_user_data(user_id_param) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    UPDATE profiles 
    SET 
        email = COALESCE(new_email, email),
        full_name = COALESCE(new_full_name, full_name),
        updated_at = NOW()
    WHERE id = user_id_param;
    
    INSERT INTO audit_logs (table_name, operation, user_id, new_values)
    VALUES ('user_data_rectification', 'UPDATE', auth.uid(), 
            jsonb_build_object('updated_user_id', user_id_param, 'new_email', new_email, 'new_full_name', new_full_name));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_consent(
    user_id_param UUID,
    consent_type_param TEXT,
    granted_param BOOLEAN,
    consent_text_param TEXT,
    expires_at_param TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    consent_id UUID;
BEGIN
    IF NOT can_access_user_data(user_id_param) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    INSERT INTO consent_records (
        user_id, 
        consent_type, 
        granted, 
        consent_text, 
        expires_at,
        ip_address,
        user_agent
    ) VALUES (
        user_id_param,
        consent_type_param,
        granted_param,
        consent_text_param,
        expires_at_param,
        inet_client_addr(),
        current_setting('request.headers', true)::json ->> 'user-agent'
    ) RETURNING id INTO consent_id;
    
    INSERT INTO audit_logs (table_name, operation, user_id, new_values)
    VALUES ('consent_records', 'INSERT', auth.uid(), 
            jsonb_build_object('consent_id', consent_id, 'consent_type', consent_type_param, 'granted', granted_param));
    
    RETURN consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION withdraw_consent(consent_id_param UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT can_access_user_data((SELECT user_id FROM consent_records WHERE id = consent_id_param)) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    UPDATE consent_records 
    SET 
        granted = false,
        withdrawn_at = NOW(),
        withdrawn_ip_address = inet_client_addr(),
        withdrawn_user_agent = current_setting('request.headers', true)::json ->> 'user-agent'
    WHERE id = consent_id_param;
    
    INSERT INTO audit_logs (table_name, operation, user_id, new_values)
    VALUES ('consent_records', 'UPDATE', auth.uid(), 
            jsonb_build_object('consent_id', consent_id_param, 'action', 'withdrawn'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- PHASE 5: VALIDATION AND MONITORING
-- ==============================================

-- Input validation functions
CREATE OR REPLACE FUNCTION validate_email(email_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
           AND length(email_input) <= 254
           AND email_input !~* '\.{2,}'
           AND email_input !~* '^\.|\.$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION validate_phone(phone_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN phone_input ~* '^(\+49|0)[1-9]\d{1,14}$'
           AND length(phone_input) <= 20;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION sanitize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN regexp_replace(
        regexp_replace(
            regexp_replace(input_text, '[<>''"]', '', 'g'),
            '[\x00-\x1F\x7F-\x9F]', '', 'g'
        ),
        '\s+', ' ', 'g'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION detect_sql_injection(input_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN input_text ~* '(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)'
           OR input_text ~* '[\'';]'
           OR input_text ~* '--'
           OR input_text ~* '/\*.*\*/';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION validate_file_upload(
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    max_size_bytes INTEGER DEFAULT 10485760
)
RETURNS BOOLEAN AS $$
DECLARE
    allowed_extensions TEXT[] := ARRAY['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'];
    file_extension TEXT;
BEGIN
    IF file_size > max_size_bytes THEN
        RETURN FALSE;
    END IF;
    
    file_extension := lower(split_part(file_name, '.', array_length(string_to_array(file_name, '.'), 1)));
    
    IF file_extension = ANY(allowed_extensions) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Rate limiting table
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_lookup 
ON rate_limits (identifier, endpoint, window_start);

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
    identifier_param TEXT,
    endpoint_param TEXT,
    max_requests INTEGER DEFAULT 100,
    window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start_time TIMESTAMPTZ;
BEGIN
    window_start_time := NOW() - (window_minutes || ' minutes')::INTERVAL;
    
    SELECT COALESCE(SUM(request_count), 0)
    INTO current_count
    FROM rate_limits
    WHERE identifier = identifier_param
      AND endpoint = endpoint_param
      AND window_start >= window_start_time;
    
    IF current_count >= max_requests THEN
        RETURN FALSE;
    END IF;
    
    INSERT INTO rate_limits (identifier, endpoint, request_count)
    VALUES (identifier_param, endpoint_param, 1)
    ON CONFLICT (identifier, endpoint, window_start)
    DO UPDATE SET 
        request_count = rate_limits.request_count + 1,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security monitoring functions
CREATE OR REPLACE FUNCTION log_suspicious_activity(
    activity_type TEXT,
    description TEXT,
    severity TEXT DEFAULT 'low',
    user_id_param UUID DEFAULT NULL,
    ip_address_param INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        table_name,
        operation,
        user_id,
        new_values,
        ip_address
    ) VALUES (
        'suspicious_activity',
        'INSERT',
        COALESCE(user_id_param, auth.uid()),
        jsonb_build_object(
            'activity_type', activity_type,
            'description', description,
            'severity', severity,
            'timestamp', NOW()
        ),
        COALESCE(ip_address_param, inet_client_addr())
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Monitoring views
CREATE OR REPLACE VIEW security_monitoring AS
SELECT 
    al.id,
    al.table_name,
    al.operation,
    al.user_id,
    al.user_email,
    al.ip_address,
    al.created_at,
    al.new_values->>'breach_type' as breach_type,
    al.new_values->>'severity' as severity
FROM audit_logs al
WHERE al.table_name IN ('security_breach', 'user_data_deletion', 'data_export')
   OR al.operation = 'DELETE'
   OR (al.new_values ? 'breach_type')
ORDER BY al.created_at DESC;

CREATE OR REPLACE VIEW security_alerts AS
SELECT 
    al.id,
    al.table_name,
    al.operation,
    al.user_id,
    al.user_email,
    al.ip_address,
    al.created_at,
    al.new_values->>'activity_type' as activity_type,
    al.new_values->>'severity' as severity,
    al.new_values->>'description' as description
FROM audit_logs al
WHERE al.table_name IN ('suspicious_activity', 'security_breach')
   OR (al.new_values ? 'severity' AND al.new_values->>'severity' IN ('high', 'critical'))
ORDER BY al.created_at DESC;

CREATE OR REPLACE VIEW privacy_compliance AS
SELECT 
    'consent_records' as data_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN granted = true THEN 1 END) as granted_consents,
    COUNT(CASE WHEN granted = false THEN 1 END) as withdrawn_consents,
    COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_consents
FROM consent_records
UNION ALL
SELECT 
    'data_exports' as data_type,
    COUNT(*) as total_records,
    0 as granted_consents,
    0 as withdrawn_consents,
    0 as expired_consents
FROM audit_logs 
WHERE table_name = 'data_export'
UNION ALL
SELECT 
    'data_deletions' as data_type,
    COUNT(*) as total_records,
    0 as granted_consents,
    0 as withdrawn_consents,
    0 as expired_consents
FROM audit_logs 
WHERE table_name = 'user_data_deletion';

-- Enable RLS on rate_limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY rate_limits_admin_only ON rate_limits
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Grant permissions
GRANT SELECT ON security_monitoring TO admin_service_role;
GRANT SELECT ON security_alerts TO admin_service_role;
GRANT SELECT ON privacy_compliance TO admin_service_role;
GRANT EXECUTE ON FUNCTION get_user_data_export(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_data(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_consent(UUID, TEXT, BOOLEAN, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION withdraw_consent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_suspicious_activity(TEXT, TEXT, TEXT, UUID, INET) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_email(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_phone(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sanitize_text(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION detect_sql_injection(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_file_upload(TEXT, INTEGER, TEXT, INTEGER) TO anon, authenticated;
