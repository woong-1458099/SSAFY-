--
-- PostgreSQL database dump
--

\restrict rIjsSiU2EIomVnQgcPggcAAfPwqd8a5eQvBTY5mr3StBtWmPKcJGNqV3TO2SMBg

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_event_entity; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.admin_event_entity (
    id character varying(36) NOT NULL,
    admin_event_time bigint,
    realm_id character varying(255),
    operation_type character varying(255),
    auth_realm_id character varying(255),
    auth_client_id character varying(255),
    auth_user_id character varying(255),
    ip_address character varying(255),
    resource_path character varying(2550),
    representation text,
    error character varying(255),
    resource_type character varying(64),
    details_json text
);


ALTER TABLE public.admin_event_entity OWNER TO stg_app;

--
-- Name: asset_bundle_files; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.asset_bundle_files (
    id uuid NOT NULL,
    asset_bundle_id uuid NOT NULL,
    path character varying(500) NOT NULL,
    url character varying(1000) NOT NULL,
    checksum character varying(255),
    size_bytes bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.asset_bundle_files OWNER TO stg_app;

--
-- Name: associated_policy; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.associated_policy (
    policy_id character varying(36) NOT NULL,
    associated_policy_id character varying(36) NOT NULL
);


ALTER TABLE public.associated_policy OWNER TO stg_app;

--
-- Name: authentication_execution; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.authentication_execution (
    id character varying(36) NOT NULL,
    alias character varying(255),
    authenticator character varying(36),
    realm_id character varying(36),
    flow_id character varying(36),
    requirement integer,
    priority integer,
    authenticator_flow boolean DEFAULT false NOT NULL,
    auth_flow_id character varying(36),
    auth_config character varying(36)
);


ALTER TABLE public.authentication_execution OWNER TO stg_app;

--
-- Name: authentication_flow; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.authentication_flow (
    id character varying(36) NOT NULL,
    alias character varying(255),
    description character varying(255),
    realm_id character varying(36),
    provider_id character varying(36) DEFAULT 'basic-flow'::character varying NOT NULL,
    top_level boolean DEFAULT false NOT NULL,
    built_in boolean DEFAULT false NOT NULL
);


ALTER TABLE public.authentication_flow OWNER TO stg_app;

--
-- Name: authenticator_config; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.authenticator_config (
    id character varying(36) NOT NULL,
    alias character varying(255),
    realm_id character varying(36)
);


ALTER TABLE public.authenticator_config OWNER TO stg_app;

--
-- Name: authenticator_config_entry; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.authenticator_config_entry (
    authenticator_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.authenticator_config_entry OWNER TO stg_app;

--
-- Name: broker_link; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.broker_link (
    identity_provider character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL,
    broker_user_id character varying(255),
    broker_username character varying(255),
    token text,
    user_id character varying(255) NOT NULL
);


ALTER TABLE public.broker_link OWNER TO stg_app;

--
-- Name: challenges; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.challenges (
    id uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    target_progress integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.challenges OWNER TO stg_app;

--
-- Name: client; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.client (
    id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    full_scope_allowed boolean DEFAULT false NOT NULL,
    client_id character varying(255),
    not_before integer,
    public_client boolean DEFAULT false NOT NULL,
    secret character varying(255),
    base_url character varying(255),
    bearer_only boolean DEFAULT false NOT NULL,
    management_url character varying(255),
    surrogate_auth_required boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    protocol character varying(255),
    node_rereg_timeout integer DEFAULT 0,
    frontchannel_logout boolean DEFAULT false NOT NULL,
    consent_required boolean DEFAULT false NOT NULL,
    name character varying(255),
    service_accounts_enabled boolean DEFAULT false NOT NULL,
    client_authenticator_type character varying(255),
    root_url character varying(255),
    description character varying(255),
    registration_token character varying(255),
    standard_flow_enabled boolean DEFAULT true NOT NULL,
    implicit_flow_enabled boolean DEFAULT false NOT NULL,
    direct_access_grants_enabled boolean DEFAULT false NOT NULL,
    always_display_in_console boolean DEFAULT false NOT NULL
);


ALTER TABLE public.client OWNER TO stg_app;

--
-- Name: client_attributes; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.client_attributes (
    client_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.client_attributes OWNER TO stg_app;

--
-- Name: client_auth_flow_bindings; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.client_auth_flow_bindings (
    client_id character varying(36) NOT NULL,
    flow_id character varying(36),
    binding_name character varying(255) NOT NULL
);


ALTER TABLE public.client_auth_flow_bindings OWNER TO stg_app;

--
-- Name: client_initial_access; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.client_initial_access (
    id character varying(36) NOT NULL,
    realm_id character varying(36) NOT NULL,
    "timestamp" integer,
    expiration integer,
    count integer,
    remaining_count integer
);


ALTER TABLE public.client_initial_access OWNER TO stg_app;

--
-- Name: client_node_registrations; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.client_node_registrations (
    client_id character varying(36) NOT NULL,
    value integer,
    name character varying(255) NOT NULL
);


ALTER TABLE public.client_node_registrations OWNER TO stg_app;

--
-- Name: client_scope; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.client_scope (
    id character varying(36) NOT NULL,
    name character varying(255),
    realm_id character varying(36),
    description character varying(255),
    protocol character varying(255)
);


ALTER TABLE public.client_scope OWNER TO stg_app;

--
-- Name: client_scope_attributes; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.client_scope_attributes (
    scope_id character varying(36) NOT NULL,
    value character varying(2048),
    name character varying(255) NOT NULL
);


ALTER TABLE public.client_scope_attributes OWNER TO stg_app;

--
-- Name: client_scope_client; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.client_scope_client (
    client_id character varying(255) NOT NULL,
    scope_id character varying(255) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE public.client_scope_client OWNER TO stg_app;

--
-- Name: client_scope_role_mapping; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.client_scope_role_mapping (
    scope_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE public.client_scope_role_mapping OWNER TO stg_app;

--
-- Name: component; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.component (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_id character varying(36),
    provider_id character varying(36),
    provider_type character varying(255),
    realm_id character varying(36),
    sub_type character varying(255)
);


ALTER TABLE public.component OWNER TO stg_app;

--
-- Name: component_config; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.component_config (
    id character varying(36) NOT NULL,
    component_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.component_config OWNER TO stg_app;

--
-- Name: composite_role; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.composite_role (
    composite character varying(36) NOT NULL,
    child_role character varying(36) NOT NULL
);


ALTER TABLE public.composite_role OWNER TO stg_app;

--
-- Name: credential; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    user_id character varying(36),
    created_date bigint,
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE public.credential OWNER TO stg_app;

--
-- Name: databasechangelog; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.databasechangelog (
    id character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    dateexecuted timestamp without time zone NOT NULL,
    orderexecuted integer NOT NULL,
    exectype character varying(10) NOT NULL,
    md5sum character varying(35),
    description character varying(255),
    comments character varying(255),
    tag character varying(255),
    liquibase character varying(20),
    contexts character varying(255),
    labels character varying(255),
    deployment_id character varying(10)
);


ALTER TABLE public.databasechangelog OWNER TO stg_app;

--
-- Name: databasechangeloglock; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.databasechangeloglock (
    id integer NOT NULL,
    locked boolean NOT NULL,
    lockgranted timestamp without time zone,
    lockedby character varying(255)
);


ALTER TABLE public.databasechangeloglock OWNER TO stg_app;

--
-- Name: default_client_scope; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.default_client_scope (
    realm_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE public.default_client_scope OWNER TO stg_app;

--
-- Name: event_entity; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.event_entity (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    details_json character varying(2550),
    error character varying(255),
    ip_address character varying(255),
    realm_id character varying(255),
    session_id character varying(255),
    event_time bigint,
    type character varying(255),
    user_id character varying(255),
    details_json_long_value text
);


ALTER TABLE public.event_entity OWNER TO stg_app;

--
-- Name: fed_user_attribute; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.fed_user_attribute (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    value character varying(2024),
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


ALTER TABLE public.fed_user_attribute OWNER TO stg_app;

--
-- Name: fed_user_consent; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.fed_user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE public.fed_user_consent OWNER TO stg_app;

--
-- Name: fed_user_consent_cl_scope; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.fed_user_consent_cl_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.fed_user_consent_cl_scope OWNER TO stg_app;

--
-- Name: fed_user_credential; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.fed_user_credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    created_date bigint,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE public.fed_user_credential OWNER TO stg_app;

--
-- Name: fed_user_group_membership; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.fed_user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_group_membership OWNER TO stg_app;

--
-- Name: fed_user_required_action; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.fed_user_required_action (
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_required_action OWNER TO stg_app;

--
-- Name: fed_user_role_mapping; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.fed_user_role_mapping (
    role_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_role_mapping OWNER TO stg_app;

--
-- Name: federated_identity; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.federated_identity (
    identity_provider character varying(255) NOT NULL,
    realm_id character varying(36),
    federated_user_id character varying(255),
    federated_username character varying(255),
    token text,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.federated_identity OWNER TO stg_app;

--
-- Name: federated_user; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.federated_user (
    id character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.federated_user OWNER TO stg_app;

--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO stg_app;

--
-- Name: group_attribute; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.group_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.group_attribute OWNER TO stg_app;

--
-- Name: group_role_mapping; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.group_role_mapping (
    role_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.group_role_mapping OWNER TO stg_app;

--
-- Name: identity_provider; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.identity_provider (
    internal_id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    provider_alias character varying(255),
    provider_id character varying(255),
    store_token boolean DEFAULT false NOT NULL,
    authenticate_by_default boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    add_token_role boolean DEFAULT true NOT NULL,
    trust_email boolean DEFAULT false NOT NULL,
    first_broker_login_flow_id character varying(36),
    post_broker_login_flow_id character varying(36),
    provider_display_name character varying(255),
    link_only boolean DEFAULT false NOT NULL,
    organization_id character varying(255),
    hide_on_login boolean DEFAULT false
);


ALTER TABLE public.identity_provider OWNER TO stg_app;

--
-- Name: identity_provider_config; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.identity_provider_config (
    identity_provider_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.identity_provider_config OWNER TO stg_app;

--
-- Name: identity_provider_mapper; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.identity_provider_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    idp_alias character varying(255) NOT NULL,
    idp_mapper_name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.identity_provider_mapper OWNER TO stg_app;

--
-- Name: idp_mapper_config; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.idp_mapper_config (
    idp_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.idp_mapper_config OWNER TO stg_app;

--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.inventory_items (
    id uuid NOT NULL,
    save_file_id uuid NOT NULL,
    item_code character varying(100) NOT NULL,
    item_name character varying(255) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    metadata text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inventory_items OWNER TO stg_app;

--
-- Name: jgroups_ping; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.jgroups_ping (
    address character varying(200) NOT NULL,
    name character varying(200),
    cluster_name character varying(200) NOT NULL,
    ip character varying(200) NOT NULL,
    coord boolean
);


ALTER TABLE public.jgroups_ping OWNER TO stg_app;

--
-- Name: keycloak_group; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.keycloak_group (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_group character varying(36) NOT NULL,
    realm_id character varying(36),
    type integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.keycloak_group OWNER TO stg_app;

--
-- Name: keycloak_role; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.keycloak_role (
    id character varying(36) NOT NULL,
    client_realm_constraint character varying(255),
    client_role boolean DEFAULT false NOT NULL,
    description character varying(255),
    name character varying(255),
    realm_id character varying(255),
    client character varying(36),
    realm character varying(36)
);


ALTER TABLE public.keycloak_role OWNER TO stg_app;

--
-- Name: migration_model; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.migration_model (
    id character varying(36) NOT NULL,
    version character varying(36),
    update_time bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.migration_model OWNER TO stg_app;

--
-- Name: offline_client_session; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.offline_client_session (
    user_session_id character varying(36) NOT NULL,
    client_id character varying(255) NOT NULL,
    offline_flag character varying(4) NOT NULL,
    "timestamp" integer,
    data text,
    client_storage_provider character varying(36) DEFAULT 'local'::character varying NOT NULL,
    external_client_id character varying(255) DEFAULT 'local'::character varying NOT NULL,
    version integer DEFAULT 0
);


ALTER TABLE public.offline_client_session OWNER TO stg_app;

--
-- Name: offline_user_session; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.offline_user_session (
    user_session_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    created_on integer NOT NULL,
    offline_flag character varying(4) NOT NULL,
    data text,
    last_session_refresh integer DEFAULT 0 NOT NULL,
    broker_session_id character varying(1024),
    version integer DEFAULT 0
);


ALTER TABLE public.offline_user_session OWNER TO stg_app;

--
-- Name: org; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.org (
    id character varying(255) NOT NULL,
    enabled boolean NOT NULL,
    realm_id character varying(255) NOT NULL,
    group_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(4000),
    alias character varying(255) NOT NULL,
    redirect_url character varying(2048)
);


ALTER TABLE public.org OWNER TO stg_app;

--
-- Name: org_domain; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.org_domain (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    verified boolean NOT NULL,
    org_id character varying(255) NOT NULL
);


ALTER TABLE public.org_domain OWNER TO stg_app;

--
-- Name: policy_config; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.policy_config (
    policy_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.policy_config OWNER TO stg_app;

--
-- Name: protocol_mapper; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.protocol_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    protocol character varying(255) NOT NULL,
    protocol_mapper_name character varying(255) NOT NULL,
    client_id character varying(36),
    client_scope_id character varying(36)
);


ALTER TABLE public.protocol_mapper OWNER TO stg_app;

--
-- Name: protocol_mapper_config; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.protocol_mapper_config (
    protocol_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.protocol_mapper_config OWNER TO stg_app;

--
-- Name: realm; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.realm (
    id character varying(36) NOT NULL,
    access_code_lifespan integer,
    user_action_lifespan integer,
    access_token_lifespan integer,
    account_theme character varying(255),
    admin_theme character varying(255),
    email_theme character varying(255),
    enabled boolean DEFAULT false NOT NULL,
    events_enabled boolean DEFAULT false NOT NULL,
    events_expiration bigint,
    login_theme character varying(255),
    name character varying(255),
    not_before integer,
    password_policy character varying(2550),
    registration_allowed boolean DEFAULT false NOT NULL,
    remember_me boolean DEFAULT false NOT NULL,
    reset_password_allowed boolean DEFAULT false NOT NULL,
    social boolean DEFAULT false NOT NULL,
    ssl_required character varying(255),
    sso_idle_timeout integer,
    sso_max_lifespan integer,
    update_profile_on_soc_login boolean DEFAULT false NOT NULL,
    verify_email boolean DEFAULT false NOT NULL,
    master_admin_client character varying(36),
    login_lifespan integer,
    internationalization_enabled boolean DEFAULT false NOT NULL,
    default_locale character varying(255),
    reg_email_as_username boolean DEFAULT false NOT NULL,
    admin_events_enabled boolean DEFAULT false NOT NULL,
    admin_events_details_enabled boolean DEFAULT false NOT NULL,
    edit_username_allowed boolean DEFAULT false NOT NULL,
    otp_policy_counter integer DEFAULT 0,
    otp_policy_window integer DEFAULT 1,
    otp_policy_period integer DEFAULT 30,
    otp_policy_digits integer DEFAULT 6,
    otp_policy_alg character varying(36) DEFAULT 'HmacSHA1'::character varying,
    otp_policy_type character varying(36) DEFAULT 'totp'::character varying,
    browser_flow character varying(36),
    registration_flow character varying(36),
    direct_grant_flow character varying(36),
    reset_credentials_flow character varying(36),
    client_auth_flow character varying(36),
    offline_session_idle_timeout integer DEFAULT 0,
    revoke_refresh_token boolean DEFAULT false NOT NULL,
    access_token_life_implicit integer DEFAULT 0,
    login_with_email_allowed boolean DEFAULT true NOT NULL,
    duplicate_emails_allowed boolean DEFAULT false NOT NULL,
    docker_auth_flow character varying(36),
    refresh_token_max_reuse integer DEFAULT 0,
    allow_user_managed_access boolean DEFAULT false NOT NULL,
    sso_max_lifespan_remember_me integer DEFAULT 0 NOT NULL,
    sso_idle_timeout_remember_me integer DEFAULT 0 NOT NULL,
    default_role character varying(255)
);


ALTER TABLE public.realm OWNER TO stg_app;

--
-- Name: realm_attribute; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.realm_attribute (
    name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    value text
);


ALTER TABLE public.realm_attribute OWNER TO stg_app;

--
-- Name: realm_default_groups; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.realm_default_groups (
    realm_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.realm_default_groups OWNER TO stg_app;

--
-- Name: realm_enabled_event_types; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.realm_enabled_event_types (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_enabled_event_types OWNER TO stg_app;

--
-- Name: realm_events_listeners; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.realm_events_listeners (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_events_listeners OWNER TO stg_app;

--
-- Name: realm_localizations; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.realm_localizations (
    realm_id character varying(255) NOT NULL,
    locale character varying(255) NOT NULL,
    texts text NOT NULL
);


ALTER TABLE public.realm_localizations OWNER TO stg_app;

--
-- Name: realm_required_credential; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.realm_required_credential (
    type character varying(255) NOT NULL,
    form_label character varying(255),
    input boolean DEFAULT false NOT NULL,
    secret boolean DEFAULT false NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.realm_required_credential OWNER TO stg_app;

--
-- Name: realm_smtp_config; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.realm_smtp_config (
    realm_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.realm_smtp_config OWNER TO stg_app;

--
-- Name: realm_supported_locales; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.realm_supported_locales (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_supported_locales OWNER TO stg_app;

--
-- Name: redirect_uris; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.redirect_uris (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.redirect_uris OWNER TO stg_app;

--
-- Name: required_action_config; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.required_action_config (
    required_action_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.required_action_config OWNER TO stg_app;

--
-- Name: required_action_provider; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.required_action_provider (
    id character varying(36) NOT NULL,
    alias character varying(255),
    name character varying(255),
    realm_id character varying(36),
    enabled boolean DEFAULT false NOT NULL,
    default_action boolean DEFAULT false NOT NULL,
    provider_id character varying(255),
    priority integer
);


ALTER TABLE public.required_action_provider OWNER TO stg_app;

--
-- Name: resource_attribute; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.resource_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    resource_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_attribute OWNER TO stg_app;

--
-- Name: resource_policy; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.resource_policy (
    resource_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_policy OWNER TO stg_app;

--
-- Name: resource_scope; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.resource_scope (
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_scope OWNER TO stg_app;

--
-- Name: resource_server; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.resource_server (
    id character varying(36) NOT NULL,
    allow_rs_remote_mgmt boolean DEFAULT false NOT NULL,
    policy_enforce_mode smallint NOT NULL,
    decision_strategy smallint DEFAULT 1 NOT NULL
);


ALTER TABLE public.resource_server OWNER TO stg_app;

--
-- Name: resource_server_perm_ticket; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.resource_server_perm_ticket (
    id character varying(36) NOT NULL,
    owner character varying(255) NOT NULL,
    requester character varying(255) NOT NULL,
    created_timestamp bigint NOT NULL,
    granted_timestamp bigint,
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36),
    resource_server_id character varying(36) NOT NULL,
    policy_id character varying(36)
);


ALTER TABLE public.resource_server_perm_ticket OWNER TO stg_app;

--
-- Name: resource_server_policy; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.resource_server_policy (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    type character varying(255) NOT NULL,
    decision_strategy smallint,
    logic smallint,
    resource_server_id character varying(36) NOT NULL,
    owner character varying(255)
);


ALTER TABLE public.resource_server_policy OWNER TO stg_app;

--
-- Name: resource_server_resource; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.resource_server_resource (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255),
    icon_uri character varying(255),
    owner character varying(255) NOT NULL,
    resource_server_id character varying(36) NOT NULL,
    owner_managed_access boolean DEFAULT false NOT NULL,
    display_name character varying(255)
);


ALTER TABLE public.resource_server_resource OWNER TO stg_app;

--
-- Name: resource_server_scope; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.resource_server_scope (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    icon_uri character varying(255),
    resource_server_id character varying(36) NOT NULL,
    display_name character varying(255)
);


ALTER TABLE public.resource_server_scope OWNER TO stg_app;

--
-- Name: resource_uris; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.resource_uris (
    resource_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.resource_uris OWNER TO stg_app;

--
-- Name: revoked_token; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.revoked_token (
    id character varying(255) NOT NULL,
    expire bigint NOT NULL
);


ALTER TABLE public.revoked_token OWNER TO stg_app;

--
-- Name: role_attribute; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.role_attribute (
    id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255)
);


ALTER TABLE public.role_attribute OWNER TO stg_app;

--
-- Name: save_files; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.save_files (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    slot_number integer NOT NULL,
    name character varying(255) NOT NULL,
    game_state text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.save_files OWNER TO stg_app;

--
-- Name: scope_mapping; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.scope_mapping (
    client_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE public.scope_mapping OWNER TO stg_app;

--
-- Name: scope_policy; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.scope_policy (
    scope_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE public.scope_policy OWNER TO stg_app;

--
-- Name: user_attribute; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_attribute (
    name character varying(255) NOT NULL,
    value character varying(255),
    user_id character varying(36) NOT NULL,
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


ALTER TABLE public.user_attribute OWNER TO stg_app;

--
-- Name: user_challenges; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_challenges (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    challenge_id uuid NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    target_progress integer NOT NULL,
    status character varying(30) NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    achieved_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_challenges OWNER TO stg_app;

--
-- Name: user_consent; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(36) NOT NULL,
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE public.user_consent OWNER TO stg_app;

--
-- Name: user_consent_client_scope; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_consent_client_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.user_consent_client_scope OWNER TO stg_app;

--
-- Name: user_death_records; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_death_records (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    area_id character varying(100),
    scene_id character varying(100),
    cause character varying(120),
    death_count_snapshot integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_death_records OWNER TO stg_app;

--
-- Name: user_entity; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_entity (
    id character varying(36) NOT NULL,
    email character varying(255),
    email_constraint character varying(255),
    email_verified boolean DEFAULT false NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    federation_link character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    realm_id character varying(255),
    username character varying(255),
    created_timestamp bigint,
    service_account_client_link character varying(255),
    not_before integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.user_entity OWNER TO stg_app;

--
-- Name: user_federation_config; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_federation_config (
    user_federation_provider_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.user_federation_config OWNER TO stg_app;

--
-- Name: user_federation_mapper; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_federation_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    federation_provider_id character varying(36) NOT NULL,
    federation_mapper_type character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.user_federation_mapper OWNER TO stg_app;

--
-- Name: user_federation_mapper_config; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_federation_mapper_config (
    user_federation_mapper_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.user_federation_mapper_config OWNER TO stg_app;

--
-- Name: user_federation_provider; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_federation_provider (
    id character varying(36) NOT NULL,
    changed_sync_period integer,
    display_name character varying(255),
    full_sync_period integer,
    last_sync integer,
    priority integer,
    provider_name character varying(255),
    realm_id character varying(36)
);


ALTER TABLE public.user_federation_provider OWNER TO stg_app;

--
-- Name: user_group_membership; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    membership_type character varying(255) NOT NULL
);


ALTER TABLE public.user_group_membership OWNER TO stg_app;

--
-- Name: user_required_action; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_required_action (
    user_id character varying(36) NOT NULL,
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL
);


ALTER TABLE public.user_required_action OWNER TO stg_app;

--
-- Name: user_role_mapping; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.user_role_mapping (
    role_id character varying(255) NOT NULL,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.user_role_mapping OWNER TO stg_app;

--
-- Name: users; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(255),
    email_verified boolean DEFAULT false NOT NULL,
    phone character varying(50),
    birthday date,
    provider character varying(50) NOT NULL,
    provider_id character varying(255) NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    death_count integer DEFAULT 0 NOT NULL,
    last_death_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO stg_app;

--
-- Name: web_origins; Type: TABLE; Schema: public; Owner: stg_app
--

CREATE TABLE public.web_origins (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.web_origins OWNER TO stg_app;

--
-- Data for Name: admin_event_entity; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.admin_event_entity (id, admin_event_time, realm_id, operation_type, auth_realm_id, auth_client_id, auth_user_id, ip_address, resource_path, representation, error, resource_type, details_json) FROM stdin;
\.


--
-- Data for Name: asset_bundle_files; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.asset_bundle_files (id, asset_bundle_id, path, url, checksum, size_bytes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: associated_policy; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.associated_policy (policy_id, associated_policy_id) FROM stdin;
\.


--
-- Data for Name: authentication_execution; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.authentication_execution (id, alias, authenticator, realm_id, flow_id, requirement, priority, authenticator_flow, auth_flow_id, auth_config) FROM stdin;
8f262a9b-2596-4270-b1f9-e5091ae249a8	\N	auth-cookie	e4b40266-0967-452a-b1e2-26a574255a2d	ec7eacab-0440-4436-8cb9-763d8e235a16	2	10	f	\N	\N
db296e25-57b9-49b8-af77-19453fc46851	\N	auth-spnego	e4b40266-0967-452a-b1e2-26a574255a2d	ec7eacab-0440-4436-8cb9-763d8e235a16	3	20	f	\N	\N
0c1b0dc2-daea-41ad-ab53-d288505f14ab	\N	identity-provider-redirector	e4b40266-0967-452a-b1e2-26a574255a2d	ec7eacab-0440-4436-8cb9-763d8e235a16	2	25	f	\N	\N
61a8eb51-f729-4ae1-b794-b1a37b0f21d0	\N	\N	e4b40266-0967-452a-b1e2-26a574255a2d	ec7eacab-0440-4436-8cb9-763d8e235a16	2	30	t	909b57b1-4266-4936-b201-8b8f2b785f74	\N
2f48f209-0bda-492e-8fb7-97d07a33ad5f	\N	auth-username-password-form	e4b40266-0967-452a-b1e2-26a574255a2d	909b57b1-4266-4936-b201-8b8f2b785f74	0	10	f	\N	\N
88e6818f-9e40-4610-931c-b569d4c28b2f	\N	\N	e4b40266-0967-452a-b1e2-26a574255a2d	909b57b1-4266-4936-b201-8b8f2b785f74	1	20	t	dc4aa279-5eaa-488f-8a7e-c6881be48efc	\N
3c07c447-dea5-4f27-910f-da929e69cc2a	\N	conditional-user-configured	e4b40266-0967-452a-b1e2-26a574255a2d	dc4aa279-5eaa-488f-8a7e-c6881be48efc	0	10	f	\N	\N
4cff2917-3eab-4b81-a41b-515e6ca46c1b	\N	auth-otp-form	e4b40266-0967-452a-b1e2-26a574255a2d	dc4aa279-5eaa-488f-8a7e-c6881be48efc	0	20	f	\N	\N
f42b0fc1-0626-410e-af5c-755a5f506534	\N	direct-grant-validate-username	e4b40266-0967-452a-b1e2-26a574255a2d	bf234d81-ce17-4f86-927b-d4fbbc4eef18	0	10	f	\N	\N
0c14d71a-f465-49c1-804c-2c085aa23280	\N	direct-grant-validate-password	e4b40266-0967-452a-b1e2-26a574255a2d	bf234d81-ce17-4f86-927b-d4fbbc4eef18	0	20	f	\N	\N
3de1b05d-66ce-4286-8b3e-20bb7195adcb	\N	\N	e4b40266-0967-452a-b1e2-26a574255a2d	bf234d81-ce17-4f86-927b-d4fbbc4eef18	1	30	t	34e84856-d83c-484b-ad89-af5e704d857d	\N
902b5188-ee6e-4c71-889c-88f724be61df	\N	conditional-user-configured	e4b40266-0967-452a-b1e2-26a574255a2d	34e84856-d83c-484b-ad89-af5e704d857d	0	10	f	\N	\N
3f6d47ce-e5c7-4ee7-be8f-72648df0de74	\N	direct-grant-validate-otp	e4b40266-0967-452a-b1e2-26a574255a2d	34e84856-d83c-484b-ad89-af5e704d857d	0	20	f	\N	\N
05460098-250c-4acd-9fef-9fe6d5333809	\N	registration-page-form	e4b40266-0967-452a-b1e2-26a574255a2d	889f410f-12b6-495b-b6c8-f4e43d5bb92c	0	10	t	b999f149-d0be-4d19-b57e-d1347b3e3f2a	\N
0f5d4b7c-1d8e-48af-a841-6e7b7ff26df0	\N	registration-user-creation	e4b40266-0967-452a-b1e2-26a574255a2d	b999f149-d0be-4d19-b57e-d1347b3e3f2a	0	20	f	\N	\N
847485cf-73f9-4908-9553-adb67687b033	\N	registration-password-action	e4b40266-0967-452a-b1e2-26a574255a2d	b999f149-d0be-4d19-b57e-d1347b3e3f2a	0	50	f	\N	\N
81fd9fb3-ff00-4c7e-aeb8-2bbd3a624a2f	\N	registration-recaptcha-action	e4b40266-0967-452a-b1e2-26a574255a2d	b999f149-d0be-4d19-b57e-d1347b3e3f2a	3	60	f	\N	\N
6d995f1a-f3fe-4ec2-9d2f-fdeb4dd969f2	\N	registration-terms-and-conditions	e4b40266-0967-452a-b1e2-26a574255a2d	b999f149-d0be-4d19-b57e-d1347b3e3f2a	3	70	f	\N	\N
e4c51027-259b-4aa2-a6f0-9b54547c287d	\N	reset-credentials-choose-user	e4b40266-0967-452a-b1e2-26a574255a2d	eeb5ab7b-a3df-4a34-9848-57f66d8a5b0b	0	10	f	\N	\N
d7e5f79f-9e6d-4ba6-92e7-9c0a56b689d9	\N	reset-credential-email	e4b40266-0967-452a-b1e2-26a574255a2d	eeb5ab7b-a3df-4a34-9848-57f66d8a5b0b	0	20	f	\N	\N
1e8268e7-4b44-4faa-9be1-80a685e24841	\N	reset-password	e4b40266-0967-452a-b1e2-26a574255a2d	eeb5ab7b-a3df-4a34-9848-57f66d8a5b0b	0	30	f	\N	\N
5acfce3c-70a4-4313-a63b-376814feed36	\N	\N	e4b40266-0967-452a-b1e2-26a574255a2d	eeb5ab7b-a3df-4a34-9848-57f66d8a5b0b	1	40	t	73235616-6921-4cf7-ab76-662a2b8fd2da	\N
d92e5131-79d7-4ea4-819d-e105db4a9c73	\N	conditional-user-configured	e4b40266-0967-452a-b1e2-26a574255a2d	73235616-6921-4cf7-ab76-662a2b8fd2da	0	10	f	\N	\N
5fa87ceb-694a-41d6-b9e0-35638eedce7b	\N	reset-otp	e4b40266-0967-452a-b1e2-26a574255a2d	73235616-6921-4cf7-ab76-662a2b8fd2da	0	20	f	\N	\N
25e41f60-ac96-4af1-bc3d-da9a481b321d	\N	client-secret	e4b40266-0967-452a-b1e2-26a574255a2d	b33592c6-24a1-4aa4-a5c8-71479910c4ea	2	10	f	\N	\N
792c639d-6ff3-4823-a377-dbd02eede450	\N	client-jwt	e4b40266-0967-452a-b1e2-26a574255a2d	b33592c6-24a1-4aa4-a5c8-71479910c4ea	2	20	f	\N	\N
b85274ba-ea5e-46ef-954d-97b2cf28244d	\N	client-secret-jwt	e4b40266-0967-452a-b1e2-26a574255a2d	b33592c6-24a1-4aa4-a5c8-71479910c4ea	2	30	f	\N	\N
9b6c8470-67c5-4b87-acc7-345f32ca9f49	\N	client-x509	e4b40266-0967-452a-b1e2-26a574255a2d	b33592c6-24a1-4aa4-a5c8-71479910c4ea	2	40	f	\N	\N
b7f89f4f-7cd2-4c20-801b-d48653274471	\N	idp-review-profile	e4b40266-0967-452a-b1e2-26a574255a2d	e77a1f9d-aab9-4fd4-a1b5-3876543fcd47	0	10	f	\N	573d3c65-adf0-45e0-9898-07919ae28fa3
200e60e3-e6ac-47ec-a923-ec33a3f043a6	\N	\N	e4b40266-0967-452a-b1e2-26a574255a2d	e77a1f9d-aab9-4fd4-a1b5-3876543fcd47	0	20	t	8c54f405-27dd-4b46-8873-8dbfd6d44741	\N
decf0b6b-b2a1-43e7-91b4-a07a137d29c5	\N	idp-create-user-if-unique	e4b40266-0967-452a-b1e2-26a574255a2d	8c54f405-27dd-4b46-8873-8dbfd6d44741	2	10	f	\N	9b309ca2-d39b-4ec5-aad1-5b6ced1e9783
b3e1b56e-ba78-4f5b-9b10-fc5643981447	\N	\N	e4b40266-0967-452a-b1e2-26a574255a2d	8c54f405-27dd-4b46-8873-8dbfd6d44741	2	20	t	214b2576-8d93-4a5c-a2e2-a01fabc5238d	\N
9735f7bd-d2cb-4941-bf77-aa0452facfa5	\N	idp-confirm-link	e4b40266-0967-452a-b1e2-26a574255a2d	214b2576-8d93-4a5c-a2e2-a01fabc5238d	0	10	f	\N	\N
412246b4-e28f-4da1-98cf-d92670410532	\N	\N	e4b40266-0967-452a-b1e2-26a574255a2d	214b2576-8d93-4a5c-a2e2-a01fabc5238d	0	20	t	a14ab47a-b22a-4347-a351-0b67e001952c	\N
1a08703a-aebc-4ee1-a0cc-e15ef60cc4cd	\N	idp-email-verification	e4b40266-0967-452a-b1e2-26a574255a2d	a14ab47a-b22a-4347-a351-0b67e001952c	2	10	f	\N	\N
3878b406-4f3c-457a-a771-41189cd878c4	\N	\N	e4b40266-0967-452a-b1e2-26a574255a2d	a14ab47a-b22a-4347-a351-0b67e001952c	2	20	t	0d6f5ec6-6124-46db-aadf-d38e420d1c81	\N
18e8b265-5629-457a-8ab8-d2d86e0263df	\N	idp-username-password-form	e4b40266-0967-452a-b1e2-26a574255a2d	0d6f5ec6-6124-46db-aadf-d38e420d1c81	0	10	f	\N	\N
6e70fef1-e1f1-43f0-88df-ba0aa96e4aba	\N	\N	e4b40266-0967-452a-b1e2-26a574255a2d	0d6f5ec6-6124-46db-aadf-d38e420d1c81	1	20	t	b5e480f1-2990-462b-b2b5-12187950609c	\N
fa52707a-436a-43dd-a164-20eeed477fca	\N	conditional-user-configured	e4b40266-0967-452a-b1e2-26a574255a2d	b5e480f1-2990-462b-b2b5-12187950609c	0	10	f	\N	\N
08918123-53f7-42c8-ad54-f6447ca3f3c4	\N	auth-otp-form	e4b40266-0967-452a-b1e2-26a574255a2d	b5e480f1-2990-462b-b2b5-12187950609c	0	20	f	\N	\N
2fd5d78e-96da-44f1-9fa2-7b7b83e17c3e	\N	http-basic-authenticator	e4b40266-0967-452a-b1e2-26a574255a2d	71011bb6-1e2b-4194-bf0b-0649d64e3b38	0	10	f	\N	\N
b7470f41-4022-4014-ad16-d0e010f34367	\N	docker-http-basic-authenticator	e4b40266-0967-452a-b1e2-26a574255a2d	d468cea5-ae36-4814-9170-75f340fb2ae3	0	10	f	\N	\N
4caeb111-f5ae-4b1a-919e-e5ac904e9389	\N	auth-cookie	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	287a927b-c005-4eb0-a6d1-7883f84b2af0	2	10	f	\N	\N
08608975-039b-4ad7-9db2-7aacbfa2bf13	\N	auth-spnego	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	287a927b-c005-4eb0-a6d1-7883f84b2af0	3	20	f	\N	\N
1ee6013a-28dd-45ec-8809-f39d0f9ca763	\N	identity-provider-redirector	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	287a927b-c005-4eb0-a6d1-7883f84b2af0	2	25	f	\N	\N
1eb16a39-0fc1-47d8-bbdc-55ab42615145	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	287a927b-c005-4eb0-a6d1-7883f84b2af0	2	30	t	0998e7f6-a242-4572-b8e9-43e6c5578bca	\N
a06afc6b-a164-4905-abab-e6f39c281962	\N	auth-username-password-form	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	0998e7f6-a242-4572-b8e9-43e6c5578bca	0	10	f	\N	\N
0d8580a4-14f0-4d5c-8b54-f891c86ab28f	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	0998e7f6-a242-4572-b8e9-43e6c5578bca	1	20	t	cdb2531d-6452-4275-98da-e52f375455cf	\N
929a2ddc-dca1-4607-b448-26a8f3172e9c	\N	conditional-user-configured	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	cdb2531d-6452-4275-98da-e52f375455cf	0	10	f	\N	\N
d90d433a-64fc-4d7c-a37a-7a635dac0f37	\N	auth-otp-form	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	cdb2531d-6452-4275-98da-e52f375455cf	0	20	f	\N	\N
46d19c1c-f73c-4018-9576-847ac0a49021	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	287a927b-c005-4eb0-a6d1-7883f84b2af0	2	26	t	0e465f67-e1b3-450c-8980-377264cd8fed	\N
067d8784-7e2f-4f0f-9352-fa1732539b5e	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	0e465f67-e1b3-450c-8980-377264cd8fed	1	10	t	1d6b1adc-a033-43c5-93ef-f36604771584	\N
92aebfe1-78bb-4fd6-9dfd-2038baf49284	\N	conditional-user-configured	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	1d6b1adc-a033-43c5-93ef-f36604771584	0	10	f	\N	\N
c362e027-695e-4a68-8caf-903fdbae3db7	\N	organization	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	1d6b1adc-a033-43c5-93ef-f36604771584	2	20	f	\N	\N
2252a8c6-7e5e-4915-afa1-29257d7ed596	\N	direct-grant-validate-username	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	5d84259a-e398-4e9a-93b5-eb586c9e130b	0	10	f	\N	\N
89fbae30-bfa5-4403-b3fe-57633ed22e4d	\N	direct-grant-validate-password	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	5d84259a-e398-4e9a-93b5-eb586c9e130b	0	20	f	\N	\N
114be928-d4cc-4f74-8546-87d2f05e6648	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	5d84259a-e398-4e9a-93b5-eb586c9e130b	1	30	t	cc38482e-da13-47f6-ba73-a854232eef73	\N
28b2a65c-ac35-4085-97c7-acd284315426	\N	conditional-user-configured	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	cc38482e-da13-47f6-ba73-a854232eef73	0	10	f	\N	\N
727e7bc1-ad6f-4453-bd35-3f34861404c0	\N	direct-grant-validate-otp	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	cc38482e-da13-47f6-ba73-a854232eef73	0	20	f	\N	\N
20605d32-3096-43ef-900a-e6d7640958c1	\N	registration-page-form	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	dab08650-3b84-4c14-827e-f74e6f30eefd	0	10	t	9bc507d1-9c7a-4e4a-ba13-f506bf721b02	\N
1b05163a-2273-482f-bcde-19a604ae93ca	\N	registration-user-creation	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	9bc507d1-9c7a-4e4a-ba13-f506bf721b02	0	20	f	\N	\N
9d86605f-f192-4dcb-b0a7-3c3056a07fed	\N	registration-password-action	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	9bc507d1-9c7a-4e4a-ba13-f506bf721b02	0	50	f	\N	\N
7776a322-bed4-46b5-ad35-78c1b6dce6d8	\N	registration-recaptcha-action	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	9bc507d1-9c7a-4e4a-ba13-f506bf721b02	3	60	f	\N	\N
56506eea-8592-41b6-9cfe-9d67f6957f10	\N	registration-terms-and-conditions	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	9bc507d1-9c7a-4e4a-ba13-f506bf721b02	3	70	f	\N	\N
049a801e-fc46-483d-9745-b39e6fd9f449	\N	reset-credentials-choose-user	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	411a404f-2368-4e98-8b1d-68d33138ad19	0	10	f	\N	\N
c48fa614-9587-4acc-958a-db137f28d1b9	\N	reset-credential-email	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	411a404f-2368-4e98-8b1d-68d33138ad19	0	20	f	\N	\N
022ba82d-7449-403e-a599-4722ce906a0f	\N	reset-password	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	411a404f-2368-4e98-8b1d-68d33138ad19	0	30	f	\N	\N
3f51b24c-28b3-4e52-8255-ec37f95802a5	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	411a404f-2368-4e98-8b1d-68d33138ad19	1	40	t	b4895dbb-d6c1-4d11-8084-8bf2ffc260c0	\N
96358bd7-9fc7-40a1-a343-073b8e513e38	\N	conditional-user-configured	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	b4895dbb-d6c1-4d11-8084-8bf2ffc260c0	0	10	f	\N	\N
c35b4455-6718-488f-9a03-2be13a9524f3	\N	reset-otp	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	b4895dbb-d6c1-4d11-8084-8bf2ffc260c0	0	20	f	\N	\N
7b6e1580-a7aa-4763-9df0-42cb7b6c89a7	\N	client-secret	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	8415925b-5388-4096-a7f4-f7adf28c3969	2	10	f	\N	\N
909fe66a-83a5-4252-8834-739b17869907	\N	client-jwt	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	8415925b-5388-4096-a7f4-f7adf28c3969	2	20	f	\N	\N
c5fe80fd-7c41-4752-b88f-74612bb07d02	\N	client-secret-jwt	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	8415925b-5388-4096-a7f4-f7adf28c3969	2	30	f	\N	\N
441869a2-ab76-4b4d-89cc-427757f0874c	\N	client-x509	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	8415925b-5388-4096-a7f4-f7adf28c3969	2	40	f	\N	\N
0277752e-e415-4edc-9ea0-1c0370a69dd8	\N	idp-review-profile	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	078a5877-fb65-4673-8331-1a96979e24cc	0	10	f	\N	2cb3b04d-b41b-4609-b5f8-4e94b1739f30
d978ca2c-2efb-43a9-afaf-158d19eb21a4	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	078a5877-fb65-4673-8331-1a96979e24cc	0	20	t	89513789-275a-45ee-bb62-a6c006b728bc	\N
0b87761b-9bc8-443d-8080-def236393ce9	\N	idp-create-user-if-unique	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	89513789-275a-45ee-bb62-a6c006b728bc	2	10	f	\N	dcb70257-50c1-4371-9072-fc7fe2b2b5e1
1750431d-4027-4d59-9a66-e59fbb38aa0f	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	89513789-275a-45ee-bb62-a6c006b728bc	2	20	t	1435615a-1e16-45f6-9928-4e15fd1f447e	\N
28e3c96f-3b5f-495e-a4b8-91e51e352856	\N	idp-confirm-link	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	1435615a-1e16-45f6-9928-4e15fd1f447e	0	10	f	\N	\N
a6bdd14e-b988-454c-8d4d-624e0db47fce	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	1435615a-1e16-45f6-9928-4e15fd1f447e	0	20	t	3fc158fe-b533-4703-817f-0de77c83b366	\N
ee29e985-824a-4487-a5ad-6fcbfe66d5d0	\N	idp-email-verification	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3fc158fe-b533-4703-817f-0de77c83b366	2	10	f	\N	\N
636614d1-5a0f-481d-aa4e-44cd73cc1191	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3fc158fe-b533-4703-817f-0de77c83b366	2	20	t	062a8ef6-5bf5-423a-ae64-6803a3891dd1	\N
548879e6-1182-409d-ab4f-89c04872a78a	\N	idp-username-password-form	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	062a8ef6-5bf5-423a-ae64-6803a3891dd1	0	10	f	\N	\N
6c061686-c68e-4076-a750-4e4c4199e424	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	062a8ef6-5bf5-423a-ae64-6803a3891dd1	1	20	t	00c12d62-8be2-4d80-9264-549bb3b259ab	\N
358a1e5c-73ca-47f0-a2cb-ec116673c489	\N	conditional-user-configured	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	00c12d62-8be2-4d80-9264-549bb3b259ab	0	10	f	\N	\N
9949bbc5-50da-481c-9884-8464dabd9fe5	\N	auth-otp-form	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	00c12d62-8be2-4d80-9264-549bb3b259ab	0	20	f	\N	\N
77137fbf-ce2a-4930-830a-b48c20b42535	\N	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	078a5877-fb65-4673-8331-1a96979e24cc	1	50	t	6580fe4b-d9a7-458c-9988-e672cbab021b	\N
07f40bc5-2643-40dc-b496-ad50440c63c1	\N	conditional-user-configured	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	6580fe4b-d9a7-458c-9988-e672cbab021b	0	10	f	\N	\N
faf22ead-0150-4175-a70a-3d1eb6d73fd8	\N	idp-add-organization-member	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	6580fe4b-d9a7-458c-9988-e672cbab021b	0	20	f	\N	\N
b561c689-e93b-4f60-a194-6e5986377d30	\N	http-basic-authenticator	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	bb6c30ac-bf29-435d-900d-48dd45741e36	0	10	f	\N	\N
0c2604f3-18fb-4325-9012-8f768f7d27d6	\N	docker-http-basic-authenticator	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	8e4cf74e-6b2e-472e-bae6-e6d361e034d2	0	10	f	\N	\N
\.


--
-- Data for Name: authentication_flow; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.authentication_flow (id, alias, description, realm_id, provider_id, top_level, built_in) FROM stdin;
ec7eacab-0440-4436-8cb9-763d8e235a16	browser	Browser based authentication	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	t	t
909b57b1-4266-4936-b201-8b8f2b785f74	forms	Username, password, otp and other auth forms.	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	f	t
dc4aa279-5eaa-488f-8a7e-c6881be48efc	Browser - Conditional OTP	Flow to determine if the OTP is required for the authentication	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	f	t
bf234d81-ce17-4f86-927b-d4fbbc4eef18	direct grant	OpenID Connect Resource Owner Grant	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	t	t
34e84856-d83c-484b-ad89-af5e704d857d	Direct Grant - Conditional OTP	Flow to determine if the OTP is required for the authentication	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	f	t
889f410f-12b6-495b-b6c8-f4e43d5bb92c	registration	Registration flow	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	t	t
b999f149-d0be-4d19-b57e-d1347b3e3f2a	registration form	Registration form	e4b40266-0967-452a-b1e2-26a574255a2d	form-flow	f	t
eeb5ab7b-a3df-4a34-9848-57f66d8a5b0b	reset credentials	Reset credentials for a user if they forgot their password or something	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	t	t
73235616-6921-4cf7-ab76-662a2b8fd2da	Reset - Conditional OTP	Flow to determine if the OTP should be reset or not. Set to REQUIRED to force.	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	f	t
b33592c6-24a1-4aa4-a5c8-71479910c4ea	clients	Base authentication for clients	e4b40266-0967-452a-b1e2-26a574255a2d	client-flow	t	t
e77a1f9d-aab9-4fd4-a1b5-3876543fcd47	first broker login	Actions taken after first broker login with identity provider account, which is not yet linked to any Keycloak account	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	t	t
8c54f405-27dd-4b46-8873-8dbfd6d44741	User creation or linking	Flow for the existing/non-existing user alternatives	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	f	t
214b2576-8d93-4a5c-a2e2-a01fabc5238d	Handle Existing Account	Handle what to do if there is existing account with same email/username like authenticated identity provider	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	f	t
a14ab47a-b22a-4347-a351-0b67e001952c	Account verification options	Method with which to verity the existing account	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	f	t
0d6f5ec6-6124-46db-aadf-d38e420d1c81	Verify Existing Account by Re-authentication	Reauthentication of existing account	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	f	t
b5e480f1-2990-462b-b2b5-12187950609c	First broker login - Conditional OTP	Flow to determine if the OTP is required for the authentication	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	f	t
71011bb6-1e2b-4194-bf0b-0649d64e3b38	saml ecp	SAML ECP Profile Authentication Flow	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	t	t
d468cea5-ae36-4814-9170-75f340fb2ae3	docker auth	Used by Docker clients to authenticate against the IDP	e4b40266-0967-452a-b1e2-26a574255a2d	basic-flow	t	t
287a927b-c005-4eb0-a6d1-7883f84b2af0	browser	Browser based authentication	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	t	t
0998e7f6-a242-4572-b8e9-43e6c5578bca	forms	Username, password, otp and other auth forms.	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
cdb2531d-6452-4275-98da-e52f375455cf	Browser - Conditional OTP	Flow to determine if the OTP is required for the authentication	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
0e465f67-e1b3-450c-8980-377264cd8fed	Organization	\N	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
1d6b1adc-a033-43c5-93ef-f36604771584	Browser - Conditional Organization	Flow to determine if the organization identity-first login is to be used	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
5d84259a-e398-4e9a-93b5-eb586c9e130b	direct grant	OpenID Connect Resource Owner Grant	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	t	t
cc38482e-da13-47f6-ba73-a854232eef73	Direct Grant - Conditional OTP	Flow to determine if the OTP is required for the authentication	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
dab08650-3b84-4c14-827e-f74e6f30eefd	registration	Registration flow	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	t	t
9bc507d1-9c7a-4e4a-ba13-f506bf721b02	registration form	Registration form	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	form-flow	f	t
411a404f-2368-4e98-8b1d-68d33138ad19	reset credentials	Reset credentials for a user if they forgot their password or something	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	t	t
b4895dbb-d6c1-4d11-8084-8bf2ffc260c0	Reset - Conditional OTP	Flow to determine if the OTP should be reset or not. Set to REQUIRED to force.	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
8415925b-5388-4096-a7f4-f7adf28c3969	clients	Base authentication for clients	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	client-flow	t	t
078a5877-fb65-4673-8331-1a96979e24cc	first broker login	Actions taken after first broker login with identity provider account, which is not yet linked to any Keycloak account	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	t	t
89513789-275a-45ee-bb62-a6c006b728bc	User creation or linking	Flow for the existing/non-existing user alternatives	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
1435615a-1e16-45f6-9928-4e15fd1f447e	Handle Existing Account	Handle what to do if there is existing account with same email/username like authenticated identity provider	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
3fc158fe-b533-4703-817f-0de77c83b366	Account verification options	Method with which to verity the existing account	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
062a8ef6-5bf5-423a-ae64-6803a3891dd1	Verify Existing Account by Re-authentication	Reauthentication of existing account	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
00c12d62-8be2-4d80-9264-549bb3b259ab	First broker login - Conditional OTP	Flow to determine if the OTP is required for the authentication	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
6580fe4b-d9a7-458c-9988-e672cbab021b	First Broker Login - Conditional Organization	Flow to determine if the authenticator that adds organization members is to be used	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	f	t
bb6c30ac-bf29-435d-900d-48dd45741e36	saml ecp	SAML ECP Profile Authentication Flow	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	t	t
8e4cf74e-6b2e-472e-bae6-e6d361e034d2	docker auth	Used by Docker clients to authenticate against the IDP	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	basic-flow	t	t
\.


--
-- Data for Name: authenticator_config; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.authenticator_config (id, alias, realm_id) FROM stdin;
573d3c65-adf0-45e0-9898-07919ae28fa3	review profile config	e4b40266-0967-452a-b1e2-26a574255a2d
9b309ca2-d39b-4ec5-aad1-5b6ced1e9783	create unique user config	e4b40266-0967-452a-b1e2-26a574255a2d
2cb3b04d-b41b-4609-b5f8-4e94b1739f30	review profile config	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5
dcb70257-50c1-4371-9072-fc7fe2b2b5e1	create unique user config	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5
\.


--
-- Data for Name: authenticator_config_entry; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.authenticator_config_entry (authenticator_id, value, name) FROM stdin;
573d3c65-adf0-45e0-9898-07919ae28fa3	missing	update.profile.on.first.login
9b309ca2-d39b-4ec5-aad1-5b6ced1e9783	false	require.password.update.after.registration
2cb3b04d-b41b-4609-b5f8-4e94b1739f30	missing	update.profile.on.first.login
dcb70257-50c1-4371-9072-fc7fe2b2b5e1	false	require.password.update.after.registration
\.


--
-- Data for Name: broker_link; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.broker_link (identity_provider, storage_provider_id, realm_id, broker_user_id, broker_username, token, user_id) FROM stdin;
\.


--
-- Data for Name: challenges; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.challenges (id, code, name, description, target_progress, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: client; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.client (id, enabled, full_scope_allowed, client_id, not_before, public_client, secret, base_url, bearer_only, management_url, surrogate_auth_required, realm_id, protocol, node_rereg_timeout, frontchannel_logout, consent_required, name, service_accounts_enabled, client_authenticator_type, root_url, description, registration_token, standard_flow_enabled, implicit_flow_enabled, direct_access_grants_enabled, always_display_in_console) FROM stdin;
7b2d0efa-a437-467b-84a3-e4f3459550bb	t	f	master-realm	0	f	\N	\N	t	\N	f	e4b40266-0967-452a-b1e2-26a574255a2d	\N	0	f	f	master Realm	f	client-secret	\N	\N	\N	t	f	f	f
8601052c-64a0-4aa2-8a44-6086ca390c4d	t	f	account	0	t	\N	/realms/master/account/	f	\N	f	e4b40266-0967-452a-b1e2-26a574255a2d	openid-connect	0	f	f	${client_account}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
326a5eb7-4a21-4106-a30c-7f97c29d3fab	t	f	account-console	0	t	\N	/realms/master/account/	f	\N	f	e4b40266-0967-452a-b1e2-26a574255a2d	openid-connect	0	f	f	${client_account-console}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	t	f	broker	0	f	\N	\N	t	\N	f	e4b40266-0967-452a-b1e2-26a574255a2d	openid-connect	0	f	f	${client_broker}	f	client-secret	\N	\N	\N	t	f	f	f
ada9c621-b0c0-4b02-b33e-011a78309041	t	t	security-admin-console	0	t	\N	/admin/master/console/	f	\N	f	e4b40266-0967-452a-b1e2-26a574255a2d	openid-connect	0	f	f	${client_security-admin-console}	f	client-secret	${authAdminUrl}	\N	\N	t	f	f	f
41d32a32-68c1-470f-8364-810fb2586d57	t	t	admin-cli	0	t	\N	\N	f	\N	f	e4b40266-0967-452a-b1e2-26a574255a2d	openid-connect	0	f	f	${client_admin-cli}	f	client-secret	\N	\N	\N	f	f	t	f
25edb070-4c40-451b-bfd9-5e4efcd153f7	t	f	app-realm	0	f	\N	\N	t	\N	f	e4b40266-0967-452a-b1e2-26a574255a2d	\N	0	f	f	app Realm	f	client-secret	\N	\N	\N	t	f	f	f
3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	f	realm-management	0	f	\N	\N	t	\N	f	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	openid-connect	0	f	f	${client_realm-management}	f	client-secret	\N	\N	\N	t	f	f	f
6769e5ef-51ad-41fa-b763-6215030eb3d8	t	f	account	0	t	\N	/realms/app/account/	f	\N	f	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	openid-connect	0	f	f	${client_account}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
ed111216-43bb-40d4-81b7-c440a110de24	t	f	account-console	0	t	\N	/realms/app/account/	f	\N	f	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	openid-connect	0	f	f	${client_account-console}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	t	f	broker	0	f	\N	\N	t	\N	f	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	openid-connect	0	f	f	${client_broker}	f	client-secret	\N	\N	\N	t	f	f	f
874892be-6f1d-4646-a497-cf38baa87865	t	t	security-admin-console	0	t	\N	/admin/app/console/	f	\N	f	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	openid-connect	0	f	f	${client_security-admin-console}	f	client-secret	${authAdminUrl}	\N	\N	t	f	f	f
2e20b15b-b26a-47e5-aac3-b328c53ffec5	t	t	admin-cli	0	t	\N	\N	f	\N	f	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	openid-connect	0	f	f	${client_admin-cli}	f	client-secret	\N	\N	\N	f	f	t	f
c200afa9-e84a-4df3-b313-5ccb1e69b28c	t	t	ssafy-maker-prod	0	f	JTAP6QvylgTfgX9KlPfLtjjYnFkNLtE2		f		f	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	openid-connect	-1	f	f	ssafy-maker 인증용	f	client-secret		ssafy-maker 게임 로그인 인증용입니다	\N	t	f	f	f
\.


--
-- Data for Name: client_attributes; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.client_attributes (client_id, name, value) FROM stdin;
8601052c-64a0-4aa2-8a44-6086ca390c4d	post.logout.redirect.uris	+
326a5eb7-4a21-4106-a30c-7f97c29d3fab	post.logout.redirect.uris	+
326a5eb7-4a21-4106-a30c-7f97c29d3fab	pkce.code.challenge.method	S256
ada9c621-b0c0-4b02-b33e-011a78309041	post.logout.redirect.uris	+
ada9c621-b0c0-4b02-b33e-011a78309041	pkce.code.challenge.method	S256
ada9c621-b0c0-4b02-b33e-011a78309041	client.use.lightweight.access.token.enabled	true
41d32a32-68c1-470f-8364-810fb2586d57	client.use.lightweight.access.token.enabled	true
6769e5ef-51ad-41fa-b763-6215030eb3d8	post.logout.redirect.uris	+
ed111216-43bb-40d4-81b7-c440a110de24	post.logout.redirect.uris	+
ed111216-43bb-40d4-81b7-c440a110de24	pkce.code.challenge.method	S256
874892be-6f1d-4646-a497-cf38baa87865	post.logout.redirect.uris	+
874892be-6f1d-4646-a497-cf38baa87865	pkce.code.challenge.method	S256
874892be-6f1d-4646-a497-cf38baa87865	client.use.lightweight.access.token.enabled	true
2e20b15b-b26a-47e5-aac3-b328c53ffec5	client.use.lightweight.access.token.enabled	true
c200afa9-e84a-4df3-b313-5ccb1e69b28c	client.secret.creation.time	1773898956
c200afa9-e84a-4df3-b313-5ccb1e69b28c	oauth2.device.authorization.grant.enabled	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	oidc.ciba.grant.enabled	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	backchannel.logout.session.required	true
c200afa9-e84a-4df3-b313-5ccb1e69b28c	backchannel.logout.revoke.offline.tokens	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	realm_client	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	display.on.consent.screen	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	frontchannel.logout.session.required	true
c200afa9-e84a-4df3-b313-5ccb1e69b28c	use.jwks.url	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	request.object.signature.alg	any
c200afa9-e84a-4df3-b313-5ccb1e69b28c	request.object.encryption.alg	any
c200afa9-e84a-4df3-b313-5ccb1e69b28c	request.object.encryption.enc	any
c200afa9-e84a-4df3-b313-5ccb1e69b28c	request.object.required	not required
c200afa9-e84a-4df3-b313-5ccb1e69b28c	use.refresh.tokens	true
c200afa9-e84a-4df3-b313-5ccb1e69b28c	client_credentials.use_refresh_token	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	token.response.type.bearer.lower-case	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	tls.client.certificate.bound.access.tokens	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	pkce.code.challenge.method	S256
c200afa9-e84a-4df3-b313-5ccb1e69b28c	require.pushed.authorization.requests	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	client.use.lightweight.access.token.enabled	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	client.introspection.response.allow.jwt.claim.enabled	false
c200afa9-e84a-4df3-b313-5ccb1e69b28c	acr.loa.map	{}
c200afa9-e84a-4df3-b313-5ccb1e69b28c	frontchannel.logout.url	https://stg.ssafymaker.cloud/
c200afa9-e84a-4df3-b313-5ccb1e69b28c	post.logout.redirect.uris	https://ssafymaker.cloud/##https://stg.ssafymaker.cloud/##http://localhost:5173/
\.


--
-- Data for Name: client_auth_flow_bindings; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.client_auth_flow_bindings (client_id, flow_id, binding_name) FROM stdin;
\.


--
-- Data for Name: client_initial_access; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.client_initial_access (id, realm_id, "timestamp", expiration, count, remaining_count) FROM stdin;
\.


--
-- Data for Name: client_node_registrations; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.client_node_registrations (client_id, value, name) FROM stdin;
\.


--
-- Data for Name: client_scope; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.client_scope (id, name, realm_id, description, protocol) FROM stdin;
a1fbb06c-2b0c-46bb-bb68-93e343952c5e	offline_access	e4b40266-0967-452a-b1e2-26a574255a2d	OpenID Connect built-in scope: offline_access	openid-connect
b42a6548-86dd-4c7c-9c5f-8a9bedca6cea	role_list	e4b40266-0967-452a-b1e2-26a574255a2d	SAML role list	saml
534591d0-0be7-46dd-a8df-7a788032b819	saml_organization	e4b40266-0967-452a-b1e2-26a574255a2d	Organization Membership	saml
38d9c618-b15f-48aa-ba54-7deaef86a617	profile	e4b40266-0967-452a-b1e2-26a574255a2d	OpenID Connect built-in scope: profile	openid-connect
258b9096-f77e-43f3-9274-bb76ee82aa42	email	e4b40266-0967-452a-b1e2-26a574255a2d	OpenID Connect built-in scope: email	openid-connect
e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9	address	e4b40266-0967-452a-b1e2-26a574255a2d	OpenID Connect built-in scope: address	openid-connect
4b5261d2-b140-42e4-83f9-64a87dfbb513	phone	e4b40266-0967-452a-b1e2-26a574255a2d	OpenID Connect built-in scope: phone	openid-connect
b8e2563f-e25a-4b9c-b981-dad3a682d3e6	roles	e4b40266-0967-452a-b1e2-26a574255a2d	OpenID Connect scope for add user roles to the access token	openid-connect
271c36ce-6de7-4ed2-a126-64dafad5701c	web-origins	e4b40266-0967-452a-b1e2-26a574255a2d	OpenID Connect scope for add allowed web origins to the access token	openid-connect
4c314614-beff-43e1-a37e-7c3bb33bf108	microprofile-jwt	e4b40266-0967-452a-b1e2-26a574255a2d	Microprofile - JWT built-in scope	openid-connect
2184f94f-0889-4fc0-9e55-1fb82868829d	acr	e4b40266-0967-452a-b1e2-26a574255a2d	OpenID Connect scope for add acr (authentication context class reference) to the token	openid-connect
bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a	basic	e4b40266-0967-452a-b1e2-26a574255a2d	OpenID Connect scope for add all basic claims to the token	openid-connect
22b3b841-ee9c-4b49-87f1-0dc2d3f3331f	service_account	e4b40266-0967-452a-b1e2-26a574255a2d	Specific scope for a client enabled for service accounts	openid-connect
e75d2f91-2c3f-440a-98c4-439412e37175	organization	e4b40266-0967-452a-b1e2-26a574255a2d	Additional claims about the organization a subject belongs to	openid-connect
e0834747-8b1d-4dcd-9520-019d711c62d2	offline_access	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	OpenID Connect built-in scope: offline_access	openid-connect
d86339ea-230d-4d00-9acd-55f30d172409	role_list	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	SAML role list	saml
e8b06218-b511-46e2-b20b-654afff68052	saml_organization	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	Organization Membership	saml
a4a1104a-493f-4d45-b0cb-94ad21ba9d00	profile	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	OpenID Connect built-in scope: profile	openid-connect
48bac497-bb5d-4dc4-8827-632ecc31a9c4	email	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	OpenID Connect built-in scope: email	openid-connect
a9f81487-aae0-4844-8066-be931ab3dc08	address	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	OpenID Connect built-in scope: address	openid-connect
a6e4a039-7eda-42af-a1be-d97243616cb7	phone	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	OpenID Connect built-in scope: phone	openid-connect
c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	roles	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	OpenID Connect scope for add user roles to the access token	openid-connect
bdc45480-3be7-4f92-882e-34dabb5837b3	web-origins	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	OpenID Connect scope for add allowed web origins to the access token	openid-connect
e8e74038-29cf-48e9-ab55-c80e757c6bb4	microprofile-jwt	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	Microprofile - JWT built-in scope	openid-connect
259a8e29-2ffd-472d-bb33-a06fbe28e7fb	acr	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	OpenID Connect scope for add acr (authentication context class reference) to the token	openid-connect
74f3cc11-8fac-42ac-8fac-b2ff721c34a4	basic	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	OpenID Connect scope for add all basic claims to the token	openid-connect
08d1cbce-b904-462f-8916-270a0a58cc51	service_account	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	Specific scope for a client enabled for service accounts	openid-connect
f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	organization	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	Additional claims about the organization a subject belongs to	openid-connect
\.


--
-- Data for Name: client_scope_attributes; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.client_scope_attributes (scope_id, value, name) FROM stdin;
a1fbb06c-2b0c-46bb-bb68-93e343952c5e	true	display.on.consent.screen
a1fbb06c-2b0c-46bb-bb68-93e343952c5e	${offlineAccessScopeConsentText}	consent.screen.text
b42a6548-86dd-4c7c-9c5f-8a9bedca6cea	true	display.on.consent.screen
b42a6548-86dd-4c7c-9c5f-8a9bedca6cea	${samlRoleListScopeConsentText}	consent.screen.text
534591d0-0be7-46dd-a8df-7a788032b819	false	display.on.consent.screen
38d9c618-b15f-48aa-ba54-7deaef86a617	true	display.on.consent.screen
38d9c618-b15f-48aa-ba54-7deaef86a617	${profileScopeConsentText}	consent.screen.text
38d9c618-b15f-48aa-ba54-7deaef86a617	true	include.in.token.scope
258b9096-f77e-43f3-9274-bb76ee82aa42	true	display.on.consent.screen
258b9096-f77e-43f3-9274-bb76ee82aa42	${emailScopeConsentText}	consent.screen.text
258b9096-f77e-43f3-9274-bb76ee82aa42	true	include.in.token.scope
e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9	true	display.on.consent.screen
e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9	${addressScopeConsentText}	consent.screen.text
e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9	true	include.in.token.scope
4b5261d2-b140-42e4-83f9-64a87dfbb513	true	display.on.consent.screen
4b5261d2-b140-42e4-83f9-64a87dfbb513	${phoneScopeConsentText}	consent.screen.text
4b5261d2-b140-42e4-83f9-64a87dfbb513	true	include.in.token.scope
b8e2563f-e25a-4b9c-b981-dad3a682d3e6	true	display.on.consent.screen
b8e2563f-e25a-4b9c-b981-dad3a682d3e6	${rolesScopeConsentText}	consent.screen.text
b8e2563f-e25a-4b9c-b981-dad3a682d3e6	false	include.in.token.scope
271c36ce-6de7-4ed2-a126-64dafad5701c	false	display.on.consent.screen
271c36ce-6de7-4ed2-a126-64dafad5701c		consent.screen.text
271c36ce-6de7-4ed2-a126-64dafad5701c	false	include.in.token.scope
4c314614-beff-43e1-a37e-7c3bb33bf108	false	display.on.consent.screen
4c314614-beff-43e1-a37e-7c3bb33bf108	true	include.in.token.scope
2184f94f-0889-4fc0-9e55-1fb82868829d	false	display.on.consent.screen
2184f94f-0889-4fc0-9e55-1fb82868829d	false	include.in.token.scope
bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a	false	display.on.consent.screen
bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a	false	include.in.token.scope
22b3b841-ee9c-4b49-87f1-0dc2d3f3331f	false	display.on.consent.screen
22b3b841-ee9c-4b49-87f1-0dc2d3f3331f	false	include.in.token.scope
e75d2f91-2c3f-440a-98c4-439412e37175	true	display.on.consent.screen
e75d2f91-2c3f-440a-98c4-439412e37175	${organizationScopeConsentText}	consent.screen.text
e75d2f91-2c3f-440a-98c4-439412e37175	true	include.in.token.scope
e0834747-8b1d-4dcd-9520-019d711c62d2	true	display.on.consent.screen
e0834747-8b1d-4dcd-9520-019d711c62d2	${offlineAccessScopeConsentText}	consent.screen.text
d86339ea-230d-4d00-9acd-55f30d172409	true	display.on.consent.screen
d86339ea-230d-4d00-9acd-55f30d172409	${samlRoleListScopeConsentText}	consent.screen.text
e8b06218-b511-46e2-b20b-654afff68052	false	display.on.consent.screen
a4a1104a-493f-4d45-b0cb-94ad21ba9d00	true	display.on.consent.screen
a4a1104a-493f-4d45-b0cb-94ad21ba9d00	${profileScopeConsentText}	consent.screen.text
a4a1104a-493f-4d45-b0cb-94ad21ba9d00	true	include.in.token.scope
48bac497-bb5d-4dc4-8827-632ecc31a9c4	true	display.on.consent.screen
48bac497-bb5d-4dc4-8827-632ecc31a9c4	${emailScopeConsentText}	consent.screen.text
48bac497-bb5d-4dc4-8827-632ecc31a9c4	true	include.in.token.scope
a9f81487-aae0-4844-8066-be931ab3dc08	true	display.on.consent.screen
a9f81487-aae0-4844-8066-be931ab3dc08	${addressScopeConsentText}	consent.screen.text
a9f81487-aae0-4844-8066-be931ab3dc08	true	include.in.token.scope
a6e4a039-7eda-42af-a1be-d97243616cb7	true	display.on.consent.screen
a6e4a039-7eda-42af-a1be-d97243616cb7	${phoneScopeConsentText}	consent.screen.text
a6e4a039-7eda-42af-a1be-d97243616cb7	true	include.in.token.scope
c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	true	display.on.consent.screen
c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	${rolesScopeConsentText}	consent.screen.text
c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	false	include.in.token.scope
bdc45480-3be7-4f92-882e-34dabb5837b3	false	display.on.consent.screen
bdc45480-3be7-4f92-882e-34dabb5837b3		consent.screen.text
bdc45480-3be7-4f92-882e-34dabb5837b3	false	include.in.token.scope
e8e74038-29cf-48e9-ab55-c80e757c6bb4	false	display.on.consent.screen
e8e74038-29cf-48e9-ab55-c80e757c6bb4	true	include.in.token.scope
259a8e29-2ffd-472d-bb33-a06fbe28e7fb	false	display.on.consent.screen
259a8e29-2ffd-472d-bb33-a06fbe28e7fb	false	include.in.token.scope
74f3cc11-8fac-42ac-8fac-b2ff721c34a4	false	display.on.consent.screen
74f3cc11-8fac-42ac-8fac-b2ff721c34a4	false	include.in.token.scope
08d1cbce-b904-462f-8916-270a0a58cc51	false	display.on.consent.screen
08d1cbce-b904-462f-8916-270a0a58cc51	false	include.in.token.scope
f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	true	display.on.consent.screen
f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	${organizationScopeConsentText}	consent.screen.text
f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	true	include.in.token.scope
\.


--
-- Data for Name: client_scope_client; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.client_scope_client (client_id, scope_id, default_scope) FROM stdin;
8601052c-64a0-4aa2-8a44-6086ca390c4d	258b9096-f77e-43f3-9274-bb76ee82aa42	t
8601052c-64a0-4aa2-8a44-6086ca390c4d	271c36ce-6de7-4ed2-a126-64dafad5701c	t
8601052c-64a0-4aa2-8a44-6086ca390c4d	2184f94f-0889-4fc0-9e55-1fb82868829d	t
8601052c-64a0-4aa2-8a44-6086ca390c4d	bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a	t
8601052c-64a0-4aa2-8a44-6086ca390c4d	38d9c618-b15f-48aa-ba54-7deaef86a617	t
8601052c-64a0-4aa2-8a44-6086ca390c4d	b8e2563f-e25a-4b9c-b981-dad3a682d3e6	t
8601052c-64a0-4aa2-8a44-6086ca390c4d	4b5261d2-b140-42e4-83f9-64a87dfbb513	f
8601052c-64a0-4aa2-8a44-6086ca390c4d	a1fbb06c-2b0c-46bb-bb68-93e343952c5e	f
8601052c-64a0-4aa2-8a44-6086ca390c4d	4c314614-beff-43e1-a37e-7c3bb33bf108	f
8601052c-64a0-4aa2-8a44-6086ca390c4d	e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9	f
8601052c-64a0-4aa2-8a44-6086ca390c4d	e75d2f91-2c3f-440a-98c4-439412e37175	f
326a5eb7-4a21-4106-a30c-7f97c29d3fab	258b9096-f77e-43f3-9274-bb76ee82aa42	t
326a5eb7-4a21-4106-a30c-7f97c29d3fab	271c36ce-6de7-4ed2-a126-64dafad5701c	t
326a5eb7-4a21-4106-a30c-7f97c29d3fab	2184f94f-0889-4fc0-9e55-1fb82868829d	t
326a5eb7-4a21-4106-a30c-7f97c29d3fab	bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a	t
326a5eb7-4a21-4106-a30c-7f97c29d3fab	38d9c618-b15f-48aa-ba54-7deaef86a617	t
326a5eb7-4a21-4106-a30c-7f97c29d3fab	b8e2563f-e25a-4b9c-b981-dad3a682d3e6	t
326a5eb7-4a21-4106-a30c-7f97c29d3fab	4b5261d2-b140-42e4-83f9-64a87dfbb513	f
326a5eb7-4a21-4106-a30c-7f97c29d3fab	a1fbb06c-2b0c-46bb-bb68-93e343952c5e	f
326a5eb7-4a21-4106-a30c-7f97c29d3fab	4c314614-beff-43e1-a37e-7c3bb33bf108	f
326a5eb7-4a21-4106-a30c-7f97c29d3fab	e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9	f
326a5eb7-4a21-4106-a30c-7f97c29d3fab	e75d2f91-2c3f-440a-98c4-439412e37175	f
41d32a32-68c1-470f-8364-810fb2586d57	258b9096-f77e-43f3-9274-bb76ee82aa42	t
41d32a32-68c1-470f-8364-810fb2586d57	271c36ce-6de7-4ed2-a126-64dafad5701c	t
41d32a32-68c1-470f-8364-810fb2586d57	2184f94f-0889-4fc0-9e55-1fb82868829d	t
41d32a32-68c1-470f-8364-810fb2586d57	bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a	t
41d32a32-68c1-470f-8364-810fb2586d57	38d9c618-b15f-48aa-ba54-7deaef86a617	t
41d32a32-68c1-470f-8364-810fb2586d57	b8e2563f-e25a-4b9c-b981-dad3a682d3e6	t
41d32a32-68c1-470f-8364-810fb2586d57	4b5261d2-b140-42e4-83f9-64a87dfbb513	f
41d32a32-68c1-470f-8364-810fb2586d57	a1fbb06c-2b0c-46bb-bb68-93e343952c5e	f
41d32a32-68c1-470f-8364-810fb2586d57	4c314614-beff-43e1-a37e-7c3bb33bf108	f
41d32a32-68c1-470f-8364-810fb2586d57	e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9	f
41d32a32-68c1-470f-8364-810fb2586d57	e75d2f91-2c3f-440a-98c4-439412e37175	f
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	258b9096-f77e-43f3-9274-bb76ee82aa42	t
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	271c36ce-6de7-4ed2-a126-64dafad5701c	t
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	2184f94f-0889-4fc0-9e55-1fb82868829d	t
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a	t
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	38d9c618-b15f-48aa-ba54-7deaef86a617	t
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	b8e2563f-e25a-4b9c-b981-dad3a682d3e6	t
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	4b5261d2-b140-42e4-83f9-64a87dfbb513	f
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	a1fbb06c-2b0c-46bb-bb68-93e343952c5e	f
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	4c314614-beff-43e1-a37e-7c3bb33bf108	f
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9	f
f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	e75d2f91-2c3f-440a-98c4-439412e37175	f
7b2d0efa-a437-467b-84a3-e4f3459550bb	258b9096-f77e-43f3-9274-bb76ee82aa42	t
7b2d0efa-a437-467b-84a3-e4f3459550bb	271c36ce-6de7-4ed2-a126-64dafad5701c	t
7b2d0efa-a437-467b-84a3-e4f3459550bb	2184f94f-0889-4fc0-9e55-1fb82868829d	t
7b2d0efa-a437-467b-84a3-e4f3459550bb	bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a	t
7b2d0efa-a437-467b-84a3-e4f3459550bb	38d9c618-b15f-48aa-ba54-7deaef86a617	t
7b2d0efa-a437-467b-84a3-e4f3459550bb	b8e2563f-e25a-4b9c-b981-dad3a682d3e6	t
7b2d0efa-a437-467b-84a3-e4f3459550bb	4b5261d2-b140-42e4-83f9-64a87dfbb513	f
7b2d0efa-a437-467b-84a3-e4f3459550bb	a1fbb06c-2b0c-46bb-bb68-93e343952c5e	f
7b2d0efa-a437-467b-84a3-e4f3459550bb	4c314614-beff-43e1-a37e-7c3bb33bf108	f
7b2d0efa-a437-467b-84a3-e4f3459550bb	e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9	f
7b2d0efa-a437-467b-84a3-e4f3459550bb	e75d2f91-2c3f-440a-98c4-439412e37175	f
ada9c621-b0c0-4b02-b33e-011a78309041	258b9096-f77e-43f3-9274-bb76ee82aa42	t
ada9c621-b0c0-4b02-b33e-011a78309041	271c36ce-6de7-4ed2-a126-64dafad5701c	t
ada9c621-b0c0-4b02-b33e-011a78309041	2184f94f-0889-4fc0-9e55-1fb82868829d	t
ada9c621-b0c0-4b02-b33e-011a78309041	bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a	t
ada9c621-b0c0-4b02-b33e-011a78309041	38d9c618-b15f-48aa-ba54-7deaef86a617	t
ada9c621-b0c0-4b02-b33e-011a78309041	b8e2563f-e25a-4b9c-b981-dad3a682d3e6	t
ada9c621-b0c0-4b02-b33e-011a78309041	4b5261d2-b140-42e4-83f9-64a87dfbb513	f
ada9c621-b0c0-4b02-b33e-011a78309041	a1fbb06c-2b0c-46bb-bb68-93e343952c5e	f
ada9c621-b0c0-4b02-b33e-011a78309041	4c314614-beff-43e1-a37e-7c3bb33bf108	f
ada9c621-b0c0-4b02-b33e-011a78309041	e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9	f
ada9c621-b0c0-4b02-b33e-011a78309041	e75d2f91-2c3f-440a-98c4-439412e37175	f
6769e5ef-51ad-41fa-b763-6215030eb3d8	a4a1104a-493f-4d45-b0cb-94ad21ba9d00	t
6769e5ef-51ad-41fa-b763-6215030eb3d8	bdc45480-3be7-4f92-882e-34dabb5837b3	t
6769e5ef-51ad-41fa-b763-6215030eb3d8	48bac497-bb5d-4dc4-8827-632ecc31a9c4	t
6769e5ef-51ad-41fa-b763-6215030eb3d8	259a8e29-2ffd-472d-bb33-a06fbe28e7fb	t
6769e5ef-51ad-41fa-b763-6215030eb3d8	c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	t
6769e5ef-51ad-41fa-b763-6215030eb3d8	74f3cc11-8fac-42ac-8fac-b2ff721c34a4	t
6769e5ef-51ad-41fa-b763-6215030eb3d8	f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	f
6769e5ef-51ad-41fa-b763-6215030eb3d8	a6e4a039-7eda-42af-a1be-d97243616cb7	f
6769e5ef-51ad-41fa-b763-6215030eb3d8	a9f81487-aae0-4844-8066-be931ab3dc08	f
6769e5ef-51ad-41fa-b763-6215030eb3d8	e8e74038-29cf-48e9-ab55-c80e757c6bb4	f
6769e5ef-51ad-41fa-b763-6215030eb3d8	e0834747-8b1d-4dcd-9520-019d711c62d2	f
ed111216-43bb-40d4-81b7-c440a110de24	a4a1104a-493f-4d45-b0cb-94ad21ba9d00	t
ed111216-43bb-40d4-81b7-c440a110de24	bdc45480-3be7-4f92-882e-34dabb5837b3	t
ed111216-43bb-40d4-81b7-c440a110de24	48bac497-bb5d-4dc4-8827-632ecc31a9c4	t
ed111216-43bb-40d4-81b7-c440a110de24	259a8e29-2ffd-472d-bb33-a06fbe28e7fb	t
ed111216-43bb-40d4-81b7-c440a110de24	c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	t
ed111216-43bb-40d4-81b7-c440a110de24	74f3cc11-8fac-42ac-8fac-b2ff721c34a4	t
ed111216-43bb-40d4-81b7-c440a110de24	f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	f
ed111216-43bb-40d4-81b7-c440a110de24	a6e4a039-7eda-42af-a1be-d97243616cb7	f
ed111216-43bb-40d4-81b7-c440a110de24	a9f81487-aae0-4844-8066-be931ab3dc08	f
ed111216-43bb-40d4-81b7-c440a110de24	e8e74038-29cf-48e9-ab55-c80e757c6bb4	f
ed111216-43bb-40d4-81b7-c440a110de24	e0834747-8b1d-4dcd-9520-019d711c62d2	f
2e20b15b-b26a-47e5-aac3-b328c53ffec5	a4a1104a-493f-4d45-b0cb-94ad21ba9d00	t
2e20b15b-b26a-47e5-aac3-b328c53ffec5	bdc45480-3be7-4f92-882e-34dabb5837b3	t
2e20b15b-b26a-47e5-aac3-b328c53ffec5	48bac497-bb5d-4dc4-8827-632ecc31a9c4	t
2e20b15b-b26a-47e5-aac3-b328c53ffec5	259a8e29-2ffd-472d-bb33-a06fbe28e7fb	t
2e20b15b-b26a-47e5-aac3-b328c53ffec5	c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	t
2e20b15b-b26a-47e5-aac3-b328c53ffec5	74f3cc11-8fac-42ac-8fac-b2ff721c34a4	t
2e20b15b-b26a-47e5-aac3-b328c53ffec5	f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	f
2e20b15b-b26a-47e5-aac3-b328c53ffec5	a6e4a039-7eda-42af-a1be-d97243616cb7	f
2e20b15b-b26a-47e5-aac3-b328c53ffec5	a9f81487-aae0-4844-8066-be931ab3dc08	f
2e20b15b-b26a-47e5-aac3-b328c53ffec5	e8e74038-29cf-48e9-ab55-c80e757c6bb4	f
2e20b15b-b26a-47e5-aac3-b328c53ffec5	e0834747-8b1d-4dcd-9520-019d711c62d2	f
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	a4a1104a-493f-4d45-b0cb-94ad21ba9d00	t
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	bdc45480-3be7-4f92-882e-34dabb5837b3	t
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	48bac497-bb5d-4dc4-8827-632ecc31a9c4	t
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	259a8e29-2ffd-472d-bb33-a06fbe28e7fb	t
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	t
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	74f3cc11-8fac-42ac-8fac-b2ff721c34a4	t
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	f
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	a6e4a039-7eda-42af-a1be-d97243616cb7	f
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	a9f81487-aae0-4844-8066-be931ab3dc08	f
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	e8e74038-29cf-48e9-ab55-c80e757c6bb4	f
d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	e0834747-8b1d-4dcd-9520-019d711c62d2	f
3f42fb72-19bd-4838-8611-cc1b88b55c0b	a4a1104a-493f-4d45-b0cb-94ad21ba9d00	t
3f42fb72-19bd-4838-8611-cc1b88b55c0b	bdc45480-3be7-4f92-882e-34dabb5837b3	t
3f42fb72-19bd-4838-8611-cc1b88b55c0b	48bac497-bb5d-4dc4-8827-632ecc31a9c4	t
3f42fb72-19bd-4838-8611-cc1b88b55c0b	259a8e29-2ffd-472d-bb33-a06fbe28e7fb	t
3f42fb72-19bd-4838-8611-cc1b88b55c0b	c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	t
3f42fb72-19bd-4838-8611-cc1b88b55c0b	74f3cc11-8fac-42ac-8fac-b2ff721c34a4	t
3f42fb72-19bd-4838-8611-cc1b88b55c0b	f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	f
3f42fb72-19bd-4838-8611-cc1b88b55c0b	a6e4a039-7eda-42af-a1be-d97243616cb7	f
3f42fb72-19bd-4838-8611-cc1b88b55c0b	a9f81487-aae0-4844-8066-be931ab3dc08	f
3f42fb72-19bd-4838-8611-cc1b88b55c0b	e8e74038-29cf-48e9-ab55-c80e757c6bb4	f
3f42fb72-19bd-4838-8611-cc1b88b55c0b	e0834747-8b1d-4dcd-9520-019d711c62d2	f
874892be-6f1d-4646-a497-cf38baa87865	a4a1104a-493f-4d45-b0cb-94ad21ba9d00	t
874892be-6f1d-4646-a497-cf38baa87865	bdc45480-3be7-4f92-882e-34dabb5837b3	t
874892be-6f1d-4646-a497-cf38baa87865	48bac497-bb5d-4dc4-8827-632ecc31a9c4	t
874892be-6f1d-4646-a497-cf38baa87865	259a8e29-2ffd-472d-bb33-a06fbe28e7fb	t
874892be-6f1d-4646-a497-cf38baa87865	c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	t
874892be-6f1d-4646-a497-cf38baa87865	74f3cc11-8fac-42ac-8fac-b2ff721c34a4	t
874892be-6f1d-4646-a497-cf38baa87865	f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	f
874892be-6f1d-4646-a497-cf38baa87865	a6e4a039-7eda-42af-a1be-d97243616cb7	f
874892be-6f1d-4646-a497-cf38baa87865	a9f81487-aae0-4844-8066-be931ab3dc08	f
874892be-6f1d-4646-a497-cf38baa87865	e8e74038-29cf-48e9-ab55-c80e757c6bb4	f
874892be-6f1d-4646-a497-cf38baa87865	e0834747-8b1d-4dcd-9520-019d711c62d2	f
c200afa9-e84a-4df3-b313-5ccb1e69b28c	a4a1104a-493f-4d45-b0cb-94ad21ba9d00	t
c200afa9-e84a-4df3-b313-5ccb1e69b28c	bdc45480-3be7-4f92-882e-34dabb5837b3	t
c200afa9-e84a-4df3-b313-5ccb1e69b28c	48bac497-bb5d-4dc4-8827-632ecc31a9c4	t
c200afa9-e84a-4df3-b313-5ccb1e69b28c	259a8e29-2ffd-472d-bb33-a06fbe28e7fb	t
c200afa9-e84a-4df3-b313-5ccb1e69b28c	c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	t
c200afa9-e84a-4df3-b313-5ccb1e69b28c	74f3cc11-8fac-42ac-8fac-b2ff721c34a4	t
c200afa9-e84a-4df3-b313-5ccb1e69b28c	f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	f
c200afa9-e84a-4df3-b313-5ccb1e69b28c	a6e4a039-7eda-42af-a1be-d97243616cb7	f
c200afa9-e84a-4df3-b313-5ccb1e69b28c	a9f81487-aae0-4844-8066-be931ab3dc08	f
c200afa9-e84a-4df3-b313-5ccb1e69b28c	e8e74038-29cf-48e9-ab55-c80e757c6bb4	f
c200afa9-e84a-4df3-b313-5ccb1e69b28c	e0834747-8b1d-4dcd-9520-019d711c62d2	f
\.


--
-- Data for Name: client_scope_role_mapping; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.client_scope_role_mapping (scope_id, role_id) FROM stdin;
a1fbb06c-2b0c-46bb-bb68-93e343952c5e	f31952ff-06c4-462c-bab4-43968681c31e
e0834747-8b1d-4dcd-9520-019d711c62d2	0d629b72-2b47-43d9-9857-9b12778e64e7
\.


--
-- Data for Name: component; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.component (id, name, parent_id, provider_id, provider_type, realm_id, sub_type) FROM stdin;
b992aa6e-25ca-46e3-84ff-f036a44d4e38	Trusted Hosts	e4b40266-0967-452a-b1e2-26a574255a2d	trusted-hosts	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	e4b40266-0967-452a-b1e2-26a574255a2d	anonymous
bce34455-6034-43cb-96c3-9eb51e191b58	Consent Required	e4b40266-0967-452a-b1e2-26a574255a2d	consent-required	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	e4b40266-0967-452a-b1e2-26a574255a2d	anonymous
a61c2f1a-2fab-43eb-bc42-1d40122c666f	Full Scope Disabled	e4b40266-0967-452a-b1e2-26a574255a2d	scope	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	e4b40266-0967-452a-b1e2-26a574255a2d	anonymous
81b18c92-e9f8-49af-abc8-5804b8b89e7c	Max Clients Limit	e4b40266-0967-452a-b1e2-26a574255a2d	max-clients	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	e4b40266-0967-452a-b1e2-26a574255a2d	anonymous
b68d85ee-52a2-4ae0-840c-5a6b53a17210	Allowed Protocol Mapper Types	e4b40266-0967-452a-b1e2-26a574255a2d	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	e4b40266-0967-452a-b1e2-26a574255a2d	anonymous
d2a53d23-a208-4eee-ae91-83e0483b95ff	Allowed Client Scopes	e4b40266-0967-452a-b1e2-26a574255a2d	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	e4b40266-0967-452a-b1e2-26a574255a2d	anonymous
ef4aa55c-2113-4303-8bb4-c3ed27f78e3e	Allowed Protocol Mapper Types	e4b40266-0967-452a-b1e2-26a574255a2d	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	e4b40266-0967-452a-b1e2-26a574255a2d	authenticated
c56f8378-05e1-49c7-a162-40fb268019cc	Allowed Client Scopes	e4b40266-0967-452a-b1e2-26a574255a2d	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	e4b40266-0967-452a-b1e2-26a574255a2d	authenticated
541e45e3-4ee1-4ae8-bc6e-2f2dd71effae	rsa-generated	e4b40266-0967-452a-b1e2-26a574255a2d	rsa-generated	org.keycloak.keys.KeyProvider	e4b40266-0967-452a-b1e2-26a574255a2d	\N
40696b9d-f511-43d8-a00e-f88baaedfcf8	rsa-enc-generated	e4b40266-0967-452a-b1e2-26a574255a2d	rsa-enc-generated	org.keycloak.keys.KeyProvider	e4b40266-0967-452a-b1e2-26a574255a2d	\N
3ea461c7-79e6-4896-896d-f78740c4efa3	hmac-generated-hs512	e4b40266-0967-452a-b1e2-26a574255a2d	hmac-generated	org.keycloak.keys.KeyProvider	e4b40266-0967-452a-b1e2-26a574255a2d	\N
2c141218-7c5d-4987-92fd-364f1db9569d	aes-generated	e4b40266-0967-452a-b1e2-26a574255a2d	aes-generated	org.keycloak.keys.KeyProvider	e4b40266-0967-452a-b1e2-26a574255a2d	\N
13d0f245-06ab-4d73-87c0-45a7a162ffb3	\N	e4b40266-0967-452a-b1e2-26a574255a2d	declarative-user-profile	org.keycloak.userprofile.UserProfileProvider	e4b40266-0967-452a-b1e2-26a574255a2d	\N
e8653971-0cf1-4ea1-aff8-d6a92cb5a934	rsa-generated	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	rsa-generated	org.keycloak.keys.KeyProvider	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	\N
b84589e2-b8f2-485e-8836-04a7b87b602a	rsa-enc-generated	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	rsa-enc-generated	org.keycloak.keys.KeyProvider	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	\N
6451b4b7-e502-4733-b93f-e9eaa2c3a3e7	hmac-generated-hs512	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	hmac-generated	org.keycloak.keys.KeyProvider	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	\N
19dd2d57-0f00-46e9-ae38-a93960932f80	aes-generated	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	aes-generated	org.keycloak.keys.KeyProvider	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	\N
4258a928-cdf7-49a3-b2c4-f79b294a607d	Trusted Hosts	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	trusted-hosts	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	anonymous
365e45ab-af01-49e6-9d02-98d664c3e325	Consent Required	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	consent-required	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	anonymous
0733690f-0944-4a56-b979-f3b31b4fc6b5	Full Scope Disabled	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	scope	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	anonymous
961ae5f9-f36f-44f9-bc2a-c6a4a07be02a	Max Clients Limit	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	max-clients	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	anonymous
7d473d41-645d-4a5a-9a86-375983e063a2	Allowed Protocol Mapper Types	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	anonymous
0050a57b-1caa-4cf7-8643-f89ff725fd06	Allowed Client Scopes	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	anonymous
c8bf7f07-f913-4363-b309-ee70daec6b98	Allowed Protocol Mapper Types	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	authenticated
7623800d-8a84-4f48-92c5-481699031287	Allowed Client Scopes	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	authenticated
\.


--
-- Data for Name: component_config; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.component_config (id, component_id, name, value) FROM stdin;
4dd31019-2a40-48cf-b47b-223d72ca2bd8	b992aa6e-25ca-46e3-84ff-f036a44d4e38	client-uris-must-match	true
16db7673-e389-448b-b24e-3ea6ce054b1d	b992aa6e-25ca-46e3-84ff-f036a44d4e38	host-sending-registration-request-must-match	true
49263c28-15aa-40fc-a141-878f97ff368a	d2a53d23-a208-4eee-ae91-83e0483b95ff	allow-default-scopes	true
92497fde-3d7d-4e4a-b11f-7f9fb9ca996a	b68d85ee-52a2-4ae0-840c-5a6b53a17210	allowed-protocol-mapper-types	oidc-full-name-mapper
02793418-5a1d-4f78-b8da-97f2c27cde1c	b68d85ee-52a2-4ae0-840c-5a6b53a17210	allowed-protocol-mapper-types	saml-role-list-mapper
acc1131b-6ab1-4eeb-9cb9-7975a1123ea6	b68d85ee-52a2-4ae0-840c-5a6b53a17210	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
d9a13ff4-9c12-4787-9059-f3d67f5e6e23	b68d85ee-52a2-4ae0-840c-5a6b53a17210	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
5f2571e5-c713-46e1-a78b-b3b065e2b386	b68d85ee-52a2-4ae0-840c-5a6b53a17210	allowed-protocol-mapper-types	saml-user-attribute-mapper
02e8cba1-81a2-468b-8513-cfb009621580	b68d85ee-52a2-4ae0-840c-5a6b53a17210	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
04d61788-a694-4569-8ee9-1c83affccb60	b68d85ee-52a2-4ae0-840c-5a6b53a17210	allowed-protocol-mapper-types	oidc-address-mapper
3c8ec81a-0f8b-4dec-851c-07bae8da2cbd	b68d85ee-52a2-4ae0-840c-5a6b53a17210	allowed-protocol-mapper-types	saml-user-property-mapper
a39f7716-899e-4519-8237-2539cce83dc7	81b18c92-e9f8-49af-abc8-5804b8b89e7c	max-clients	200
2846b8a2-b35b-4e8c-9ff0-06f68384a8f8	ef4aa55c-2113-4303-8bb4-c3ed27f78e3e	allowed-protocol-mapper-types	oidc-address-mapper
7e226a81-423a-4f7a-b7a6-9822c6a54b93	ef4aa55c-2113-4303-8bb4-c3ed27f78e3e	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
8ad8b224-9196-446b-be08-0297c5647cc0	ef4aa55c-2113-4303-8bb4-c3ed27f78e3e	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
723d285d-5a44-4661-a971-4a964843271e	ef4aa55c-2113-4303-8bb4-c3ed27f78e3e	allowed-protocol-mapper-types	oidc-full-name-mapper
df6fe8e9-8c13-499e-8e0b-4bcd2e07f55a	ef4aa55c-2113-4303-8bb4-c3ed27f78e3e	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
e324a04d-866e-44c4-978d-1d64a1a0012e	ef4aa55c-2113-4303-8bb4-c3ed27f78e3e	allowed-protocol-mapper-types	saml-role-list-mapper
0bf4b324-bb17-4baa-a1cd-a71a6dc95d06	ef4aa55c-2113-4303-8bb4-c3ed27f78e3e	allowed-protocol-mapper-types	saml-user-property-mapper
4bf21144-bc4a-4c11-85c0-aa1dc1836c68	ef4aa55c-2113-4303-8bb4-c3ed27f78e3e	allowed-protocol-mapper-types	saml-user-attribute-mapper
c3128801-99f0-4d53-8ede-66d9796e539a	c56f8378-05e1-49c7-a162-40fb268019cc	allow-default-scopes	true
7de76d8e-1bf9-4874-ad9a-f523377f9451	40696b9d-f511-43d8-a00e-f88baaedfcf8	keyUse	ENC
e1114967-6874-4747-9f45-fab5d4c314d8	40696b9d-f511-43d8-a00e-f88baaedfcf8	certificate	MIICmzCCAYMCBgGdA93emzANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZtYXN0ZXIwHhcNMjYwMzE5MDIxMTA1WhcNMzYwMzE5MDIxMjQ1WjARMQ8wDQYDVQQDDAZtYXN0ZXIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDmgk2FwOfrMv2O+iI52nCWr6IjzRhnKUDQdZUOk2R+HGul5mMeTuvii117qNd8gFrdvieF/W9XUcm4EcRaa1UwPgz3t7j2pGMu8m9Bq9sqcZIKPXUD+9N/I4yOZXcLWwWPBGk/kKaaJ071hqvookP+60aTzlgtdijKP7QfPLhFdlcPXroThui1IRYA3ksry+uV+OcvVXf1enmqglD9RXZ4TowLT3ftnKf6ISZcMb49SbxIM9oNrW3XVf8xx/6GsUIV24A31LGkwLMH4YIBVS6HPYhuk5VP+BRVU+TClNsN+GJLJoy9z8K4L4xGWXExrOUW5IKDl761YHRdpT/kPVlLAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAKSGqwK87TjBz2PuHSMNoUUUQ1ZiGz1VQDh0AIBzSYsX8dA07fejJ9BMMV6ZbX0WDF3Ehwwg50eeEQs++NgmzcOVlJYBpPSUAv/xWalU/Eg6dKZJEkV14tEo4eg5Jw38mRyj3T5GdUDkAsCA+TgkraMlni/xorbD2CX3AZU3DlnupQny7S17xoqwc1mne5DUdLbNiHKHV07OGa9qaWtSI8wijxEOB/F1eHVkP9RqUg05kRC8WjCdCqxR2p2wIenoZNcbNIepUisvTh8pmXo3kRpDRPIeITyQDb/gEMNBmZeBBt1GkTWCOGq/mU/xxVae/MnVL7CsxX3FlUy99MVE98E=
b08a9152-2255-45bc-9237-e78614432867	40696b9d-f511-43d8-a00e-f88baaedfcf8	algorithm	RSA-OAEP
a22f2ac6-1d31-4f9b-98ba-fd4d8cd6c3c1	40696b9d-f511-43d8-a00e-f88baaedfcf8	priority	100
f1e7f74f-1137-4c63-99da-e53676ddfd2e	40696b9d-f511-43d8-a00e-f88baaedfcf8	privateKey	MIIEowIBAAKCAQEA5oJNhcDn6zL9jvoiOdpwlq+iI80YZylA0HWVDpNkfhxrpeZjHk7r4otde6jXfIBa3b4nhf1vV1HJuBHEWmtVMD4M97e49qRjLvJvQavbKnGSCj11A/vTfyOMjmV3C1sFjwRpP5CmmidO9Yar6KJD/utGk85YLXYoyj+0Hzy4RXZXD166E4botSEWAN5LK8vrlfjnL1V39Xp5qoJQ/UV2eE6MC0937Zyn+iEmXDG+PUm8SDPaDa1t11X/Mcf+hrFCFduAN9SxpMCzB+GCAVUuhz2IbpOVT/gUVVPkwpTbDfhiSyaMvc/CuC+MRllxMazlFuSCg5e+tWB0XaU/5D1ZSwIDAQABAoIBAFGk0GlyCJLtVhLItMux+5PbtH2ivKR5X5wWMYvel8b1MQmrPusyv+jXPO66QEy4N7b3jY8vUzrl3KFGJbpy7tLt/3DUEX7GfdzYgKCNisyPOk9HMkWNcf1DrZqYBKCwhhkAUnjxtpi+GIDtSMFWi+fkFHTwrpm3kr4D7zvrKUdsdVNAKFkCO+5ngKx0hVDwIqxeiuTtoyTjPQFbwssNaWTFEsoo1BlrHPlOgRVXRrv+5mcLUWaqgt7CbVbTTkYrsftxPdATAb+r/PclzTff+KePg6t9NR6WMvPzAwU7vZ3OBe5ti7T3s0WcjI7kkxg/t1AOeXZi9O+Hzf0R8GDkRlkCgYEA9liZ4B9jkq2/DNrHb8Dw8jrO8oI/fbnoQYGYLTrx+MaTCmouqYaq8cyx8Lnm/OdvELtNWPCRAvQ2JCJYoMJ8XcA1vRKvXYnrAxS0iKhiWU6aZGPCJpKDV+gZh7/SUZKzGAItmp0YuF/KFhv3wbQUgo0E7Th54AqJ3Z7gnJTU+wMCgYEA74rSBh2ZU1eEXeGr7Ui6Y5U84LnOkofzXCUXHMZJ5CiPUHj+deU2jvjOdATDCu0Ch0RhOwWh2I67E2hn+0glmszdErfSZsCKm+duz3Qe7LeZ+qK0WslDmRKzWi3jwEr5oyXm5Wf+VO7y7DzdLBZl1FP6r4PriZlM2mruETS48hkCgYEAtHPsq+9yWjTp+Tmd1DAKj/YiOCTO64MuLiYHWkKOk8SqW3uymL4sJJnkUslq+iFyC1iY7SizoO1RZ6C9OW2d+nLdKpYwXZ20yHn3UQ+/k1nv4M/unaC/k7pSUU1jfBuxE0otK9AeFpkciJuOHpeSWpuAW2D+be5qVSyXrjub1A8CgYBgt383QuouUU67jSuawdun65DJ95ulZEjpMnyTfKhG++1pg4DSXzrZHTJWe7m4hpuXvA86AnsncfGs02Hwfl/YkdDNBvVn0WPlsNr33h3CXBtKrDj/0vV9L6TEy3SCpoMG0X3ZsFRrPJNOuQBgFacFxOaZyTznsMLsCXKX9d6auQKBgGZ/tHE6gDfAtGs62V+l3fICO4Nk7XWSg4vRR/mWN2Gw4TM9b7+R6eNnGBHJyWhYHRZUAHLCN2Yc+B2iZa0BFaqVneywUm8LSegS+nlEopPU3bo07HW9TeuMyRYFiwGmWMcpjM91xzQDwc5GeCv82mAUzNCYwFNGliak1IatxyDE
f48c35a0-4fb1-4857-ab76-03374018d297	541e45e3-4ee1-4ae8-bc6e-2f2dd71effae	keyUse	SIG
149f25e4-4aac-4494-86ee-5b3fd39343ff	541e45e3-4ee1-4ae8-bc6e-2f2dd71effae	privateKey	MIIEogIBAAKCAQEAw554FoSsjfwBFIh7u5EFmmXB3M8jdLZDBhuLm1yd+5v9TeNJwRc8UVs1s6arxb2d1fYybX5oOZRPAJT0+lCZ5UpEN4UIKHUwl+JwR1+aFMEEVPO983lr70bLnsHVjVhMeL4I+Ao5JsjCm2RUmrYpSV3nSeE1UGH2+Pz+triZMCCv+Wia4G/cj6yg9DkiU7sGH7T370Hr4wgysm0pGrW5r7pYyO1OcZH4KiR3qpDytz5KHSIygiNEhZI2tuGjVBqRM1CQ17349t/pO+E9T630Z1fEC3vZ8lAIjJiFwzdY6gXqoaLD0tiwg2j9S82F3cNAQBCeMGiONAZMMSVnH92i1wIDAQABAoIBAAW3TLUDvXMMqQ9riYoKi8peLNMB7nxLkxvLlEG+7BLdFQLAoHgW8LlD3Aba2OwXRVRqNEEEz5DXJ5PRxnLGBikwCVxB8+ISwo+9myBKx9rRZQoCcUt7Ac9lFzAVY+MUcG+axfJRgigC98TIorw+lGhDaS28ee1WX3wZEGxQapGAZe2EzybYox8lr4TnKgrdMgsa5lMrxeCRk+pFL02HJ3mv/l7MWutBnwCOlfSTwpxziSwh8PUuHbMCIg3ehazKophd3dt43qwW1ZSaesr65BaoKtejn73jg7K9UZWRz1ruW4XlNGvHkaUzTiwzX8sH09EdSBALSg36VKCPo5lSgZECgYEA6IeWvILGGMiAQSeSSil9XxX+7BmJ+rNmhfKx6252iu/ag/AzDD0ldSNBNwwagJ7eQpZDGGfb/PpBKK0inPmygHsFkyJpi0GJAdd5Vwfe8cEQwxJjYrO9erw0qrv7O6FHST/+HVQTvJuZYqAiIfFgMrecycMNvdaQb7feovqo4v8CgYEA110iY48FEtAFprSho1tnX5yieKRggg0UtbnWCMX8eaHd88E8gI1iLw0Xlkl6ssTN90MUbcVhf0XTHljO/myLtOFns97w80L5XvqFqFMUg/rdD7Qv8VxZZL1nsGYYkK+Vh4wOe9pXrZ6xnBLMaRU145CYCKcxF5Ti/4NEVqpWuCkCgYB9vWxOjezvU+S+1tYtklgARhWuuHS7g62J+14osHgb0233cLk6AgqyWBkY2kuuh7oqibTIiskT+IOpqk4QUporDdtK4A3wxsR+oXU1EcWGN1+IDPZ/VjC9IO7d8H7/lMvGmXshguiVUhLUmUE715msc0uucvKIWHGMaAJVYXRYIwKBgFRQANuLLUhNKjk2dCVY7mJvFug2KhYf+uCeLV3n7MzNgvAf0YjeUPbsoDRU9fUwuRW5LDFBWccS1fEGgZr3ccZRjGDNwfTqXmhBmbvpMpnsx0iTmUVbix+2SvazMaDLLLYRLcZtF3BANXZNobrt89fwTqTsl3qM7kVr5YAsVaDpAoGAEhpYM4YOPIJmCv1ARn+c4AnK2CfP2p9kulTTGT/NYRKO8vTz25+ZRrAY1eZvPnZ7L32SehvRdlPJCVgImUbgl7mKb2gs/vGVDZqd4SHrAf8eZ0g4fSEycsCb+HwdWJSO2JECpgL4zTEu1SJC+yLPfjfwPL2MsC2jUViW9jja2Ng=
280acdcb-499b-4362-9512-150296cdf57e	541e45e3-4ee1-4ae8-bc6e-2f2dd71effae	priority	100
f5dadc96-ad56-4611-a3ab-11ee6b71e164	541e45e3-4ee1-4ae8-bc6e-2f2dd71effae	certificate	MIICmzCCAYMCBgGdA93dPzANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZtYXN0ZXIwHhcNMjYwMzE5MDIxMTA0WhcNMzYwMzE5MDIxMjQ0WjARMQ8wDQYDVQQDDAZtYXN0ZXIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDDnngWhKyN/AEUiHu7kQWaZcHczyN0tkMGG4ubXJ37m/1N40nBFzxRWzWzpqvFvZ3V9jJtfmg5lE8AlPT6UJnlSkQ3hQgodTCX4nBHX5oUwQRU873zeWvvRsuewdWNWEx4vgj4CjkmyMKbZFSatilJXedJ4TVQYfb4/P62uJkwIK/5aJrgb9yPrKD0OSJTuwYftPfvQevjCDKybSkatbmvuljI7U5xkfgqJHeqkPK3PkodIjKCI0SFkja24aNUGpEzUJDXvfj23+k74T1PrfRnV8QLe9nyUAiMmIXDN1jqBeqhosPS2LCDaP1LzYXdw0BAEJ4waI40BkwxJWcf3aLXAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAL0Pm9vbBOWts+b8LiIxFvdCMBNeo5+UND6foy/Sai0yQyndw/UB2+SovEM8TYgvRMm38L1PoSBghc3K+/bHQV8MJYRoYyEApNFr2YO5TmgkJe9qbsLSklq9TykB/n4VnBDBaR4b30NuyUHQOY4CiX5Iwm4kdDt283HoUqhRDMYnnjIkE+2k8fpKystuVWuVp4fUzibO2ksxuRqoyT0mKBhS+Vm6KuiNvg3l1DnfO4B8kpcxKxVGvIzWGOKKKAoImFBQUXvf62V/r1pNpT+JEejf5UE0vz9LLCobiDMI6mtoWCqYJL9LdrKiVS6vkfeNRpS60/uWmZI8c8sTI7PV3tM=
1ddf8034-d0da-41a0-a595-93d6c1a36c20	13d0f245-06ab-4d73-87c0-45a7a162ffb3	kc.user.profile.config	{"attributes":[{"name":"username","displayName":"${username}","validations":{"length":{"min":3,"max":255},"username-prohibited-characters":{},"up-username-not-idn-homograph":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"email","displayName":"${email}","validations":{"email":{},"length":{"max":255}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"firstName","displayName":"${firstName}","validations":{"length":{"max":255},"person-name-prohibited-characters":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"lastName","displayName":"${lastName}","validations":{"length":{"max":255},"person-name-prohibited-characters":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false}],"groups":[{"name":"user-metadata","displayHeader":"User metadata","displayDescription":"Attributes, which refer to user metadata"}]}
46401339-de41-4829-a0c8-5582319058c4	3ea461c7-79e6-4896-896d-f78740c4efa3	kid	13ebd88a-334e-4b6f-a5f5-f26e97e44171
4f9e6f86-5a6b-40af-9515-57d85801a03f	3ea461c7-79e6-4896-896d-f78740c4efa3	algorithm	HS512
53d498ad-edc1-4534-8a38-1347e1464cc5	3ea461c7-79e6-4896-896d-f78740c4efa3	secret	LNXq_DPv5N_8W9oNAQuEX6R0E_JRv0edYuldOyUgjbCvO5JuyVKFnKmO8mV0lNiZ5E3N2ULchzC4zmtYnPGOuz0y8eVtUjIRVIfyEUgTup8aFSBXDGfNfaRMOblZcryScNp9gsbPJ5zOTk0FgXyQdlyq7_mvp0T8dJRUmQPIAwE
6f4234a2-978b-4dc4-9f3d-1dd14a8c0eba	3ea461c7-79e6-4896-896d-f78740c4efa3	priority	100
399fb7f1-a736-479d-a03e-c0fda163fb3e	2c141218-7c5d-4987-92fd-364f1db9569d	kid	1e4e94b6-1870-4a05-8ff0-a7e4c638e7d7
d9c76389-b1d7-4433-95be-74d78bbe53c2	2c141218-7c5d-4987-92fd-364f1db9569d	secret	obowg9t0t6BNWSE2c6ahjw
03fb1204-f759-4243-a3a4-4f33d01da787	2c141218-7c5d-4987-92fd-364f1db9569d	priority	100
21bcbf10-aeeb-4cf7-bb0f-e1f4dd8abab8	e8653971-0cf1-4ea1-aff8-d6a92cb5a934	privateKey	MIIEpAIBAAKCAQEAifGtNpw1svqTuTG1+E9dNo3zsgaW+1IxPNQhU92vnRK0Wr3h4oapl/dLsMkeQaferuy4LK5Mx2G2i1p47xbpCY7WyirnEZ4nhb7wRhN9rI6e8FixEYCQSWTYNw9+fbKcSXZewdrlv9rhIE++Cqe4+DUXr78jMwcbQi/+bOUfWYGCD8+5MTWP5fquOPvWsAtS3Ip2/5ckN7v8HHFWsD0V2VDACQy+wnd3i7ZmCiifPYptwBf08zvpJcp8caOyBxgXdk62+00gJO+MxKH6uvmKmwl35JEObiiJyBIiCahm+M8FjMzQO5JF8NES0/+OFd2jfthmefPVs3lW59SqFxasEQIDAQABAoIBAAcVpOEHjswvrhW2ZbyM3utl7YpK+llBIh1hOWWI1ZhBJ4b7P5GooAKZl4cmZkVEGyb+KjkNzp7QilVjS/1MrFnYUOZI48ss18qB+BKMtW3IC6qFPLrWGe5kL6TekiGEhvl1L5KryBSmjG9iP+qJmvGjUGqKtTmo96Hacyn9bnwI94yWBRX7/ZdgN7pcKwCAEe0O7ODT9hFXpqfOpxqdJUaZ5yNGdic0IhwKP3W+KmfypjhTjMWLyVJo6I+92tf7GfN3jwZ7PwSaw8wNNPUVDZ6buKWecq9E5gswwb8kppby5i/IEc7tYUf9UkHPHYZd4LTwzYHM8r8VErrLWtSI2o0CgYEAwr6Dzradmb5/BHxYlWL9rujDQCyHU0iOCW8EWO0ehBdUEVgQauPPq+jqzMYAq71b+VtGRSWTOrLHCTYNDptFxVIdO22Q2ZbytbIely8RziboCVoM+NEd//x39KiApPWZsTMAs8PICzW9QU4oIZ3NtJrMaT+mHztwC0R18M5pi5MCgYEAtVVqKyC1hqh4VI/6WK/WDZvP7twf+Fd/e3AqMow9r3jhvsI0iM9NdVRikXRnvday03qZmlY8+MaHfSLTu8h22aIgzKOhXhFgvSD5jK7FgtPW/sOxguiODRjZSdJoaqF4JwBHh7AlOOYlQqpSKqcyyKiKquXo7VN3WANZQSG3GEsCgYEAhOXmpUbSPn1VyQXine+0F40Y0c6RezBkXeO5H8aRsKsK39stOQTGUBbfRWdKRekvvvee+MkvtDsUwSB1wKYN8x6afFfFJfhxIbWwUpP4nqrGZrthZtuukWcFpZzoTaqde+PGcucEuUGvKcXgdTBvlPSe0qRxBZdWWxoZMoBqXqkCgYEArXkRIEEiZ7gzpXI3pTBSLqKowXGEhCfwpT4goErZmEykacGQUHFBQMWBpnUd6dbDLN1UpPlrSvNiGqx+sl6MlJctmZfQgBVP3p71HUj1WrseKos7/mhLvOvQs3a+vYPLVkRGKeCxO0Wwz53xDSz2wE+8mNFpi+EVgvVxJYYDixECgYAcdlxjmZJdoeAcY3K5QpiMUvlh9m7WG0iwNmP7c1HL6PnkQF5jIzVHbWk4lHP5W49fgdpzGG6Baoi70AjVPwxiZjrc2qahfSaM9lpE3YbR9hH1MKTDlsTDUAHp17fMwKZ+0zZBBCQaUiWKWAur9GiKgzBdJhw9DW3VDDt5eG2nzw==
13ad9f12-d4b9-4dd1-a907-4bee6137720c	e8653971-0cf1-4ea1-aff8-d6a92cb5a934	priority	100
6172a2a2-fd95-41e7-84d5-cf814efed24f	e8653971-0cf1-4ea1-aff8-d6a92cb5a934	keyUse	SIG
ae75a1f6-b145-4387-a39e-0747f3009816	e8653971-0cf1-4ea1-aff8-d6a92cb5a934	certificate	MIIClTCCAX0CBgGdA93knDANBgkqhkiG9w0BAQsFADAOMQwwCgYDVQQDDANhcHAwHhcNMjYwMzE5MDIxMTA2WhcNMzYwMzE5MDIxMjQ2WjAOMQwwCgYDVQQDDANhcHAwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCJ8a02nDWy+pO5MbX4T102jfOyBpb7UjE81CFT3a+dErRaveHihqmX90uwyR5Bp96u7LgsrkzHYbaLWnjvFukJjtbKKucRnieFvvBGE32sjp7wWLERgJBJZNg3D359spxJdl7B2uW/2uEgT74Kp7j4NRevvyMzBxtCL/5s5R9ZgYIPz7kxNY/l+q44+9awC1Lcinb/lyQ3u/wccVawPRXZUMAJDL7Cd3eLtmYKKJ89im3AF/TzO+klynxxo7IHGBd2Trb7TSAk74zEofq6+YqbCXfkkQ5uKInIEiIJqGb4zwWMzNA7kkXw0RLT/44V3aN+2GZ589WzeVbn1KoXFqwRAgMBAAEwDQYJKoZIhvcNAQELBQADggEBADHMKzYwZvcBo79eMAN8P55J1btHNosDuzkZr9Tfey4zX0O/0pQeejPEO4BMoW95U8cp7bLXsizL85Ht3s0oQd7SwvhC//JyoHjWjBokTcZQB4CmZ4Gf8NEfEY/GE8Iz6UYwIJU2QYKWGbUCpfdqwLSu31AyB7++XmYfbG8aelnMVvO9eZTywmcEhKUh81/ojTmZcmAUy6P4BY0RDT6teyNZ+e63NpQZp1mHDYs9c+zHTSIGS/PNpsVsSX4X4/g8YuJBIG8MH3tOtx3IKYPt3JBsjbUKJz7DKWSp4+mbhQEe/ugt7JfQ5xlxyLwdbOhOVlcaPGbYb7loCni8ab2ScN0=
355b490c-3d23-4238-bd47-86e9e377a0ea	6451b4b7-e502-4733-b93f-e9eaa2c3a3e7	kid	f1528813-e46f-42aa-a6bb-dcbad45a3334
a6d646f7-9fd8-41e4-94de-0827e222a8e0	6451b4b7-e502-4733-b93f-e9eaa2c3a3e7	secret	HgfvO5zKbjffwwwgAWJyEOJ6p15qJbTrGmWdyXSC3YJ1rgMkqBlUaPTOkrUrjq1xuyzTITVDPaPT3_qqc7AKo0HKsOeQRTjBsGClvEMBGSvLlnvBXhBcMfhJtk3RUpKfOCaWzp9Hv8WNfoUpD3YFmpuAlZWirNSbq8SAnvMnEhk
8cdbc1bb-bb88-46f0-a9c2-7091abf830fd	6451b4b7-e502-4733-b93f-e9eaa2c3a3e7	algorithm	HS512
6b16d588-25c1-427e-97c6-e8f2de7f11a6	6451b4b7-e502-4733-b93f-e9eaa2c3a3e7	priority	100
1b000857-5346-4e2c-99ea-59756f26c6c5	19dd2d57-0f00-46e9-ae38-a93960932f80	secret	RCX5yOzQJNpb7xb12QIDXg
3eb18e29-0948-47be-8f95-58034dec6413	19dd2d57-0f00-46e9-ae38-a93960932f80	kid	bb40638e-6953-4e42-8e9b-e0079afb3dad
c3238435-2e87-40f1-b6e5-8e73266c3e38	19dd2d57-0f00-46e9-ae38-a93960932f80	priority	100
ecc5e67a-64d9-4124-b7a0-c4692ebe5141	b84589e2-b8f2-485e-8836-04a7b87b602a	keyUse	ENC
7cfb195b-f0aa-4cd8-a5bf-944ef48e5c05	b84589e2-b8f2-485e-8836-04a7b87b602a	priority	100
6ce06614-c57d-499b-9890-a27bb39a3621	b84589e2-b8f2-485e-8836-04a7b87b602a	certificate	MIIClTCCAX0CBgGdA93lwDANBgkqhkiG9w0BAQsFADAOMQwwCgYDVQQDDANhcHAwHhcNMjYwMzE5MDIxMTA3WhcNMzYwMzE5MDIxMjQ3WjAOMQwwCgYDVQQDDANhcHAwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCxJZxeS1bMLeyf+9NSjhHFXOLD/nXJw1R6rC8U8k42LZAS5k3zEzU/gfJHuUPmY32BlHCqepGOFqRNqVl2lG6iEMJQvzG/uLT7+bfzdMh+w20/P1YmIpISIptSU6d6JV5GIP9BFcS1jk/BmWLPJs7762iielIcMgn/M3ZGsAQdRCJTJc/Dg3m5PvXzX/Am6XiND8tUPPsungXliJVjAW/5f+XmekoY7rzpA+FB5Q7D3nJHEqnUy9XhTyOpOHSlGsQJwP9UVBUY4t/3GfgkHrsI4yf4o1q6juFVLnxtwF8b7Kjb6fBOnME4kQ+dpyypBL9HEjOaNxSR2ajK5FTEoyoHAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAJHAWmc0Dc8PbRiq5C2RK/Kjb59gfqipm/4sqMspKDdEqArjkjCDh1JBnF+29Hw2RzF8jDv1Dm/WwAeSJPoH0cW3G1hdYsZW1BFLzx/O3btuf5MfdwFxmjMz0LEtLa7m2vwQzuPUsqApg2+ILPNtCxrqkgVPKgHPBSsDTgSNu2QmWB794DBYTMGDANtSLmHmVWdbaMKcjsJ8xzTZ8RzYqhURaFrYHU+SrNnAkbZ2lQUXE6fFoh2WiI4ius08/XR1xbANiCxs1A6T4AYN1cNpSDS9rGawpHwQtoQPNEGECnT6rQ+VDul0jmOcc98poyTXzRNQfYSEvYQC/lbwVHEtALo=
bf9ed26b-dcb6-4bab-991c-522670f0f9bc	b84589e2-b8f2-485e-8836-04a7b87b602a	privateKey	MIIEowIBAAKCAQEAsSWcXktWzC3sn/vTUo4RxVziw/51ycNUeqwvFPJONi2QEuZN8xM1P4HyR7lD5mN9gZRwqnqRjhakTalZdpRuohDCUL8xv7i0+/m383TIfsNtPz9WJiKSEiKbUlOneiVeRiD/QRXEtY5PwZlizybO++toonpSHDIJ/zN2RrAEHUQiUyXPw4N5uT7181/wJul4jQ/LVDz7Lp4F5YiVYwFv+X/l5npKGO686QPhQeUOw95yRxKp1MvV4U8jqTh0pRrECcD/VFQVGOLf9xn4JB67COMn+KNauo7hVS58bcBfG+yo2+nwTpzBOJEPnacsqQS/RxIzmjcUkdmoyuRUxKMqBwIDAQABAoIBAAWPEur8z1qVIJGrUFnF2RYGTSqDVgFZnph7VEytMd2Oeum0Bt+62ZN4Rhxl2nidj0xZyD36LKrodInoPOGuDaB8iQjtMa881AkYMHGtc+9uaIONd8/TNaw9IDdN7WRDv0N745h0CaTD+3ufOZeM/P4GHeQfzk61T0bG+L/3x5lFra505pbvK4fa+Sf+vaXxIbYTRNITYj142wjt9TQBph6TeybeSu+uSebiENeGJAVyiQEvlMgyMEwfcqvmuXB1JpkNGpw1fsmfLzi7r8cJRmVuHBycVeBdqKiZZlIkwqzeeAy7jxxah0pI8bIWApeIAht5TcF4Dx4CdOIFHELSt7kCgYEA4+ihbqJ6teUFV1eXjOCDCJHhz5Bie2+4D2y5oVMI6d3n9bmOCMQB5gB+h6qSgLz6BO2NPHV2pKAUWFcivtSxbdP+ai6P626eaYDEc25fqa1LeYY3qqboMl+dBDv9Q6Y0HquNjBzyNQxP8nRWXgTYPNJXqFbB2F0AuMdhVf2NBa0CgYEAxvtBn+3R5PcV/TsoWdcWTTm59BLU1Jb/WVJqBmu0C1CaQRJW507vmjIs8rYHmvR4GdgyUfID7bTViNw1U8U3wlgZLgoFkgw5Cz1qqG2/uCf7IPnFg/qXd1cD1cb2RvomTL1naBdngtGP8JgD1e6beuZFvUcFkqRvPWGFyCOlnQMCgYB+QLOVBzs1Im7ICMTyjLjp+W5/Pnvf526uVMusm8QXUg+apzUQlAx9Lo7pdst7t7RFIJeaA3Q7FFbQ7UxZLJgxwDty9OJTSM9GoMezLlSeOVrTMlAKIDYHGcJwww60+BBtYRmjobFnQ6/SHzJtGP/1CYz3uz/dLQAmXIUGTtRdbQKBgQCU312NE3jLrxXznbQl62fTJZJ8Cy7TU5n+sUuEPEa7hHW0o80DSKq5mjrI6OotxCSraXbUmpbX3Uk6GU+IunBqZlGIgZUDXUO8phnLpDkhxj/8vwNJKE70ydSjuDWAix3monrghUo7tSDVaFbOU7ReMjURVTbVLVPQ/8sBH7KEEwKBgH+92otd2KWCVO7ERFsl8qcVTKd0BkMR+EQkgN/FlCv0DgkWBilYI+/gUp7rtVjhCj6wb/8wziiYPXlAREtHxXIIrRtj3uhBJ2wrrx7v4Y1x+ZN5hmwHIQJDqJ4EnkQNJ6R+d6C2QBWofEJtoAiOhbasuEkaI0t80hWZpJn2M/I7
290ebafe-81e5-4371-ae80-da320bed1d97	b84589e2-b8f2-485e-8836-04a7b87b602a	algorithm	RSA-OAEP
43a95f09-f2c8-4da7-81c3-c194ab9bffe5	7d473d41-645d-4a5a-9a86-375983e063a2	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
2defa6b8-829d-44fe-a42a-28e5422d2997	7d473d41-645d-4a5a-9a86-375983e063a2	allowed-protocol-mapper-types	saml-user-property-mapper
5f798674-ef80-4566-933d-365e1a1f6b95	7d473d41-645d-4a5a-9a86-375983e063a2	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
5fe16e84-00b1-4f49-9c39-7ac13b0b232a	7d473d41-645d-4a5a-9a86-375983e063a2	allowed-protocol-mapper-types	saml-role-list-mapper
a17a8009-3f4f-4211-b35f-487104a1573a	7d473d41-645d-4a5a-9a86-375983e063a2	allowed-protocol-mapper-types	oidc-address-mapper
d2756a0f-0568-40f9-be8c-d1bfab92e26c	7d473d41-645d-4a5a-9a86-375983e063a2	allowed-protocol-mapper-types	oidc-full-name-mapper
7d8e0ef3-8403-4bb1-9f2b-547c39e1cc0f	7d473d41-645d-4a5a-9a86-375983e063a2	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
502e6f83-3b9d-490e-85c3-289841feaa6a	7d473d41-645d-4a5a-9a86-375983e063a2	allowed-protocol-mapper-types	saml-user-attribute-mapper
469da28c-673d-46be-a202-81e0c29ab973	0050a57b-1caa-4cf7-8643-f89ff725fd06	allow-default-scopes	true
7cdcd88c-6133-4079-ae3c-94a3dafc8430	c8bf7f07-f913-4363-b309-ee70daec6b98	allowed-protocol-mapper-types	oidc-full-name-mapper
36d1297b-5a09-4151-bced-9e56fa39a6e6	c8bf7f07-f913-4363-b309-ee70daec6b98	allowed-protocol-mapper-types	saml-user-property-mapper
93ea52da-6e8d-4db4-b76f-44f5bc479861	c8bf7f07-f913-4363-b309-ee70daec6b98	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
9b22988d-f50e-4a8f-8940-7002238886ec	c8bf7f07-f913-4363-b309-ee70daec6b98	allowed-protocol-mapper-types	saml-user-attribute-mapper
092b44c9-67f9-4a81-8f16-f3cf68fb6aa4	c8bf7f07-f913-4363-b309-ee70daec6b98	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
0d8be1cf-003a-4e96-88fb-ca3b3f80a650	c8bf7f07-f913-4363-b309-ee70daec6b98	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
92f106c7-4f80-43d6-8f02-27c36b0c5212	c8bf7f07-f913-4363-b309-ee70daec6b98	allowed-protocol-mapper-types	saml-role-list-mapper
aa53283a-76bf-45d4-b572-5856546dd20e	c8bf7f07-f913-4363-b309-ee70daec6b98	allowed-protocol-mapper-types	oidc-address-mapper
54b6680e-c0f4-4894-b19f-9d4994e0e1b5	4258a928-cdf7-49a3-b2c4-f79b294a607d	client-uris-must-match	true
ec9b0cb5-58bf-4881-b8da-2c269a3e3933	4258a928-cdf7-49a3-b2c4-f79b294a607d	host-sending-registration-request-must-match	true
4184192f-8f2d-4c14-a52d-4c81bf76c7c8	961ae5f9-f36f-44f9-bc2a-c6a4a07be02a	max-clients	200
13236579-40a7-4393-b375-4c54bbcff1ad	7623800d-8a84-4f48-92c5-481699031287	allow-default-scopes	true
\.


--
-- Data for Name: composite_role; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.composite_role (composite, child_role) FROM stdin;
d1ee855c-d858-4e55-825e-c68258acd3ac	30468660-4849-4ec2-b2d8-63dd45a55894
d1ee855c-d858-4e55-825e-c68258acd3ac	b9632c80-81c2-4d18-bcbf-f1f00c9e2e28
d1ee855c-d858-4e55-825e-c68258acd3ac	5be0cf09-6b0c-4ce2-a19a-9c56ac992d7f
d1ee855c-d858-4e55-825e-c68258acd3ac	93eb67f4-d49f-43a5-a2d5-dcf759ca16bb
d1ee855c-d858-4e55-825e-c68258acd3ac	5864c705-c675-46f9-95f5-0e836cb1a1f0
d1ee855c-d858-4e55-825e-c68258acd3ac	7e51bfc3-3214-423a-85b6-bd6a6e0a30ba
d1ee855c-d858-4e55-825e-c68258acd3ac	a0eab88d-0f04-4dec-b56f-a8f7f9a98dfb
d1ee855c-d858-4e55-825e-c68258acd3ac	30b7dac7-c258-4b2c-a050-c16e2067db8d
d1ee855c-d858-4e55-825e-c68258acd3ac	28fef8be-f0cd-4dcc-bd33-7d803b37a1ba
d1ee855c-d858-4e55-825e-c68258acd3ac	4217a257-0df7-45e8-ab2d-4b4c9616482c
d1ee855c-d858-4e55-825e-c68258acd3ac	8a0f0ad8-c230-4d1b-92f2-5681b853bd79
d1ee855c-d858-4e55-825e-c68258acd3ac	84508d44-73f9-458a-978b-13c77ede2d53
d1ee855c-d858-4e55-825e-c68258acd3ac	19233ad4-9bed-4ed6-a9e0-ead652b85be1
d1ee855c-d858-4e55-825e-c68258acd3ac	aec42a37-7e4b-45ff-94cb-2c3ba2fea095
d1ee855c-d858-4e55-825e-c68258acd3ac	b9e02377-7a67-4f27-ad55-f7c883804612
d1ee855c-d858-4e55-825e-c68258acd3ac	8fc3add6-0724-437b-9832-db4a402aa1ce
d1ee855c-d858-4e55-825e-c68258acd3ac	6949867b-3e3c-4d9b-bfd3-c6c09b49a8bf
d1ee855c-d858-4e55-825e-c68258acd3ac	66531030-20c5-4d81-bab4-9d557de3721a
3bef6e98-1dfb-4e70-90d6-9f8de5436ca3	138cd119-5b1d-4550-939f-c2288a083410
5864c705-c675-46f9-95f5-0e836cb1a1f0	8fc3add6-0724-437b-9832-db4a402aa1ce
93eb67f4-d49f-43a5-a2d5-dcf759ca16bb	66531030-20c5-4d81-bab4-9d557de3721a
93eb67f4-d49f-43a5-a2d5-dcf759ca16bb	b9e02377-7a67-4f27-ad55-f7c883804612
3bef6e98-1dfb-4e70-90d6-9f8de5436ca3	28f280d1-aab5-4d39-89c0-956e65f3980f
28f280d1-aab5-4d39-89c0-956e65f3980f	39941995-9f43-4dfc-b7aa-a14297bd523d
3e216513-20f4-4531-90c9-effdacf4f4fd	64935e98-78c8-4b48-98f7-d2f13fb8dbcb
d1ee855c-d858-4e55-825e-c68258acd3ac	26fb05e9-f6b3-4d29-9762-254b5e11e956
3bef6e98-1dfb-4e70-90d6-9f8de5436ca3	f31952ff-06c4-462c-bab4-43968681c31e
3bef6e98-1dfb-4e70-90d6-9f8de5436ca3	bdb6d242-b780-4d23-80b8-2a81034db078
d1ee855c-d858-4e55-825e-c68258acd3ac	b492bc3c-d922-42c6-88a8-6cbe9c249857
d1ee855c-d858-4e55-825e-c68258acd3ac	664cfab9-94e2-4ab4-8d55-3b6f2a717202
d1ee855c-d858-4e55-825e-c68258acd3ac	d8465b4a-d6d3-4afb-980d-f1fde809f8fe
d1ee855c-d858-4e55-825e-c68258acd3ac	c0301d9f-3955-4634-bf63-38f06fd99275
d1ee855c-d858-4e55-825e-c68258acd3ac	cbca8d8d-9867-46a5-b9a3-04b7fcf9c425
d1ee855c-d858-4e55-825e-c68258acd3ac	95876004-d9c1-43d9-b302-069e55a8fdc3
d1ee855c-d858-4e55-825e-c68258acd3ac	0df01eb3-5a74-4114-9bba-47c2e18eb609
d1ee855c-d858-4e55-825e-c68258acd3ac	9bc89631-4cc0-4440-b314-5829086be40d
d1ee855c-d858-4e55-825e-c68258acd3ac	e5b47c0f-34e3-48d5-9028-146bbbf56118
d1ee855c-d858-4e55-825e-c68258acd3ac	e000a62e-a11e-4383-aae2-91728bc89101
d1ee855c-d858-4e55-825e-c68258acd3ac	bbfe2fd2-db4a-4f47-9a2b-d8489d101827
d1ee855c-d858-4e55-825e-c68258acd3ac	840fc47b-17eb-463a-8156-7ae497b020e2
d1ee855c-d858-4e55-825e-c68258acd3ac	f1725ff7-772d-4027-9a02-51d5957c2785
d1ee855c-d858-4e55-825e-c68258acd3ac	1691e82c-5ae4-4614-ab35-6c25b2ba4898
d1ee855c-d858-4e55-825e-c68258acd3ac	4672b086-f57b-4a89-866b-a2aba4bba5b6
d1ee855c-d858-4e55-825e-c68258acd3ac	7e7bd523-289e-4c67-89e8-2fc68d807bfe
d1ee855c-d858-4e55-825e-c68258acd3ac	b4c91ef0-ddbf-4258-80a8-f5223913d558
c0301d9f-3955-4634-bf63-38f06fd99275	4672b086-f57b-4a89-866b-a2aba4bba5b6
d8465b4a-d6d3-4afb-980d-f1fde809f8fe	b4c91ef0-ddbf-4258-80a8-f5223913d558
d8465b4a-d6d3-4afb-980d-f1fde809f8fe	1691e82c-5ae4-4614-ab35-6c25b2ba4898
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	19aef740-e582-40bf-951f-940a2a28c776
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	a0b2d4e1-a9bf-4bb5-9038-68001c9222ed
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	42e21786-3d7e-4f81-b361-f3ea7e0d9c20
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	6b02f1d9-573f-4e0d-a2fb-fc7ebf3b57c8
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	a1ff1334-ea1d-4824-b1c7-7f588f83be26
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	f78cffd1-9fcd-46c5-9099-9893a5fd8072
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	cfe216a3-1735-45fe-b6c1-fc70cf2aa25c
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	f7ff8697-e7ce-451b-8f52-36269e60337e
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	6148e890-2291-4c83-93b3-fd5904d26eee
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	6d1130f6-ac68-49ca-a8b3-9a849c3fd521
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	b21ececa-ee62-4156-8612-1969e75d1ac7
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	5f0b7594-3221-4677-9ad5-a7fe33364e5b
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	3ad01935-8c07-4a06-ab22-2e914a732c48
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	5365d2aa-b1d0-49ec-b824-159158a1fa32
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	29785926-d0a3-4e0b-a8e4-e7cf97c9c4ba
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	328b6957-40f1-4470-985f-4bc814474b1d
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	e7d41091-eee0-413c-b09a-8d28a781fdb6
42e21786-3d7e-4f81-b361-f3ea7e0d9c20	5365d2aa-b1d0-49ec-b824-159158a1fa32
42e21786-3d7e-4f81-b361-f3ea7e0d9c20	e7d41091-eee0-413c-b09a-8d28a781fdb6
6b02f1d9-573f-4e0d-a2fb-fc7ebf3b57c8	29785926-d0a3-4e0b-a8e4-e7cf97c9c4ba
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	f0e3d488-d671-4550-852e-7a9c18987694
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	09ffc33c-f53a-4f6a-95df-3376bce8eef1
09ffc33c-f53a-4f6a-95df-3376bce8eef1	cb8f0bd9-764b-4b6f-985a-7b8b5ac9213c
2d5f73cd-c5ba-4e48-9c16-4f8cce6e0fa9	a99ada8a-212f-4fd0-8db5-568d9fb0e8e7
d1ee855c-d858-4e55-825e-c68258acd3ac	8c454b60-7af5-49be-8157-16e9e9a94b1d
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	af6aeab8-b8db-4e83-8954-78095dff9f7f
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	0d629b72-2b47-43d9-9857-9b12778e64e7
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	3f450a30-33b2-469c-aec2-a0db9d9ac72a
\.


--
-- Data for Name: credential; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.credential (id, salt, type, user_id, created_date, user_label, secret_data, credential_data, priority) FROM stdin;
635f125c-5e89-47c8-99b5-66a6c9badcb3	\N	password	198ab9f4-5762-4075-b97f-61745bd4ece8	1773886367478	\N	{"value":"cSznKBcNrBNJPpsj/3A+gLg75I51ReWoKPTByYIg7ak=","salt":"vw1UuH2O1eDdxCYbIEOBwg==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
7045dc9e-e87a-443e-bbfa-79b425aa7c35	\N	password	f6f67297-f72f-4281-97f4-a2d19a62da65	1773909853471	\N	{"value":"k1TWAc5d56vY1SVnc+UBuEOcvqzyBZ2PJqJkouBQvdo=","salt":"cmEj0lnMrAEejnaeAytxWg==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
d21b6028-c4cb-45bd-9400-bf6b6f65a953	\N	password	c4754cc1-baf9-4132-97ff-e7fed6652069	1773971737730	\N	{"value":"QByLkvVR7Ozeb73y7Bhvo765ypneIMtBAewBXwg/rFI=","salt":"z7E56BVuUST0wzcdh46E7Q==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
7069f669-061e-4b94-9a8a-9fbf9d0d177b	\N	password	0eab09e2-2bea-4bf5-bb63-9574a08edbe9	1773976949305	\N	{"value":"tAdxYvK488l5vp7M3A/C8lm5pvgQ1Q7H7Ah5orkPezo=","salt":"GKP7w/YRhJ9VMhebTZddzw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
8371716f-261e-4d49-a315-e711e7d915b5	\N	password	d634c0f9-747d-44f6-9e35-ed34fb15005d	1773977036730	\N	{"value":"nxIDkCDik76ub0Gw5D7aBu+1abMbLY6uvjIbSryDPp8=","salt":"fMTgo1RCb+skBM6wums6fQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
f8904663-8e76-45d7-a0e0-4c429d8ad226	\N	password	ae05df72-09fd-4f97-b1ee-3549662a97ba	1773977084782	\N	{"value":"SB0mZL9ha8k2Des8A8a2+Qe6x2dIz84tN3IsUzlzfsc=","salt":"xTZhBVlznBJMw+lPUWlrJg==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
f5c55943-d154-4a00-abc0-7e66cc9cd7c9	\N	password	8d80f9cf-b8f0-48d0-b20c-d8b9dea86542	1773977102652	\N	{"value":"apZNrTHYqMa5yJDa9xWemR/BFC0h3BiPiyNWGTHYJl0=","salt":"TyN6DDR0SllPk4IhWoT6zQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
a178fc5d-42f6-43f1-852b-4ca06bd08f66	\N	password	7426d1d8-56ae-45b7-9acc-1b6003094c0a	1773977497184	\N	{"value":"dMwL5EmNcxLUHxD++/JDNQtL71Km/zFrcvufGClTX2M=","salt":"FfsYOYOiPn2TY0gx0HT2tA==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
65231506-9e8c-44c5-9b16-8e4448cbcfb4	\N	password	df0c4640-e891-4a1c-a1f6-12eb36d4cef2	1773977548008	\N	{"value":"/Cw1s3ojD3b0xtbu5xuMNdhFM/3W6VKuys9qs41sabY=","salt":"A1/G4fvYZdGWORuEUCAmMg==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
46460fef-922f-4e1d-9ce8-e221f091b0b0	\N	password	b98bfd99-b4d8-48fa-afb0-a863de37946e	1773977580672	\N	{"value":"lByLvTGgkUw+ATdFjcDqh05u2XDKf48jVMYB1yt9tJU=","salt":"Zw7NU/tS2DyoftncMuVeyA==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
96c1b1a9-30f2-4a8e-ac47-ff5a85fcc0f3	\N	password	cb08f2c4-e0ad-4f37-9f82-319e543d10a2	1773977897530	\N	{"value":"30UWgwKsSo12rW7mugJFSzIiJnfDrjEyOd2aL35CQKc=","salt":"yJm+RMHe/6PiRwcpG90HPw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
66972529-ee39-44af-a815-22a2f42aa0d0	\N	password	6198b8cd-b64d-434c-af55-151e08e8b7a4	1773977951671	\N	{"value":"BmsAr5Uogt4Q0PZ+dpVTotnsFCyQ2d8FRR82e64L3Vo=","salt":"1WxBMIUf/4WaLYWosUt/gQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
78f33fc0-2d24-4ad0-b0cb-7968e05007bf	\N	password	1931ca0f-fa30-4e0a-b34d-36d040bcb5ee	1773977973078	\N	{"value":"V1O0F6R0R7VUpCtFYqoneccdeusScgn7vtP9/LuwIWQ=","salt":"zybDoJKFDWH5jxxmgGYl9w==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
e051e5e2-62ec-45c9-9366-1a0ee5dc095a	\N	password	5545f1ba-f5e9-466a-a92d-24aa49bfcb71	1773978119938	\N	{"value":"g6DanMVxFPo+Jx2uySr1mVT4rLXXklEjLRIoY80iSUY=","salt":"iWshbcvnL2qPNPta0wlsNg==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
c588e73c-f2ed-4b7c-b7e3-52bd552c21ca	\N	password	950cf1fd-22a5-4fd4-91e8-2d89495ebc3e	1773978288817	\N	{"value":"e95jyjMMSufMnjczv/PFx1GMDZay45rlKRi6PPkAUPM=","salt":"OyIsZiZVMfUbBWWn5glMLg==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
676b3afe-2943-4dd0-8047-0442477ef5bd	\N	password	903153d4-899a-40f4-8d36-8613f6efae42	1773978350732	\N	{"value":"xWQiDfXdYyFQWMLypM+OIi//i3JjDIN1P9jKblgnreA=","salt":"sHNbI3aWRnD2H/3v+wSR8g==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
ad948998-ced6-494a-8631-0ca9b14b5068	\N	password	27a641b6-35c6-4c36-bf0b-07e449dd8f01	1773979604574	\N	{"value":"Ihk8Lv41THagitGasNNvfCuZkmomIGXHX2HEynB0ID8=","salt":"cfFPxKbJ/2QXB/HbCe3zXA==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
900188d5-2bc9-4a4a-861e-7f919649dda1	\N	password	183e42a5-955e-441c-bf1c-25dad3e9f378	1773982143250	\N	{"value":"SSuczPhBZbTquzlyWKrf76efv89540XfBgDZFRpIhJk=","salt":"llH8lXHHu0LrZLuqJfkQKQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
6b8ccb2c-76c9-47f0-b9ed-f8be57893a8c	\N	password	024884af-efed-42a6-9f19-1bdf3da7ee06	1773984781937	\N	{"value":"U9RBIC12VDq3fw4SmX/7K9YU1GnALCscJVNMRRI9PSk=","salt":"iGie8GClCPOSpIWIt+f3VA==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
2b0d22ae-b3c4-495d-a18d-82647c225b7b	\N	password	66352a6d-e40c-4302-b9c9-ed638de14697	1773986382586	\N	{"value":"Q/CKtsCjI0x7sAgzGGS8wgERFuExstVUQXo9l0JxI5Y=","salt":"gNpalCiXzKzouJ9ZpJxKpA==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
a23792aa-7932-4384-8bf5-3ed4163fef39	\N	password	a27c7ad9-536a-4f88-941b-d0f68bd5476c	1773987218409	\N	{"value":"GYrYeXZFkDVLnorX9GVHNfWYWtVfV0CVOxG2kKxQK4Y=","salt":"m+WnJgCNEmcL8BL3K3yMkQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
51ec22d7-d5a2-4ddc-a392-adda137faa58	\N	password	57c38932-a790-4a36-ad8d-21068c693183	1773988602072	\N	{"value":"aeq3AHyI7/bPoWi+7gcPRQdiWsYRAjmq0LSuwbaiTIs=","salt":"4knyoqs3LBxvhfzW9Yrtjw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
c6a35957-76e9-4c8f-9f8a-ddc7c7b35689	\N	password	71e2a54a-5b9b-4b84-88a6-e58faecb8eba	1774405715016	\N	{"value":"uaQk93T5oOxM44kKEKtzJKLPnsv68ldHIbcCxBkuXOE=","salt":"jt8TzAgXHCsS3TN4j7szwQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
b5468acb-08ce-4ef2-80f5-7e1e0918f7a5	\N	password	9dfef4bf-681c-4b96-b938-dcdd980e020f	1774497823832	\N	{"value":"X1YzZOaHY9Uhs2qyPzjU2J2cEzXISNR6fpLrEzSXX1w=","salt":"yqBTMmpiUt5BFJQTHeuA8Q==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
d1765dc2-e8bc-48de-8388-24c3f7b17d2f	\N	password	97f92d79-47fd-458b-b07b-3dae515d8de3	1774569747219	\N	{"value":"uveRMEaEarBFJfdtn5kw8PQQuyDPHZ5Bo1ruq12lbCg=","salt":"YVloVpYdUa8zcbuO7o9/lw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
4a6d196d-1494-4661-bc66-22a88002516f	\N	password	94eb5fdc-f253-46a8-8c79-71e5e1d4e8af	1774598590069	\N	{"value":"/dBZF2Ed7Ej55mgl5aL4orrVkFKPmDP/vmZoZLs9ZDI=","salt":"oCJYl9hs8p+k7+b8U+Toig==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
eb45764c-101a-48b1-8be1-7164bd10fec7	\N	password	9e55faf5-d80f-4f81-b097-135f917baf45	1774598652917	\N	{"value":"N/RjZsRlb1HQ1RaQiej6KHWIHWz+GfmydXTIz9btlrA=","salt":"Ne1xHotQtRQh+eyjIDa+yA==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
be5a2fdc-0861-413c-b675-0c2589891907	\N	password	b7799718-862f-4bcd-9101-32e78605a028	1774598965167	\N	{"value":"8zhWV5iEZp9YK4192WnqkSmE3/XqD4jEpmK1tZxVpjg=","salt":"uWLYQGG0gPAqx8shqKeJFg==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
f80623fb-647e-4e35-878b-d17400e8f737	\N	password	8c43a270-a8f8-4ee7-899c-0c5d3095b3fb	1774598989683	\N	{"value":"HkLNiHX0eoBJO5KH/ykd+w68dy9VCrYGwEo42a2gKTU=","salt":"UGQ/PCZGk1y6KBIFCPoPPw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
095aeb96-c06c-4719-9fdf-b69ff821fb80	\N	password	e4cf9557-621d-4708-b647-94132db20430	1774599020602	\N	{"value":"RXOujEdx463go1a33aF12FOVhKRV7gGqhwowhGPeDZg=","salt":"dU5FrKQYOTXKihCl0tp5qA==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
478d41cb-3605-4841-ae56-77fbda278cb5	\N	password	a948ee9a-3b92-4c97-800a-142bf5d9ce19	1774599181202	\N	{"value":"KMFhk3q1u1XVVSS0OCqsrzQxLjZ591/x6HoYB7L/2XU=","salt":"HNtH8j1K1wSnGNwiFAiSkw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
d74e576c-81f0-448b-afd1-c278d4a19ba9	\N	password	7b34b9bd-1e6c-4729-9557-9f5ce9cb71ed	1774599630051	\N	{"value":"2AvlaNihBgXbTvrUBotVY68BBF1j8uFdaGxZrLlc1zs=","salt":"i2EcXUx3227lIsFYg2mb9Q==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
5a9bcb54-39be-4877-a3d0-77707d49c335	\N	password	5e95f7a0-d26a-4835-a32d-4e189ee0bb0f	1774599765758	\N	{"value":"y5kUTXtDIuJvJi1nW0xWURTb3k19U2adWnOf9dvkrtQ=","salt":"5r3E1StYscpOCUoX2i3tcw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
1c1bb60c-a617-4c1b-b312-fc433a975c7d	\N	password	6ea45f40-1ec3-483e-9ac1-327670b326ac	1774599776358	\N	{"value":"ekcHaHUelpGwYdchXbOu9ADorIl0eNjAJR/1GhTGZF4=","salt":"zCibosI/JtAYUfD3JV/wAA==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
9033e2cb-b64b-407b-8b1e-480c21007ddc	\N	password	daee01df-c4f4-41f6-bb66-b7fafb306ac8	1774599824249	\N	{"value":"bQ8Ye+7gULTTWJnkuN3PV3IcJwFU7Gp+L/on9v/G2OY=","salt":"3iwdoccrnYgiXdPb6CIRsw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
a6d7edb8-3e4f-4e37-a1c6-2bf04ae339cd	\N	password	758a8dc0-92e7-4b5b-8fbd-6a1be29501dc	1774600757947	\N	{"value":"hN4fbrggmVQc3xnX7iOe24EU6amPD61yl9Mbbmx8Cdo=","salt":"bkYpl8TGZ4/kGriKn31zSg==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
f5509536-94b6-4e68-b41e-c958c2c9786f	\N	password	32878125-c7dc-4e4e-b93c-2c9b8252e6df	1774601820510	\N	{"value":"0ucO0f5Je41LcRRaFbBmqxXFh9S0qtpaE8QftYe2xtA=","salt":"ubWW/6FSwC4XVfnaHcEApg==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
ee79512f-63e3-45aa-bc3a-23b4d84d484c	\N	password	426b437b-abc7-4e84-b2d7-04186a1e27f4	1774601855788	\N	{"value":"NmFxbj08+YxzUVIYkR1b+LsY4maC/8yZj9YuvyZi3zs=","salt":"QcJIZDyus7bL46XyFQcymw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
e65bb47b-b6ef-4d14-b994-e06a7765d4cc	\N	password	5aebbb58-3305-4bbe-b6b6-2aa6c01a8a18	1774601882116	\N	{"value":"5gpH+4/Ls2ngX2VyQgcCcaqKqOTk9+7mLMfgs7PNXcw=","salt":"/K/dWOlus7loP6yzVPmamA==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
839b60d3-fce5-46e0-b4f1-f96ddcb2a227	\N	password	4dd5b315-d087-49c4-bb3f-6a975540fbf9	1774601942052	\N	{"value":"hoy013mzL5Fm0SVopEUVGkvQ4KOnAij60Anu7qqWQVA=","salt":"xwr2pXdHNvw2HFlJUHjX4Q==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
327f350e-7cc3-4619-9d37-403beeb8eb09	\N	password	326fb589-eaf8-406b-87fe-24f472852b8c	1774601989983	\N	{"value":"qsgEDrDqRNt2NbMjHnyFGIpnrw1UBPX7xvHRu6GGrT8=","salt":"NTrgdmuvHXJtT0XxseKKuw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
c95bb5c9-1fe3-4729-8108-36e3c7bd8994	\N	password	6fe02703-d5c2-4d94-99a7-86607bf7a6bc	1774624663549	\N	{"value":"MppMuFWiv916qNdBMaD4utZUr2Gah6xIx5CS+Zyje+4=","salt":"4bQ0AyWmWGk+DIhoXfRnXQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
9092f477-4ee7-4497-92b1-fe454c9f8329	\N	password	4ccac717-3e2a-4663-a14c-1bad93f325a4	1774702449783	\N	{"value":"efsOhUw5fnJTSrkobUXeSjB4xubpbSV90Bi40P0wH8U=","salt":"O4njROwLs7BuUkhC4UUUeQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
e9a567e7-eaf0-4106-8926-16bd32b3cc9e	\N	password	16903467-bdcd-48bb-97ce-f81462399d69	1774705589947	\N	{"value":"rHfQmaJhqgVPqOtVNsvn4tP09Wc7278xLAK1nDZc/mA=","salt":"pWgBIayaWE+SzOZOf/GYpQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
\.


--
-- Data for Name: databasechangelog; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.databasechangelog (id, author, filename, dateexecuted, orderexecuted, exectype, md5sum, description, comments, tag, liquibase, contexts, labels, deployment_id) FROM stdin;
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/jpa-changelog-1.0.0.Final.xml	2026-03-19 02:12:33.704795	1	EXECUTED	9:6f1016664e21e16d26517a4418f5e3df	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.29.1	\N	\N	3886352852
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/db2-jpa-changelog-1.0.0.Final.xml	2026-03-19 02:12:33.733923	2	MARK_RAN	9:828775b1596a07d1200ba1d49e5e3941	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.29.1	\N	\N	3886352852
1.1.0.Beta1	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Beta1.xml	2026-03-19 02:12:33.798625	3	EXECUTED	9:5f090e44a7d595883c1fb61f4b41fd38	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=CLIENT_ATTRIBUTES; createTable tableName=CLIENT_SESSION_NOTE; createTable tableName=APP_NODE_REGISTRATIONS; addColumn table...		\N	4.29.1	\N	\N	3886352852
1.1.0.Final	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Final.xml	2026-03-19 02:12:33.804106	4	EXECUTED	9:c07e577387a3d2c04d1adc9aaad8730e	renameColumn newColumnName=EVENT_TIME, oldColumnName=TIME, tableName=EVENT_ENTITY		\N	4.29.1	\N	\N	3886352852
1.2.0.Beta1	psilva@redhat.com	META-INF/jpa-changelog-1.2.0.Beta1.xml	2026-03-19 02:12:33.945756	5	EXECUTED	9:b68ce996c655922dbcd2fe6b6ae72686	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.29.1	\N	\N	3886352852
1.2.0.Beta1	psilva@redhat.com	META-INF/db2-jpa-changelog-1.2.0.Beta1.xml	2026-03-19 02:12:33.957755	6	MARK_RAN	9:543b5c9989f024fe35c6f6c5a97de88e	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.29.1	\N	\N	3886352852
1.2.0.RC1	bburke@redhat.com	META-INF/jpa-changelog-1.2.0.CR1.xml	2026-03-19 02:12:34.087865	7	EXECUTED	9:765afebbe21cf5bbca048e632df38336	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.29.1	\N	\N	3886352852
1.2.0.RC1	bburke@redhat.com	META-INF/db2-jpa-changelog-1.2.0.CR1.xml	2026-03-19 02:12:34.096554	8	MARK_RAN	9:db4a145ba11a6fdaefb397f6dbf829a1	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.29.1	\N	\N	3886352852
1.2.0.Final	keycloak	META-INF/jpa-changelog-1.2.0.Final.xml	2026-03-19 02:12:34.104904	9	EXECUTED	9:9d05c7be10cdb873f8bcb41bc3a8ab23	update tableName=CLIENT; update tableName=CLIENT; update tableName=CLIENT		\N	4.29.1	\N	\N	3886352852
1.3.0	bburke@redhat.com	META-INF/jpa-changelog-1.3.0.xml	2026-03-19 02:12:34.233621	10	EXECUTED	9:18593702353128d53111f9b1ff0b82b8	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=ADMI...		\N	4.29.1	\N	\N	3886352852
1.4.0	bburke@redhat.com	META-INF/jpa-changelog-1.4.0.xml	2026-03-19 02:12:34.305287	11	EXECUTED	9:6122efe5f090e41a85c0f1c9e52cbb62	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.29.1	\N	\N	3886352852
1.4.0	bburke@redhat.com	META-INF/db2-jpa-changelog-1.4.0.xml	2026-03-19 02:12:34.314097	12	MARK_RAN	9:e1ff28bf7568451453f844c5d54bb0b5	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.29.1	\N	\N	3886352852
1.5.0	bburke@redhat.com	META-INF/jpa-changelog-1.5.0.xml	2026-03-19 02:12:34.340711	13	EXECUTED	9:7af32cd8957fbc069f796b61217483fd	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.29.1	\N	\N	3886352852
1.6.1_from15	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-03-19 02:12:34.369169	14	EXECUTED	9:6005e15e84714cd83226bf7879f54190	addColumn tableName=REALM; addColumn tableName=KEYCLOAK_ROLE; addColumn tableName=CLIENT; createTable tableName=OFFLINE_USER_SESSION; createTable tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_US_SES_PK2, tableName=...		\N	4.29.1	\N	\N	3886352852
1.6.1_from16-pre	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-03-19 02:12:34.371343	15	MARK_RAN	9:bf656f5a2b055d07f314431cae76f06c	delete tableName=OFFLINE_CLIENT_SESSION; delete tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	3886352852
1.6.1_from16	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-03-19 02:12:34.374778	16	MARK_RAN	9:f8dadc9284440469dcf71e25ca6ab99b	dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_US_SES_PK, tableName=OFFLINE_USER_SESSION; dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_CL_SES_PK, tableName=OFFLINE_CLIENT_SESSION; addColumn tableName=OFFLINE_USER_SESSION; update tableName=OF...		\N	4.29.1	\N	\N	3886352852
1.6.1	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-03-19 02:12:34.378513	17	EXECUTED	9:d41d8cd98f00b204e9800998ecf8427e	empty		\N	4.29.1	\N	\N	3886352852
1.7.0	bburke@redhat.com	META-INF/jpa-changelog-1.7.0.xml	2026-03-19 02:12:34.439036	18	EXECUTED	9:3368ff0be4c2855ee2dd9ca813b38d8e	createTable tableName=KEYCLOAK_GROUP; createTable tableName=GROUP_ROLE_MAPPING; createTable tableName=GROUP_ATTRIBUTE; createTable tableName=USER_GROUP_MEMBERSHIP; createTable tableName=REALM_DEFAULT_GROUPS; addColumn tableName=IDENTITY_PROVIDER; ...		\N	4.29.1	\N	\N	3886352852
1.8.0	mposolda@redhat.com	META-INF/jpa-changelog-1.8.0.xml	2026-03-19 02:12:34.495871	19	EXECUTED	9:8ac2fb5dd030b24c0570a763ed75ed20	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.29.1	\N	\N	3886352852
1.8.0-2	keycloak	META-INF/jpa-changelog-1.8.0.xml	2026-03-19 02:12:34.503778	20	EXECUTED	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.29.1	\N	\N	3886352852
1.8.0	mposolda@redhat.com	META-INF/db2-jpa-changelog-1.8.0.xml	2026-03-19 02:12:34.509078	21	MARK_RAN	9:831e82914316dc8a57dc09d755f23c51	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.29.1	\N	\N	3886352852
1.8.0-2	keycloak	META-INF/db2-jpa-changelog-1.8.0.xml	2026-03-19 02:12:34.513727	22	MARK_RAN	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.29.1	\N	\N	3886352852
1.9.0	mposolda@redhat.com	META-INF/jpa-changelog-1.9.0.xml	2026-03-19 02:12:34.634	23	EXECUTED	9:bc3d0f9e823a69dc21e23e94c7a94bb1	update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=REALM; update tableName=REALM; customChange; dr...		\N	4.29.1	\N	\N	3886352852
1.9.1	keycloak	META-INF/jpa-changelog-1.9.1.xml	2026-03-19 02:12:34.644963	24	EXECUTED	9:c9999da42f543575ab790e76439a2679	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=PUBLIC_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.29.1	\N	\N	3886352852
1.9.1	keycloak	META-INF/db2-jpa-changelog-1.9.1.xml	2026-03-19 02:12:34.647102	25	MARK_RAN	9:0d6c65c6f58732d81569e77b10ba301d	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.29.1	\N	\N	3886352852
1.9.2	keycloak	META-INF/jpa-changelog-1.9.2.xml	2026-03-19 02:12:35.262916	26	EXECUTED	9:fc576660fc016ae53d2d4778d84d86d0	createIndex indexName=IDX_USER_EMAIL, tableName=USER_ENTITY; createIndex indexName=IDX_USER_ROLE_MAPPING, tableName=USER_ROLE_MAPPING; createIndex indexName=IDX_USER_GROUP_MAPPING, tableName=USER_GROUP_MEMBERSHIP; createIndex indexName=IDX_USER_CO...		\N	4.29.1	\N	\N	3886352852
authz-2.0.0	psilva@redhat.com	META-INF/jpa-changelog-authz-2.0.0.xml	2026-03-19 02:12:35.362398	27	EXECUTED	9:43ed6b0da89ff77206289e87eaa9c024	createTable tableName=RESOURCE_SERVER; addPrimaryKey constraintName=CONSTRAINT_FARS, tableName=RESOURCE_SERVER; addUniqueConstraint constraintName=UK_AU8TT6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER; createTable tableName=RESOURCE_SERVER_RESOU...		\N	4.29.1	\N	\N	3886352852
authz-2.5.1	psilva@redhat.com	META-INF/jpa-changelog-authz-2.5.1.xml	2026-03-19 02:12:35.367159	28	EXECUTED	9:44bae577f551b3738740281eceb4ea70	update tableName=RESOURCE_SERVER_POLICY		\N	4.29.1	\N	\N	3886352852
2.1.0-KEYCLOAK-5461	bburke@redhat.com	META-INF/jpa-changelog-2.1.0.xml	2026-03-19 02:12:35.457019	29	EXECUTED	9:bd88e1f833df0420b01e114533aee5e8	createTable tableName=BROKER_LINK; createTable tableName=FED_USER_ATTRIBUTE; createTable tableName=FED_USER_CONSENT; createTable tableName=FED_USER_CONSENT_ROLE; createTable tableName=FED_USER_CONSENT_PROT_MAPPER; createTable tableName=FED_USER_CR...		\N	4.29.1	\N	\N	3886352852
2.2.0	bburke@redhat.com	META-INF/jpa-changelog-2.2.0.xml	2026-03-19 02:12:35.477411	30	EXECUTED	9:a7022af5267f019d020edfe316ef4371	addColumn tableName=ADMIN_EVENT_ENTITY; createTable tableName=CREDENTIAL_ATTRIBUTE; createTable tableName=FED_CREDENTIAL_ATTRIBUTE; modifyDataType columnName=VALUE, tableName=CREDENTIAL; addForeignKeyConstraint baseTableName=FED_CREDENTIAL_ATTRIBU...		\N	4.29.1	\N	\N	3886352852
2.3.0	bburke@redhat.com	META-INF/jpa-changelog-2.3.0.xml	2026-03-19 02:12:35.50426	31	EXECUTED	9:fc155c394040654d6a79227e56f5e25a	createTable tableName=FEDERATED_USER; addPrimaryKey constraintName=CONSTR_FEDERATED_USER, tableName=FEDERATED_USER; dropDefaultValue columnName=TOTP, tableName=USER_ENTITY; dropColumn columnName=TOTP, tableName=USER_ENTITY; addColumn tableName=IDE...		\N	4.29.1	\N	\N	3886352852
2.4.0	bburke@redhat.com	META-INF/jpa-changelog-2.4.0.xml	2026-03-19 02:12:35.511045	32	EXECUTED	9:eac4ffb2a14795e5dc7b426063e54d88	customChange		\N	4.29.1	\N	\N	3886352852
2.5.0	bburke@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-03-19 02:12:35.518505	33	EXECUTED	9:54937c05672568c4c64fc9524c1e9462	customChange; modifyDataType columnName=USER_ID, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	3886352852
2.5.0-unicode-oracle	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-03-19 02:12:35.521635	34	MARK_RAN	9:3a32bace77c84d7678d035a7f5a8084e	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.29.1	\N	\N	3886352852
2.5.0-unicode-other-dbs	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-03-19 02:12:35.557712	35	EXECUTED	9:33d72168746f81f98ae3a1e8e0ca3554	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.29.1	\N	\N	3886352852
2.5.0-duplicate-email-support	slawomir@dabek.name	META-INF/jpa-changelog-2.5.0.xml	2026-03-19 02:12:35.565695	36	EXECUTED	9:61b6d3d7a4c0e0024b0c839da283da0c	addColumn tableName=REALM		\N	4.29.1	\N	\N	3886352852
2.5.0-unique-group-names	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-03-19 02:12:35.573838	37	EXECUTED	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.29.1	\N	\N	3886352852
2.5.1	bburke@redhat.com	META-INF/jpa-changelog-2.5.1.xml	2026-03-19 02:12:35.578787	38	EXECUTED	9:a2b870802540cb3faa72098db5388af3	addColumn tableName=FED_USER_CONSENT		\N	4.29.1	\N	\N	3886352852
3.0.0	bburke@redhat.com	META-INF/jpa-changelog-3.0.0.xml	2026-03-19 02:12:35.583531	39	EXECUTED	9:132a67499ba24bcc54fb5cbdcfe7e4c0	addColumn tableName=IDENTITY_PROVIDER		\N	4.29.1	\N	\N	3886352852
3.2.0-fix	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-03-19 02:12:35.58568	40	MARK_RAN	9:938f894c032f5430f2b0fafb1a243462	addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS		\N	4.29.1	\N	\N	3886352852
3.2.0-fix-with-keycloak-5416	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-03-19 02:12:35.588666	41	MARK_RAN	9:845c332ff1874dc5d35974b0babf3006	dropIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS; addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS; createIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS		\N	4.29.1	\N	\N	3886352852
3.2.0-fix-offline-sessions	hmlnarik	META-INF/jpa-changelog-3.2.0.xml	2026-03-19 02:12:35.59507	42	EXECUTED	9:fc86359c079781adc577c5a217e4d04c	customChange		\N	4.29.1	\N	\N	3886352852
3.2.0-fixed	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-03-19 02:12:37.633272	43	EXECUTED	9:59a64800e3c0d09b825f8a3b444fa8f4	addColumn tableName=REALM; dropPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_PK2, tableName=OFFLINE_CLIENT_SESSION; dropColumn columnName=CLIENT_SESSION_ID, tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_P...		\N	4.29.1	\N	\N	3886352852
3.3.0	keycloak	META-INF/jpa-changelog-3.3.0.xml	2026-03-19 02:12:37.638911	44	EXECUTED	9:d48d6da5c6ccf667807f633fe489ce88	addColumn tableName=USER_ENTITY		\N	4.29.1	\N	\N	3886352852
authz-3.4.0.CR1-resource-server-pk-change-part1	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-03-19 02:12:37.645128	45	EXECUTED	9:dde36f7973e80d71fceee683bc5d2951	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_RESOURCE; addColumn tableName=RESOURCE_SERVER_SCOPE		\N	4.29.1	\N	\N	3886352852
authz-3.4.0.CR1-resource-server-pk-change-part2-KEYCLOAK-6095	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-03-19 02:12:37.650692	46	EXECUTED	9:b855e9b0a406b34fa323235a0cf4f640	customChange		\N	4.29.1	\N	\N	3886352852
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-03-19 02:12:37.652778	47	MARK_RAN	9:51abbacd7b416c50c4421a8cabf7927e	dropIndex indexName=IDX_RES_SERV_POL_RES_SERV, tableName=RESOURCE_SERVER_POLICY; dropIndex indexName=IDX_RES_SRV_RES_RES_SRV, tableName=RESOURCE_SERVER_RESOURCE; dropIndex indexName=IDX_RES_SRV_SCOPE_RES_SRV, tableName=RESOURCE_SERVER_SCOPE		\N	4.29.1	\N	\N	3886352852
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed-nodropindex	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-03-19 02:12:37.821171	48	EXECUTED	9:bdc99e567b3398bac83263d375aad143	addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_POLICY; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_RESOURCE; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, ...		\N	4.29.1	\N	\N	3886352852
authn-3.4.0.CR1-refresh-token-max-reuse	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-03-19 02:12:37.826476	49	EXECUTED	9:d198654156881c46bfba39abd7769e69	addColumn tableName=REALM		\N	4.29.1	\N	\N	3886352852
3.4.0	keycloak	META-INF/jpa-changelog-3.4.0.xml	2026-03-19 02:12:37.887551	50	EXECUTED	9:cfdd8736332ccdd72c5256ccb42335db	addPrimaryKey constraintName=CONSTRAINT_REALM_DEFAULT_ROLES, tableName=REALM_DEFAULT_ROLES; addPrimaryKey constraintName=CONSTRAINT_COMPOSITE_ROLE, tableName=COMPOSITE_ROLE; addPrimaryKey constraintName=CONSTR_REALM_DEFAULT_GROUPS, tableName=REALM...		\N	4.29.1	\N	\N	3886352852
3.4.0-KEYCLOAK-5230	hmlnarik@redhat.com	META-INF/jpa-changelog-3.4.0.xml	2026-03-19 02:12:38.360831	51	EXECUTED	9:7c84de3d9bd84d7f077607c1a4dcb714	createIndex indexName=IDX_FU_ATTRIBUTE, tableName=FED_USER_ATTRIBUTE; createIndex indexName=IDX_FU_CONSENT, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CONSENT_RU, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CREDENTIAL, t...		\N	4.29.1	\N	\N	3886352852
3.4.1	psilva@redhat.com	META-INF/jpa-changelog-3.4.1.xml	2026-03-19 02:12:38.365403	52	EXECUTED	9:5a6bb36cbefb6a9d6928452c0852af2d	modifyDataType columnName=VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	3886352852
3.4.2	keycloak	META-INF/jpa-changelog-3.4.2.xml	2026-03-19 02:12:38.369167	53	EXECUTED	9:8f23e334dbc59f82e0a328373ca6ced0	update tableName=REALM		\N	4.29.1	\N	\N	3886352852
3.4.2-KEYCLOAK-5172	mkanis@redhat.com	META-INF/jpa-changelog-3.4.2.xml	2026-03-19 02:12:38.372554	54	EXECUTED	9:9156214268f09d970cdf0e1564d866af	update tableName=CLIENT		\N	4.29.1	\N	\N	3886352852
4.0.0-KEYCLOAK-6335	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-03-19 02:12:38.381297	55	EXECUTED	9:db806613b1ed154826c02610b7dbdf74	createTable tableName=CLIENT_AUTH_FLOW_BINDINGS; addPrimaryKey constraintName=C_CLI_FLOW_BIND, tableName=CLIENT_AUTH_FLOW_BINDINGS		\N	4.29.1	\N	\N	3886352852
4.0.0-CLEANUP-UNUSED-TABLE	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-03-19 02:12:38.386717	56	EXECUTED	9:229a041fb72d5beac76bb94a5fa709de	dropTable tableName=CLIENT_IDENTITY_PROV_MAPPING		\N	4.29.1	\N	\N	3886352852
4.0.0-KEYCLOAK-6228	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-03-19 02:12:38.452627	57	EXECUTED	9:079899dade9c1e683f26b2aa9ca6ff04	dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; dropNotNullConstraint columnName=CLIENT_ID, tableName=USER_CONSENT; addColumn tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHO...		\N	4.29.1	\N	\N	3886352852
4.0.0-KEYCLOAK-5579-fixed	mposolda@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-03-19 02:12:38.95033	58	EXECUTED	9:139b79bcbbfe903bb1c2d2a4dbf001d9	dropForeignKeyConstraint baseTableName=CLIENT_TEMPLATE_ATTRIBUTES, constraintName=FK_CL_TEMPL_ATTR_TEMPL; renameTable newTableName=CLIENT_SCOPE_ATTRIBUTES, oldTableName=CLIENT_TEMPLATE_ATTRIBUTES; renameColumn newColumnName=SCOPE_ID, oldColumnName...		\N	4.29.1	\N	\N	3886352852
authz-4.0.0.CR1	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.CR1.xml	2026-03-19 02:12:38.98219	59	EXECUTED	9:b55738ad889860c625ba2bf483495a04	createTable tableName=RESOURCE_SERVER_PERM_TICKET; addPrimaryKey constraintName=CONSTRAINT_FAPMT, tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRHO213XCX4WNKOG82SSPMT...		\N	4.29.1	\N	\N	3886352852
authz-4.0.0.Beta3	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.Beta3.xml	2026-03-19 02:12:38.988976	60	EXECUTED	9:e0057eac39aa8fc8e09ac6cfa4ae15fe	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRPO2128CX4WNKOG82SSRFY, referencedTableName=RESOURCE_SERVER_POLICY		\N	4.29.1	\N	\N	3886352852
authz-4.2.0.Final	mhajas@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2026-03-19 02:12:38.998949	61	EXECUTED	9:42a33806f3a0443fe0e7feeec821326c	createTable tableName=RESOURCE_URIS; addForeignKeyConstraint baseTableName=RESOURCE_URIS, constraintName=FK_RESOURCE_SERVER_URIS, referencedTableName=RESOURCE_SERVER_RESOURCE; customChange; dropColumn columnName=URI, tableName=RESOURCE_SERVER_RESO...		\N	4.29.1	\N	\N	3886352852
authz-4.2.0.Final-KEYCLOAK-9944	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2026-03-19 02:12:39.006297	62	EXECUTED	9:9968206fca46eecc1f51db9c024bfe56	addPrimaryKey constraintName=CONSTRAINT_RESOUR_URIS_PK, tableName=RESOURCE_URIS		\N	4.29.1	\N	\N	3886352852
4.2.0-KEYCLOAK-6313	wadahiro@gmail.com	META-INF/jpa-changelog-4.2.0.xml	2026-03-19 02:12:39.010694	63	EXECUTED	9:92143a6daea0a3f3b8f598c97ce55c3d	addColumn tableName=REQUIRED_ACTION_PROVIDER		\N	4.29.1	\N	\N	3886352852
4.3.0-KEYCLOAK-7984	wadahiro@gmail.com	META-INF/jpa-changelog-4.3.0.xml	2026-03-19 02:12:39.014148	64	EXECUTED	9:82bab26a27195d889fb0429003b18f40	update tableName=REQUIRED_ACTION_PROVIDER		\N	4.29.1	\N	\N	3886352852
4.6.0-KEYCLOAK-7950	psilva@redhat.com	META-INF/jpa-changelog-4.6.0.xml	2026-03-19 02:12:39.017807	65	EXECUTED	9:e590c88ddc0b38b0ae4249bbfcb5abc3	update tableName=RESOURCE_SERVER_RESOURCE		\N	4.29.1	\N	\N	3886352852
4.6.0-KEYCLOAK-8377	keycloak	META-INF/jpa-changelog-4.6.0.xml	2026-03-19 02:12:39.076283	66	EXECUTED	9:5c1f475536118dbdc38d5d7977950cc0	createTable tableName=ROLE_ATTRIBUTE; addPrimaryKey constraintName=CONSTRAINT_ROLE_ATTRIBUTE_PK, tableName=ROLE_ATTRIBUTE; addForeignKeyConstraint baseTableName=ROLE_ATTRIBUTE, constraintName=FK_ROLE_ATTRIBUTE_ID, referencedTableName=KEYCLOAK_ROLE...		\N	4.29.1	\N	\N	3886352852
4.6.0-KEYCLOAK-8555	gideonray@gmail.com	META-INF/jpa-changelog-4.6.0.xml	2026-03-19 02:12:39.12376	67	EXECUTED	9:e7c9f5f9c4d67ccbbcc215440c718a17	createIndex indexName=IDX_COMPONENT_PROVIDER_TYPE, tableName=COMPONENT		\N	4.29.1	\N	\N	3886352852
4.7.0-KEYCLOAK-1267	sguilhen@redhat.com	META-INF/jpa-changelog-4.7.0.xml	2026-03-19 02:12:39.131679	68	EXECUTED	9:88e0bfdda924690d6f4e430c53447dd5	addColumn tableName=REALM		\N	4.29.1	\N	\N	3886352852
4.7.0-KEYCLOAK-7275	keycloak	META-INF/jpa-changelog-4.7.0.xml	2026-03-19 02:12:39.184701	69	EXECUTED	9:f53177f137e1c46b6a88c59ec1cb5218	renameColumn newColumnName=CREATED_ON, oldColumnName=LAST_SESSION_REFRESH, tableName=OFFLINE_USER_SESSION; addNotNullConstraint columnName=CREATED_ON, tableName=OFFLINE_USER_SESSION; addColumn tableName=OFFLINE_USER_SESSION; customChange; createIn...		\N	4.29.1	\N	\N	3886352852
4.8.0-KEYCLOAK-8835	sguilhen@redhat.com	META-INF/jpa-changelog-4.8.0.xml	2026-03-19 02:12:39.191094	70	EXECUTED	9:a74d33da4dc42a37ec27121580d1459f	addNotNullConstraint columnName=SSO_MAX_LIFESPAN_REMEMBER_ME, tableName=REALM; addNotNullConstraint columnName=SSO_IDLE_TIMEOUT_REMEMBER_ME, tableName=REALM		\N	4.29.1	\N	\N	3886352852
authz-7.0.0-KEYCLOAK-10443	psilva@redhat.com	META-INF/jpa-changelog-authz-7.0.0.xml	2026-03-19 02:12:39.195683	71	EXECUTED	9:fd4ade7b90c3b67fae0bfcfcb42dfb5f	addColumn tableName=RESOURCE_SERVER		\N	4.29.1	\N	\N	3886352852
8.0.0-adding-credential-columns	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-03-19 02:12:39.204479	72	EXECUTED	9:aa072ad090bbba210d8f18781b8cebf4	addColumn tableName=CREDENTIAL; addColumn tableName=FED_USER_CREDENTIAL		\N	4.29.1	\N	\N	3886352852
8.0.0-updating-credential-data-not-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-03-19 02:12:39.213095	73	EXECUTED	9:1ae6be29bab7c2aa376f6983b932be37	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.29.1	\N	\N	3886352852
8.0.0-updating-credential-data-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-03-19 02:12:39.216033	74	MARK_RAN	9:14706f286953fc9a25286dbd8fb30d97	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.29.1	\N	\N	3886352852
8.0.0-credential-cleanup-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-03-19 02:12:39.243787	75	EXECUTED	9:2b9cc12779be32c5b40e2e67711a218b	dropDefaultValue columnName=COUNTER, tableName=CREDENTIAL; dropDefaultValue columnName=DIGITS, tableName=CREDENTIAL; dropDefaultValue columnName=PERIOD, tableName=CREDENTIAL; dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; dropColumn ...		\N	4.29.1	\N	\N	3886352852
8.0.0-resource-tag-support	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-03-19 02:12:39.291925	76	EXECUTED	9:91fa186ce7a5af127a2d7a91ee083cc5	addColumn tableName=MIGRATION_MODEL; createIndex indexName=IDX_UPDATE_TIME, tableName=MIGRATION_MODEL		\N	4.29.1	\N	\N	3886352852
9.0.0-always-display-client	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-03-19 02:12:39.297036	77	EXECUTED	9:6335e5c94e83a2639ccd68dd24e2e5ad	addColumn tableName=CLIENT		\N	4.29.1	\N	\N	3886352852
9.0.0-drop-constraints-for-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-03-19 02:12:39.298945	78	MARK_RAN	9:6bdb5658951e028bfe16fa0a8228b530	dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5PMT, tableName=RESOURCE_SERVER_PERM_TICKET; dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER_RESOURCE; dropPrimaryKey constraintName=CONSTRAINT_O...		\N	4.29.1	\N	\N	3886352852
9.0.0-increase-column-size-federated-fk	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-03-19 02:12:39.322648	79	EXECUTED	9:d5bc15a64117ccad481ce8792d4c608f	modifyDataType columnName=CLIENT_ID, tableName=FED_USER_CONSENT; modifyDataType columnName=CLIENT_REALM_CONSTRAINT, tableName=KEYCLOAK_ROLE; modifyDataType columnName=OWNER, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=CLIENT_ID, ta...		\N	4.29.1	\N	\N	3886352852
9.0.0-recreate-constraints-after-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-03-19 02:12:39.325145	80	MARK_RAN	9:077cba51999515f4d3e7ad5619ab592c	addNotNullConstraint columnName=CLIENT_ID, tableName=OFFLINE_CLIENT_SESSION; addNotNullConstraint columnName=OWNER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNullConstraint columnName=REQUESTER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNull...		\N	4.29.1	\N	\N	3886352852
9.0.1-add-index-to-client.client_id	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-03-19 02:12:39.37156	81	EXECUTED	9:be969f08a163bf47c6b9e9ead8ac2afb	createIndex indexName=IDX_CLIENT_ID, tableName=CLIENT		\N	4.29.1	\N	\N	3886352852
9.0.1-KEYCLOAK-12579-drop-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-03-19 02:12:39.373489	82	MARK_RAN	9:6d3bb4408ba5a72f39bd8a0b301ec6e3	dropUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.29.1	\N	\N	3886352852
9.0.1-KEYCLOAK-12579-add-not-null-constraint	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-03-19 02:12:39.3791	83	EXECUTED	9:966bda61e46bebf3cc39518fbed52fa7	addNotNullConstraint columnName=PARENT_GROUP, tableName=KEYCLOAK_GROUP		\N	4.29.1	\N	\N	3886352852
9.0.1-KEYCLOAK-12579-recreate-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-03-19 02:12:39.381219	84	MARK_RAN	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.29.1	\N	\N	3886352852
9.0.1-add-index-to-events	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-03-19 02:12:39.427598	85	EXECUTED	9:7d93d602352a30c0c317e6a609b56599	createIndex indexName=IDX_EVENT_TIME, tableName=EVENT_ENTITY		\N	4.29.1	\N	\N	3886352852
map-remove-ri	keycloak	META-INF/jpa-changelog-11.0.0.xml	2026-03-19 02:12:39.433616	86	EXECUTED	9:71c5969e6cdd8d7b6f47cebc86d37627	dropForeignKeyConstraint baseTableName=REALM, constraintName=FK_TRAF444KK6QRKMS7N56AIWQ5Y; dropForeignKeyConstraint baseTableName=KEYCLOAK_ROLE, constraintName=FK_KJHO5LE2C0RAL09FL8CM9WFW9		\N	4.29.1	\N	\N	3886352852
map-remove-ri	keycloak	META-INF/jpa-changelog-12.0.0.xml	2026-03-19 02:12:39.441573	87	EXECUTED	9:a9ba7d47f065f041b7da856a81762021	dropForeignKeyConstraint baseTableName=REALM_DEFAULT_GROUPS, constraintName=FK_DEF_GROUPS_GROUP; dropForeignKeyConstraint baseTableName=REALM_DEFAULT_ROLES, constraintName=FK_H4WPD7W4HSOOLNI3H0SW7BTJE; dropForeignKeyConstraint baseTableName=CLIENT...		\N	4.29.1	\N	\N	3886352852
12.1.0-add-realm-localization-table	keycloak	META-INF/jpa-changelog-12.0.0.xml	2026-03-19 02:12:39.453681	88	EXECUTED	9:fffabce2bc01e1a8f5110d5278500065	createTable tableName=REALM_LOCALIZATIONS; addPrimaryKey tableName=REALM_LOCALIZATIONS		\N	4.29.1	\N	\N	3886352852
default-roles	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-19 02:12:39.46042	89	EXECUTED	9:fa8a5b5445e3857f4b010bafb5009957	addColumn tableName=REALM; customChange		\N	4.29.1	\N	\N	3886352852
default-roles-cleanup	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-19 02:12:39.467092	90	EXECUTED	9:67ac3241df9a8582d591c5ed87125f39	dropTable tableName=REALM_DEFAULT_ROLES; dropTable tableName=CLIENT_DEFAULT_ROLES		\N	4.29.1	\N	\N	3886352852
13.0.0-KEYCLOAK-16844	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-19 02:12:39.512228	91	EXECUTED	9:ad1194d66c937e3ffc82386c050ba089	createIndex indexName=IDX_OFFLINE_USS_PRELOAD, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	3886352852
map-remove-ri-13.0.0	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-19 02:12:39.520049	92	EXECUTED	9:d9be619d94af5a2f5d07b9f003543b91	dropForeignKeyConstraint baseTableName=DEFAULT_CLIENT_SCOPE, constraintName=FK_R_DEF_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SCOPE_CLIENT, constraintName=FK_C_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SC...		\N	4.29.1	\N	\N	3886352852
13.0.0-KEYCLOAK-17992-drop-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-19 02:12:39.522005	93	MARK_RAN	9:544d201116a0fcc5a5da0925fbbc3bde	dropPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CLSCOPE_CL, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CL_CLSCOPE, tableName=CLIENT_SCOPE_CLIENT		\N	4.29.1	\N	\N	3886352852
13.0.0-increase-column-size-federated	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-19 02:12:39.532356	94	EXECUTED	9:43c0c1055b6761b4b3e89de76d612ccf	modifyDataType columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; modifyDataType columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT		\N	4.29.1	\N	\N	3886352852
13.0.0-KEYCLOAK-17992-recreate-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-19 02:12:39.53473	95	MARK_RAN	9:8bd711fd0330f4fe980494ca43ab1139	addNotNullConstraint columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; addNotNullConstraint columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT; addPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; createIndex indexName=...		\N	4.29.1	\N	\N	3886352852
json-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-19 02:12:39.541752	96	EXECUTED	9:e07d2bc0970c348bb06fb63b1f82ddbf	addColumn tableName=REALM_ATTRIBUTE; update tableName=REALM_ATTRIBUTE; dropColumn columnName=VALUE, tableName=REALM_ATTRIBUTE; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=REALM_ATTRIBUTE		\N	4.29.1	\N	\N	3886352852
14.0.0-KEYCLOAK-11019	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-19 02:12:39.670511	97	EXECUTED	9:24fb8611e97f29989bea412aa38d12b7	createIndex indexName=IDX_OFFLINE_CSS_PRELOAD, tableName=OFFLINE_CLIENT_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USER, tableName=OFFLINE_USER_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USERSESS, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	3886352852
14.0.0-KEYCLOAK-18286	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-19 02:12:39.673113	98	MARK_RAN	9:259f89014ce2506ee84740cbf7163aa7	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	3886352852
14.0.0-KEYCLOAK-18286-revert	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-19 02:12:39.686	99	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	3886352852
14.0.0-KEYCLOAK-18286-supported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-19 02:12:39.735068	100	EXECUTED	9:60ca84a0f8c94ec8c3504a5a3bc88ee8	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	3886352852
14.0.0-KEYCLOAK-18286-unsupported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-19 02:12:39.737119	101	MARK_RAN	9:d3d977031d431db16e2c181ce49d73e9	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	3886352852
KEYCLOAK-17267-add-index-to-user-attributes	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-19 02:12:39.785522	102	EXECUTED	9:0b305d8d1277f3a89a0a53a659ad274c	createIndex indexName=IDX_USER_ATTRIBUTE_NAME, tableName=USER_ATTRIBUTE		\N	4.29.1	\N	\N	3886352852
KEYCLOAK-18146-add-saml-art-binding-identifier	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-19 02:12:39.790626	103	EXECUTED	9:2c374ad2cdfe20e2905a84c8fac48460	customChange		\N	4.29.1	\N	\N	3886352852
15.0.0-KEYCLOAK-18467	keycloak	META-INF/jpa-changelog-15.0.0.xml	2026-03-19 02:12:39.797669	104	EXECUTED	9:47a760639ac597360a8219f5b768b4de	addColumn tableName=REALM_LOCALIZATIONS; update tableName=REALM_LOCALIZATIONS; dropColumn columnName=TEXTS, tableName=REALM_LOCALIZATIONS; renameColumn newColumnName=TEXTS, oldColumnName=TEXTS_NEW, tableName=REALM_LOCALIZATIONS; addNotNullConstrai...		\N	4.29.1	\N	\N	3886352852
17.0.0-9562	keycloak	META-INF/jpa-changelog-17.0.0.xml	2026-03-19 02:12:39.84575	105	EXECUTED	9:a6272f0576727dd8cad2522335f5d99e	createIndex indexName=IDX_USER_SERVICE_ACCOUNT, tableName=USER_ENTITY		\N	4.29.1	\N	\N	3886352852
18.0.0-10625-IDX_ADMIN_EVENT_TIME	keycloak	META-INF/jpa-changelog-18.0.0.xml	2026-03-19 02:12:39.894969	106	EXECUTED	9:015479dbd691d9cc8669282f4828c41d	createIndex indexName=IDX_ADMIN_EVENT_TIME, tableName=ADMIN_EVENT_ENTITY		\N	4.29.1	\N	\N	3886352852
18.0.15-30992-index-consent	keycloak	META-INF/jpa-changelog-18.0.15.xml	2026-03-19 02:12:39.95149	107	EXECUTED	9:80071ede7a05604b1f4906f3bf3b00f0	createIndex indexName=IDX_USCONSENT_SCOPE_ID, tableName=USER_CONSENT_CLIENT_SCOPE		\N	4.29.1	\N	\N	3886352852
19.0.0-10135	keycloak	META-INF/jpa-changelog-19.0.0.xml	2026-03-19 02:12:39.957711	108	EXECUTED	9:9518e495fdd22f78ad6425cc30630221	customChange		\N	4.29.1	\N	\N	3886352852
20.0.0-12964-supported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-03-19 02:12:40.01759	109	EXECUTED	9:e5f243877199fd96bcc842f27a1656ac	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.29.1	\N	\N	3886352852
20.0.0-12964-unsupported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-03-19 02:12:40.019846	110	MARK_RAN	9:1a6fcaa85e20bdeae0a9ce49b41946a5	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.29.1	\N	\N	3886352852
client-attributes-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-03-19 02:12:40.02848	111	EXECUTED	9:3f332e13e90739ed0c35b0b25b7822ca	addColumn tableName=CLIENT_ATTRIBUTES; update tableName=CLIENT_ATTRIBUTES; dropColumn columnName=VALUE, tableName=CLIENT_ATTRIBUTES; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	3886352852
21.0.2-17277	keycloak	META-INF/jpa-changelog-21.0.2.xml	2026-03-19 02:12:40.034402	112	EXECUTED	9:7ee1f7a3fb8f5588f171fb9a6ab623c0	customChange		\N	4.29.1	\N	\N	3886352852
21.1.0-19404	keycloak	META-INF/jpa-changelog-21.1.0.xml	2026-03-19 02:12:40.073329	113	EXECUTED	9:3d7e830b52f33676b9d64f7f2b2ea634	modifyDataType columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=LOGIC, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=POLICY_ENFORCE_MODE, tableName=RESOURCE_SERVER		\N	4.29.1	\N	\N	3886352852
21.1.0-19404-2	keycloak	META-INF/jpa-changelog-21.1.0.xml	2026-03-19 02:12:40.077292	114	MARK_RAN	9:627d032e3ef2c06c0e1f73d2ae25c26c	addColumn tableName=RESOURCE_SERVER_POLICY; update tableName=RESOURCE_SERVER_POLICY; dropColumn columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; renameColumn newColumnName=DECISION_STRATEGY, oldColumnName=DECISION_STRATEGY_NEW, tabl...		\N	4.29.1	\N	\N	3886352852
22.0.0-17484-updated	keycloak	META-INF/jpa-changelog-22.0.0.xml	2026-03-19 02:12:40.083942	115	EXECUTED	9:90af0bfd30cafc17b9f4d6eccd92b8b3	customChange		\N	4.29.1	\N	\N	3886352852
22.0.5-24031	keycloak	META-INF/jpa-changelog-22.0.0.xml	2026-03-19 02:12:40.085732	116	MARK_RAN	9:a60d2d7b315ec2d3eba9e2f145f9df28	customChange		\N	4.29.1	\N	\N	3886352852
23.0.0-12062	keycloak	META-INF/jpa-changelog-23.0.0.xml	2026-03-19 02:12:40.093592	117	EXECUTED	9:2168fbe728fec46ae9baf15bf80927b8	addColumn tableName=COMPONENT_CONFIG; update tableName=COMPONENT_CONFIG; dropColumn columnName=VALUE, tableName=COMPONENT_CONFIG; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=COMPONENT_CONFIG		\N	4.29.1	\N	\N	3886352852
23.0.0-17258	keycloak	META-INF/jpa-changelog-23.0.0.xml	2026-03-19 02:12:40.098091	118	EXECUTED	9:36506d679a83bbfda85a27ea1864dca8	addColumn tableName=EVENT_ENTITY		\N	4.29.1	\N	\N	3886352852
24.0.0-9758	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-03-19 02:12:40.269968	119	EXECUTED	9:502c557a5189f600f0f445a9b49ebbce	addColumn tableName=USER_ATTRIBUTE; addColumn tableName=FED_USER_ATTRIBUTE; createIndex indexName=USER_ATTR_LONG_VALUES, tableName=USER_ATTRIBUTE; createIndex indexName=FED_USER_ATTR_LONG_VALUES, tableName=FED_USER_ATTRIBUTE; createIndex indexName...		\N	4.29.1	\N	\N	3886352852
24.0.0-9758-2	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-03-19 02:12:40.275068	120	EXECUTED	9:bf0fdee10afdf597a987adbf291db7b2	customChange		\N	4.29.1	\N	\N	3886352852
24.0.0-26618-drop-index-if-present	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-03-19 02:12:40.280569	121	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	3886352852
24.0.0-26618-reindex	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-03-19 02:12:40.324705	122	EXECUTED	9:08707c0f0db1cef6b352db03a60edc7f	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	3886352852
24.0.2-27228	keycloak	META-INF/jpa-changelog-24.0.2.xml	2026-03-19 02:12:40.329142	123	EXECUTED	9:eaee11f6b8aa25d2cc6a84fb86fc6238	customChange		\N	4.29.1	\N	\N	3886352852
24.0.2-27967-drop-index-if-present	keycloak	META-INF/jpa-changelog-24.0.2.xml	2026-03-19 02:12:40.331045	124	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	3886352852
24.0.2-27967-reindex	keycloak	META-INF/jpa-changelog-24.0.2.xml	2026-03-19 02:12:40.333471	125	MARK_RAN	9:d3d977031d431db16e2c181ce49d73e9	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	3886352852
25.0.0-28265-tables	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.339734	126	EXECUTED	9:deda2df035df23388af95bbd36c17cef	addColumn tableName=OFFLINE_USER_SESSION; addColumn tableName=OFFLINE_CLIENT_SESSION		\N	4.29.1	\N	\N	3886352852
25.0.0-28265-index-creation	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.384755	127	EXECUTED	9:3e96709818458ae49f3c679ae58d263a	createIndex indexName=IDX_OFFLINE_USS_BY_LAST_SESSION_REFRESH, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	3886352852
25.0.0-28265-index-cleanup-uss-createdon	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.434881	128	EXECUTED	9:78ab4fc129ed5e8265dbcc3485fba92f	dropIndex indexName=IDX_OFFLINE_USS_CREATEDON, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	3886352852
25.0.0-28265-index-cleanup-uss-preload	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.476783	129	EXECUTED	9:de5f7c1f7e10994ed8b62e621d20eaab	dropIndex indexName=IDX_OFFLINE_USS_PRELOAD, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	3886352852
25.0.0-28265-index-cleanup-uss-by-usersess	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.525707	130	EXECUTED	9:6eee220d024e38e89c799417ec33667f	dropIndex indexName=IDX_OFFLINE_USS_BY_USERSESS, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	3886352852
25.0.0-28265-index-cleanup-css-preload	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.568976	131	EXECUTED	9:5411d2fb2891d3e8d63ddb55dfa3c0c9	dropIndex indexName=IDX_OFFLINE_CSS_PRELOAD, tableName=OFFLINE_CLIENT_SESSION		\N	4.29.1	\N	\N	3886352852
25.0.0-28265-index-2-mysql	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.571237	132	MARK_RAN	9:b7ef76036d3126bb83c2423bf4d449d6	createIndex indexName=IDX_OFFLINE_USS_BY_BROKER_SESSION_ID, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	3886352852
25.0.0-28265-index-2-not-mysql	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.627968	133	EXECUTED	9:23396cf51ab8bc1ae6f0cac7f9f6fcf7	createIndex indexName=IDX_OFFLINE_USS_BY_BROKER_SESSION_ID, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	3886352852
25.0.0-org	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.657623	134	EXECUTED	9:5c859965c2c9b9c72136c360649af157	createTable tableName=ORG; addUniqueConstraint constraintName=UK_ORG_NAME, tableName=ORG; addUniqueConstraint constraintName=UK_ORG_GROUP, tableName=ORG; createTable tableName=ORG_DOMAIN		\N	4.29.1	\N	\N	3886352852
unique-consentuser	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.673375	135	EXECUTED	9:5857626a2ea8767e9a6c66bf3a2cb32f	customChange; dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_LOCAL_CONSENT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_EXTERNAL_CONSENT, tableName=...		\N	4.29.1	\N	\N	3886352852
unique-consentuser-mysql	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.675857	136	MARK_RAN	9:b79478aad5adaa1bc428e31563f55e8e	customChange; dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_LOCAL_CONSENT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_EXTERNAL_CONSENT, tableName=...		\N	4.29.1	\N	\N	3886352852
25.0.0-28861-index-creation	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-19 02:12:40.778467	137	EXECUTED	9:b9acb58ac958d9ada0fe12a5d4794ab1	createIndex indexName=IDX_PERM_TICKET_REQUESTER, tableName=RESOURCE_SERVER_PERM_TICKET; createIndex indexName=IDX_PERM_TICKET_OWNER, tableName=RESOURCE_SERVER_PERM_TICKET		\N	4.29.1	\N	\N	3886352852
26.0.0-org-alias	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-19 02:12:40.788397	138	EXECUTED	9:6ef7d63e4412b3c2d66ed179159886a4	addColumn tableName=ORG; update tableName=ORG; addNotNullConstraint columnName=ALIAS, tableName=ORG; addUniqueConstraint constraintName=UK_ORG_ALIAS, tableName=ORG		\N	4.29.1	\N	\N	3886352852
26.0.0-org-group	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-19 02:12:40.797081	139	EXECUTED	9:da8e8087d80ef2ace4f89d8c5b9ca223	addColumn tableName=KEYCLOAK_GROUP; update tableName=KEYCLOAK_GROUP; addNotNullConstraint columnName=TYPE, tableName=KEYCLOAK_GROUP; customChange		\N	4.29.1	\N	\N	3886352852
26.0.0-org-indexes	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-19 02:12:40.847251	140	EXECUTED	9:79b05dcd610a8c7f25ec05135eec0857	createIndex indexName=IDX_ORG_DOMAIN_ORG_ID, tableName=ORG_DOMAIN		\N	4.29.1	\N	\N	3886352852
26.0.0-org-group-membership	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-19 02:12:40.855158	141	EXECUTED	9:a6ace2ce583a421d89b01ba2a28dc2d4	addColumn tableName=USER_GROUP_MEMBERSHIP; update tableName=USER_GROUP_MEMBERSHIP; addNotNullConstraint columnName=MEMBERSHIP_TYPE, tableName=USER_GROUP_MEMBERSHIP		\N	4.29.1	\N	\N	3886352852
31296-persist-revoked-access-tokens	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-19 02:12:40.865396	142	EXECUTED	9:64ef94489d42a358e8304b0e245f0ed4	createTable tableName=REVOKED_TOKEN; addPrimaryKey constraintName=CONSTRAINT_RT, tableName=REVOKED_TOKEN		\N	4.29.1	\N	\N	3886352852
31725-index-persist-revoked-access-tokens	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-19 02:12:40.915297	143	EXECUTED	9:b994246ec2bf7c94da881e1d28782c7b	createIndex indexName=IDX_REV_TOKEN_ON_EXPIRE, tableName=REVOKED_TOKEN		\N	4.29.1	\N	\N	3886352852
26.0.0-idps-for-login	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-19 02:12:41.014733	144	EXECUTED	9:51f5fffadf986983d4bd59582c6c1604	addColumn tableName=IDENTITY_PROVIDER; createIndex indexName=IDX_IDP_REALM_ORG, tableName=IDENTITY_PROVIDER; createIndex indexName=IDX_IDP_FOR_LOGIN, tableName=IDENTITY_PROVIDER; customChange		\N	4.29.1	\N	\N	3886352852
26.0.0-32583-drop-redundant-index-on-client-session	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-19 02:12:41.049098	145	EXECUTED	9:24972d83bf27317a055d234187bb4af9	dropIndex indexName=IDX_US_SESS_ID_ON_CL_SESS, tableName=OFFLINE_CLIENT_SESSION		\N	4.29.1	\N	\N	3886352852
26.0.0.32582-remove-tables-user-session-user-session-note-and-client-session	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-19 02:12:41.063083	146	EXECUTED	9:febdc0f47f2ed241c59e60f58c3ceea5	dropTable tableName=CLIENT_SESSION_ROLE; dropTable tableName=CLIENT_SESSION_NOTE; dropTable tableName=CLIENT_SESSION_PROT_MAPPER; dropTable tableName=CLIENT_SESSION_AUTH_STATUS; dropTable tableName=CLIENT_USER_SESSION_NOTE; dropTable tableName=CLI...		\N	4.29.1	\N	\N	3886352852
26.0.0-33201-org-redirect-url	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-19 02:12:41.067247	147	EXECUTED	9:4d0e22b0ac68ebe9794fa9cb752ea660	addColumn tableName=ORG		\N	4.29.1	\N	\N	3886352852
29399-jdbc-ping-default	keycloak	META-INF/jpa-changelog-26.1.0.xml	2026-03-19 02:12:41.079571	148	EXECUTED	9:007dbe99d7203fca403b89d4edfdf21e	createTable tableName=JGROUPS_PING; addPrimaryKey constraintName=CONSTRAINT_JGROUPS_PING, tableName=JGROUPS_PING		\N	4.29.1	\N	\N	3886352852
26.1.0-34013	keycloak	META-INF/jpa-changelog-26.1.0.xml	2026-03-19 02:12:41.087044	149	EXECUTED	9:e6b686a15759aef99a6d758a5c4c6a26	addColumn tableName=ADMIN_EVENT_ENTITY		\N	4.29.1	\N	\N	3886352852
26.1.0-34380	keycloak	META-INF/jpa-changelog-26.1.0.xml	2026-03-19 02:12:41.091918	150	EXECUTED	9:ac8b9edb7c2b6c17a1c7a11fcf5ccf01	dropTable tableName=USERNAME_LOGIN_FAILURE		\N	4.29.1	\N	\N	3886352852
\.


--
-- Data for Name: databasechangeloglock; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.databasechangeloglock (id, locked, lockgranted, lockedby) FROM stdin;
1	f	\N	\N
1000	f	\N	\N
\.


--
-- Data for Name: default_client_scope; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.default_client_scope (realm_id, scope_id, default_scope) FROM stdin;
e4b40266-0967-452a-b1e2-26a574255a2d	a1fbb06c-2b0c-46bb-bb68-93e343952c5e	f
e4b40266-0967-452a-b1e2-26a574255a2d	b42a6548-86dd-4c7c-9c5f-8a9bedca6cea	t
e4b40266-0967-452a-b1e2-26a574255a2d	534591d0-0be7-46dd-a8df-7a788032b819	t
e4b40266-0967-452a-b1e2-26a574255a2d	38d9c618-b15f-48aa-ba54-7deaef86a617	t
e4b40266-0967-452a-b1e2-26a574255a2d	258b9096-f77e-43f3-9274-bb76ee82aa42	t
e4b40266-0967-452a-b1e2-26a574255a2d	e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9	f
e4b40266-0967-452a-b1e2-26a574255a2d	4b5261d2-b140-42e4-83f9-64a87dfbb513	f
e4b40266-0967-452a-b1e2-26a574255a2d	b8e2563f-e25a-4b9c-b981-dad3a682d3e6	t
e4b40266-0967-452a-b1e2-26a574255a2d	271c36ce-6de7-4ed2-a126-64dafad5701c	t
e4b40266-0967-452a-b1e2-26a574255a2d	4c314614-beff-43e1-a37e-7c3bb33bf108	f
e4b40266-0967-452a-b1e2-26a574255a2d	2184f94f-0889-4fc0-9e55-1fb82868829d	t
e4b40266-0967-452a-b1e2-26a574255a2d	bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a	t
e4b40266-0967-452a-b1e2-26a574255a2d	e75d2f91-2c3f-440a-98c4-439412e37175	f
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	e0834747-8b1d-4dcd-9520-019d711c62d2	f
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	d86339ea-230d-4d00-9acd-55f30d172409	t
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	e8b06218-b511-46e2-b20b-654afff68052	t
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	a4a1104a-493f-4d45-b0cb-94ad21ba9d00	t
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	48bac497-bb5d-4dc4-8827-632ecc31a9c4	t
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	a9f81487-aae0-4844-8066-be931ab3dc08	f
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	a6e4a039-7eda-42af-a1be-d97243616cb7	f
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	c7ebf3d6-e695-46cc-ac8c-75065ffc53cf	t
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	bdc45480-3be7-4f92-882e-34dabb5837b3	t
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	e8e74038-29cf-48e9-ab55-c80e757c6bb4	f
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	259a8e29-2ffd-472d-bb33-a06fbe28e7fb	t
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	74f3cc11-8fac-42ac-8fac-b2ff721c34a4	t
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	f6667d1b-9a1d-4a41-9fcf-4b15c97109ff	f
\.


--
-- Data for Name: event_entity; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.event_entity (id, client_id, details_json, error, ip_address, realm_id, session_id, event_time, type, user_id, details_json_long_value) FROM stdin;
\.


--
-- Data for Name: fed_user_attribute; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.fed_user_attribute (id, name, user_id, realm_id, storage_provider_id, value, long_value_hash, long_value_hash_lower_case, long_value) FROM stdin;
\.


--
-- Data for Name: fed_user_consent; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.fed_user_consent (id, client_id, user_id, realm_id, storage_provider_id, created_date, last_updated_date, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: fed_user_consent_cl_scope; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.fed_user_consent_cl_scope (user_consent_id, scope_id) FROM stdin;
\.


--
-- Data for Name: fed_user_credential; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.fed_user_credential (id, salt, type, created_date, user_id, realm_id, storage_provider_id, user_label, secret_data, credential_data, priority) FROM stdin;
\.


--
-- Data for Name: fed_user_group_membership; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.fed_user_group_membership (group_id, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: fed_user_required_action; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.fed_user_required_action (required_action, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: fed_user_role_mapping; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.fed_user_role_mapping (role_id, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: federated_identity; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.federated_identity (identity_provider, realm_id, federated_user_id, federated_username, token, user_id) FROM stdin;
\.


--
-- Data for Name: federated_user; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.federated_user (id, storage_provider_id, realm_id) FROM stdin;
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	create users	SQL	V1__create_users.sql	1025748560	stg_app	2026-03-16 03:19:28.33132	62	t
2	2	extend users for keycloak	SQL	V2__extend_users_for_keycloak.sql	-2139004311	stg_app	2026-03-16 03:19:28.501188	10	t
3	3	add game domain tables	SQL	V3__add_game_domain_tables.sql	90862805	stg_app	2026-03-16 03:19:28.539374	123	t
4	4	add user death stats	SQL	V4__add_user_death_stats.sql	-577216042	stg_app	2026-03-29 05:22:44.675482	12	t
5	5	create user death records	SQL	V5__create_user_death_records.sql	-748020187	stg_app	2026-03-29 05:22:44.712855	15	t
\.


--
-- Data for Name: group_attribute; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.group_attribute (id, name, value, group_id) FROM stdin;
\.


--
-- Data for Name: group_role_mapping; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.group_role_mapping (role_id, group_id) FROM stdin;
\.


--
-- Data for Name: identity_provider; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.identity_provider (internal_id, enabled, provider_alias, provider_id, store_token, authenticate_by_default, realm_id, add_token_role, trust_email, first_broker_login_flow_id, post_broker_login_flow_id, provider_display_name, link_only, organization_id, hide_on_login) FROM stdin;
\.


--
-- Data for Name: identity_provider_config; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.identity_provider_config (identity_provider_id, value, name) FROM stdin;
\.


--
-- Data for Name: identity_provider_mapper; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.identity_provider_mapper (id, name, idp_alias, idp_mapper_name, realm_id) FROM stdin;
\.


--
-- Data for Name: idp_mapper_config; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.idp_mapper_config (idp_mapper_id, value, name) FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.inventory_items (id, save_file_id, item_code, item_name, quantity, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: jgroups_ping; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.jgroups_ping (address, name, cluster_name, ip, coord) FROM stdin;
uuid://ac9a601a-f79f-4169-a5b6-dba92a038ded	a7fd41f00c68-19443	ISPN	172.18.0.11:7800	t
\.


--
-- Data for Name: keycloak_group; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.keycloak_group (id, name, parent_group, realm_id, type) FROM stdin;
\.


--
-- Data for Name: keycloak_role; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.keycloak_role (id, client_realm_constraint, client_role, description, name, realm_id, client, realm) FROM stdin;
3bef6e98-1dfb-4e70-90d6-9f8de5436ca3	e4b40266-0967-452a-b1e2-26a574255a2d	f	${role_default-roles}	default-roles-master	e4b40266-0967-452a-b1e2-26a574255a2d	\N	\N
30468660-4849-4ec2-b2d8-63dd45a55894	e4b40266-0967-452a-b1e2-26a574255a2d	f	${role_create-realm}	create-realm	e4b40266-0967-452a-b1e2-26a574255a2d	\N	\N
d1ee855c-d858-4e55-825e-c68258acd3ac	e4b40266-0967-452a-b1e2-26a574255a2d	f	${role_admin}	admin	e4b40266-0967-452a-b1e2-26a574255a2d	\N	\N
b9632c80-81c2-4d18-bcbf-f1f00c9e2e28	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_create-client}	create-client	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
5be0cf09-6b0c-4ce2-a19a-9c56ac992d7f	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_view-realm}	view-realm	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
93eb67f4-d49f-43a5-a2d5-dcf759ca16bb	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_view-users}	view-users	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
5864c705-c675-46f9-95f5-0e836cb1a1f0	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_view-clients}	view-clients	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
7e51bfc3-3214-423a-85b6-bd6a6e0a30ba	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_view-events}	view-events	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
a0eab88d-0f04-4dec-b56f-a8f7f9a98dfb	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_view-identity-providers}	view-identity-providers	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
30b7dac7-c258-4b2c-a050-c16e2067db8d	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_view-authorization}	view-authorization	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
28fef8be-f0cd-4dcc-bd33-7d803b37a1ba	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_manage-realm}	manage-realm	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
4217a257-0df7-45e8-ab2d-4b4c9616482c	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_manage-users}	manage-users	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
8a0f0ad8-c230-4d1b-92f2-5681b853bd79	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_manage-clients}	manage-clients	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
84508d44-73f9-458a-978b-13c77ede2d53	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_manage-events}	manage-events	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
19233ad4-9bed-4ed6-a9e0-ead652b85be1	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_manage-identity-providers}	manage-identity-providers	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
aec42a37-7e4b-45ff-94cb-2c3ba2fea095	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_manage-authorization}	manage-authorization	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
b9e02377-7a67-4f27-ad55-f7c883804612	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_query-users}	query-users	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
8fc3add6-0724-437b-9832-db4a402aa1ce	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_query-clients}	query-clients	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
6949867b-3e3c-4d9b-bfd3-c6c09b49a8bf	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_query-realms}	query-realms	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
66531030-20c5-4d81-bab4-9d557de3721a	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_query-groups}	query-groups	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
138cd119-5b1d-4550-939f-c2288a083410	8601052c-64a0-4aa2-8a44-6086ca390c4d	t	${role_view-profile}	view-profile	e4b40266-0967-452a-b1e2-26a574255a2d	8601052c-64a0-4aa2-8a44-6086ca390c4d	\N
28f280d1-aab5-4d39-89c0-956e65f3980f	8601052c-64a0-4aa2-8a44-6086ca390c4d	t	${role_manage-account}	manage-account	e4b40266-0967-452a-b1e2-26a574255a2d	8601052c-64a0-4aa2-8a44-6086ca390c4d	\N
39941995-9f43-4dfc-b7aa-a14297bd523d	8601052c-64a0-4aa2-8a44-6086ca390c4d	t	${role_manage-account-links}	manage-account-links	e4b40266-0967-452a-b1e2-26a574255a2d	8601052c-64a0-4aa2-8a44-6086ca390c4d	\N
3d61f9bd-fcb6-4719-8cdc-c31ead1ef6fd	8601052c-64a0-4aa2-8a44-6086ca390c4d	t	${role_view-applications}	view-applications	e4b40266-0967-452a-b1e2-26a574255a2d	8601052c-64a0-4aa2-8a44-6086ca390c4d	\N
64935e98-78c8-4b48-98f7-d2f13fb8dbcb	8601052c-64a0-4aa2-8a44-6086ca390c4d	t	${role_view-consent}	view-consent	e4b40266-0967-452a-b1e2-26a574255a2d	8601052c-64a0-4aa2-8a44-6086ca390c4d	\N
3e216513-20f4-4531-90c9-effdacf4f4fd	8601052c-64a0-4aa2-8a44-6086ca390c4d	t	${role_manage-consent}	manage-consent	e4b40266-0967-452a-b1e2-26a574255a2d	8601052c-64a0-4aa2-8a44-6086ca390c4d	\N
17f23e76-9e62-4b80-a860-3b748e296b2d	8601052c-64a0-4aa2-8a44-6086ca390c4d	t	${role_view-groups}	view-groups	e4b40266-0967-452a-b1e2-26a574255a2d	8601052c-64a0-4aa2-8a44-6086ca390c4d	\N
a0ead77b-7496-4673-8e84-f6eae06783ac	8601052c-64a0-4aa2-8a44-6086ca390c4d	t	${role_delete-account}	delete-account	e4b40266-0967-452a-b1e2-26a574255a2d	8601052c-64a0-4aa2-8a44-6086ca390c4d	\N
13e7d65d-fb27-4776-954e-7832ce66a784	f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	t	${role_read-token}	read-token	e4b40266-0967-452a-b1e2-26a574255a2d	f0f99867-7b9e-4a39-b947-36a6ddbfbc3b	\N
26fb05e9-f6b3-4d29-9762-254b5e11e956	7b2d0efa-a437-467b-84a3-e4f3459550bb	t	${role_impersonation}	impersonation	e4b40266-0967-452a-b1e2-26a574255a2d	7b2d0efa-a437-467b-84a3-e4f3459550bb	\N
f31952ff-06c4-462c-bab4-43968681c31e	e4b40266-0967-452a-b1e2-26a574255a2d	f	${role_offline-access}	offline_access	e4b40266-0967-452a-b1e2-26a574255a2d	\N	\N
bdb6d242-b780-4d23-80b8-2a81034db078	e4b40266-0967-452a-b1e2-26a574255a2d	f	${role_uma_authorization}	uma_authorization	e4b40266-0967-452a-b1e2-26a574255a2d	\N	\N
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	f	${role_default-roles}	default-roles-app	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	\N	\N
b492bc3c-d922-42c6-88a8-6cbe9c249857	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_create-client}	create-client	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
664cfab9-94e2-4ab4-8d55-3b6f2a717202	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_view-realm}	view-realm	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
d8465b4a-d6d3-4afb-980d-f1fde809f8fe	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_view-users}	view-users	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
c0301d9f-3955-4634-bf63-38f06fd99275	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_view-clients}	view-clients	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
cbca8d8d-9867-46a5-b9a3-04b7fcf9c425	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_view-events}	view-events	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
95876004-d9c1-43d9-b302-069e55a8fdc3	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_view-identity-providers}	view-identity-providers	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
0df01eb3-5a74-4114-9bba-47c2e18eb609	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_view-authorization}	view-authorization	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
9bc89631-4cc0-4440-b314-5829086be40d	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_manage-realm}	manage-realm	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
e5b47c0f-34e3-48d5-9028-146bbbf56118	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_manage-users}	manage-users	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
e000a62e-a11e-4383-aae2-91728bc89101	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_manage-clients}	manage-clients	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
bbfe2fd2-db4a-4f47-9a2b-d8489d101827	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_manage-events}	manage-events	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
840fc47b-17eb-463a-8156-7ae497b020e2	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_manage-identity-providers}	manage-identity-providers	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
f1725ff7-772d-4027-9a02-51d5957c2785	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_manage-authorization}	manage-authorization	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
1691e82c-5ae4-4614-ab35-6c25b2ba4898	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_query-users}	query-users	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
4672b086-f57b-4a89-866b-a2aba4bba5b6	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_query-clients}	query-clients	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
7e7bd523-289e-4c67-89e8-2fc68d807bfe	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_query-realms}	query-realms	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
b4c91ef0-ddbf-4258-80a8-f5223913d558	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_query-groups}	query-groups	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
b10f92ca-f0f6-45cf-b4a2-e4188216f17c	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_realm-admin}	realm-admin	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
19aef740-e582-40bf-951f-940a2a28c776	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_create-client}	create-client	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
a0b2d4e1-a9bf-4bb5-9038-68001c9222ed	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_view-realm}	view-realm	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
42e21786-3d7e-4f81-b361-f3ea7e0d9c20	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_view-users}	view-users	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
6b02f1d9-573f-4e0d-a2fb-fc7ebf3b57c8	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_view-clients}	view-clients	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
a1ff1334-ea1d-4824-b1c7-7f588f83be26	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_view-events}	view-events	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
f78cffd1-9fcd-46c5-9099-9893a5fd8072	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_view-identity-providers}	view-identity-providers	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
cfe216a3-1735-45fe-b6c1-fc70cf2aa25c	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_view-authorization}	view-authorization	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
f7ff8697-e7ce-451b-8f52-36269e60337e	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_manage-realm}	manage-realm	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
6148e890-2291-4c83-93b3-fd5904d26eee	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_manage-users}	manage-users	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
6d1130f6-ac68-49ca-a8b3-9a849c3fd521	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_manage-clients}	manage-clients	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
b21ececa-ee62-4156-8612-1969e75d1ac7	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_manage-events}	manage-events	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
5f0b7594-3221-4677-9ad5-a7fe33364e5b	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_manage-identity-providers}	manage-identity-providers	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
3ad01935-8c07-4a06-ab22-2e914a732c48	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_manage-authorization}	manage-authorization	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
5365d2aa-b1d0-49ec-b824-159158a1fa32	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_query-users}	query-users	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
29785926-d0a3-4e0b-a8e4-e7cf97c9c4ba	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_query-clients}	query-clients	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
328b6957-40f1-4470-985f-4bc814474b1d	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_query-realms}	query-realms	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
e7d41091-eee0-413c-b09a-8d28a781fdb6	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_query-groups}	query-groups	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
f0e3d488-d671-4550-852e-7a9c18987694	6769e5ef-51ad-41fa-b763-6215030eb3d8	t	${role_view-profile}	view-profile	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	6769e5ef-51ad-41fa-b763-6215030eb3d8	\N
09ffc33c-f53a-4f6a-95df-3376bce8eef1	6769e5ef-51ad-41fa-b763-6215030eb3d8	t	${role_manage-account}	manage-account	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	6769e5ef-51ad-41fa-b763-6215030eb3d8	\N
cb8f0bd9-764b-4b6f-985a-7b8b5ac9213c	6769e5ef-51ad-41fa-b763-6215030eb3d8	t	${role_manage-account-links}	manage-account-links	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	6769e5ef-51ad-41fa-b763-6215030eb3d8	\N
7983b3b3-b9e1-45b5-8621-61bdb35bd44c	6769e5ef-51ad-41fa-b763-6215030eb3d8	t	${role_view-applications}	view-applications	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	6769e5ef-51ad-41fa-b763-6215030eb3d8	\N
a99ada8a-212f-4fd0-8db5-568d9fb0e8e7	6769e5ef-51ad-41fa-b763-6215030eb3d8	t	${role_view-consent}	view-consent	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	6769e5ef-51ad-41fa-b763-6215030eb3d8	\N
2d5f73cd-c5ba-4e48-9c16-4f8cce6e0fa9	6769e5ef-51ad-41fa-b763-6215030eb3d8	t	${role_manage-consent}	manage-consent	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	6769e5ef-51ad-41fa-b763-6215030eb3d8	\N
473c2ddd-0866-4eb9-a694-d5583b236960	6769e5ef-51ad-41fa-b763-6215030eb3d8	t	${role_view-groups}	view-groups	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	6769e5ef-51ad-41fa-b763-6215030eb3d8	\N
4ce26486-c091-41db-be3f-ee8185447432	6769e5ef-51ad-41fa-b763-6215030eb3d8	t	${role_delete-account}	delete-account	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	6769e5ef-51ad-41fa-b763-6215030eb3d8	\N
8c454b60-7af5-49be-8157-16e9e9a94b1d	25edb070-4c40-451b-bfd9-5e4efcd153f7	t	${role_impersonation}	impersonation	e4b40266-0967-452a-b1e2-26a574255a2d	25edb070-4c40-451b-bfd9-5e4efcd153f7	\N
af6aeab8-b8db-4e83-8954-78095dff9f7f	3f42fb72-19bd-4838-8611-cc1b88b55c0b	t	${role_impersonation}	impersonation	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	3f42fb72-19bd-4838-8611-cc1b88b55c0b	\N
23de3666-6440-4e75-b58e-e0537660b46c	d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	t	${role_read-token}	read-token	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	d81ecc0f-d100-4b02-b4a2-ec96ba8c28af	\N
0d629b72-2b47-43d9-9857-9b12778e64e7	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	f	${role_offline-access}	offline_access	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	\N	\N
51573e04-5651-4753-b846-2b82956c1214	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	f	\N	player	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	\N	\N
6314ef06-ae05-4e6f-98d8-8766214aa76d	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	f	\N	admin	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	\N	\N
3f450a30-33b2-469c-aec2-a0db9d9ac72a	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	f	${role_uma_authorization}	uma_authorization	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	\N	\N
\.


--
-- Data for Name: migration_model; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.migration_model (id, version, update_time) FROM stdin;
7vxg2	26.1.5	1773886363
\.


--
-- Data for Name: offline_client_session; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.offline_client_session (user_session_id, client_id, offline_flag, "timestamp", data, client_storage_provider, external_client_id, version) FROM stdin;
\.


--
-- Data for Name: offline_user_session; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.offline_user_session (user_session_id, user_id, realm_id, created_on, offline_flag, data, last_session_refresh, broker_session_id, version) FROM stdin;
\.


--
-- Data for Name: org; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.org (id, enabled, realm_id, group_id, name, description, alias, redirect_url) FROM stdin;
\.


--
-- Data for Name: org_domain; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.org_domain (id, name, verified, org_id) FROM stdin;
\.


--
-- Data for Name: policy_config; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.policy_config (policy_id, name, value) FROM stdin;
\.


--
-- Data for Name: protocol_mapper; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.protocol_mapper (id, name, protocol, protocol_mapper_name, client_id, client_scope_id) FROM stdin;
35943c15-d40d-4af6-a36d-914351319921	audience resolve	openid-connect	oidc-audience-resolve-mapper	326a5eb7-4a21-4106-a30c-7f97c29d3fab	\N
a9449058-dc80-4548-babe-115ccfac7254	locale	openid-connect	oidc-usermodel-attribute-mapper	ada9c621-b0c0-4b02-b33e-011a78309041	\N
f26f50ce-4898-4f86-a376-078f4e903c67	role list	saml	saml-role-list-mapper	\N	b42a6548-86dd-4c7c-9c5f-8a9bedca6cea
7a1e0bba-db7f-4e7b-819c-c8e6f440d9cc	organization	saml	saml-organization-membership-mapper	\N	534591d0-0be7-46dd-a8df-7a788032b819
6e1853de-088f-40a4-8469-9ceb1d11309d	full name	openid-connect	oidc-full-name-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
d10b0e33-1891-485a-8a72-6764d92f1e6a	family name	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
7608a3b0-6043-4c96-afea-2b95679f809e	given name	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
5721710e-6467-4b0a-aebc-c3066b3045c3	middle name	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
b3d2dbd7-e851-4bc4-9395-c9851025c2f7	nickname	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
f20351c6-0de7-4c7a-887a-f169c4e1165a	username	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
9c4fa9bd-e1f1-4a7f-a301-ec91c962b77c	profile	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
cdb95387-de7b-4724-8d32-af0554f55184	picture	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
f84d2ccf-5554-43ce-a956-b47aabc00fc1	website	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
f600c7e7-3b5d-4b02-b34b-d1c91c453b90	gender	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
87735a22-34ba-4f31-abaa-8c952679b86f	birthdate	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
834ca7bf-ccb0-463b-b8c7-5d858f9646eb	zoneinfo	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
7af49e25-6619-4e8a-a5f4-f9e5c7204027	locale	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
332078f1-9c27-454a-a3d6-570d092e621c	updated at	openid-connect	oidc-usermodel-attribute-mapper	\N	38d9c618-b15f-48aa-ba54-7deaef86a617
60c7e418-4e0b-4ada-9d2c-8a1cb002e012	email	openid-connect	oidc-usermodel-attribute-mapper	\N	258b9096-f77e-43f3-9274-bb76ee82aa42
16e1f93a-d69a-4eb9-9a24-dd41b1e022c9	email verified	openid-connect	oidc-usermodel-property-mapper	\N	258b9096-f77e-43f3-9274-bb76ee82aa42
3181eae2-ce79-4b14-a709-9036ad8b4b29	address	openid-connect	oidc-address-mapper	\N	e7a86ea6-67f0-496d-9fbb-8dbbf5dad2d9
27bbc377-ddb4-42e8-ab97-61f7a300e886	phone number	openid-connect	oidc-usermodel-attribute-mapper	\N	4b5261d2-b140-42e4-83f9-64a87dfbb513
63456698-70c2-4ccf-b5f9-cf29cc2c076d	phone number verified	openid-connect	oidc-usermodel-attribute-mapper	\N	4b5261d2-b140-42e4-83f9-64a87dfbb513
cf498156-79eb-46a3-94de-c1224639f44b	realm roles	openid-connect	oidc-usermodel-realm-role-mapper	\N	b8e2563f-e25a-4b9c-b981-dad3a682d3e6
3b7b3ebb-7638-4125-bd8f-0e64035c424e	client roles	openid-connect	oidc-usermodel-client-role-mapper	\N	b8e2563f-e25a-4b9c-b981-dad3a682d3e6
03c24ec1-6a38-4a8f-919c-8f8d1697bb42	audience resolve	openid-connect	oidc-audience-resolve-mapper	\N	b8e2563f-e25a-4b9c-b981-dad3a682d3e6
ba140316-5b3d-47bf-a9db-3074c7c2e1c5	allowed web origins	openid-connect	oidc-allowed-origins-mapper	\N	271c36ce-6de7-4ed2-a126-64dafad5701c
c2f36538-95d7-42fd-8e7e-0c3f2bf33115	upn	openid-connect	oidc-usermodel-attribute-mapper	\N	4c314614-beff-43e1-a37e-7c3bb33bf108
16c8410d-f5d7-49ac-916f-063318a20aca	groups	openid-connect	oidc-usermodel-realm-role-mapper	\N	4c314614-beff-43e1-a37e-7c3bb33bf108
4714323e-586f-4ebd-9243-e8e37ffcdc87	acr loa level	openid-connect	oidc-acr-mapper	\N	2184f94f-0889-4fc0-9e55-1fb82868829d
86574db7-e15b-4959-9171-52deeb6fae86	auth_time	openid-connect	oidc-usersessionmodel-note-mapper	\N	bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a
5d557f69-4965-43ae-b0cd-6f99aaf3df65	sub	openid-connect	oidc-sub-mapper	\N	bc9f6cbb-7d56-4d34-9cc1-bcbf0ee59f4a
7769c6f3-cbab-478d-b7a6-1197b95ed7b3	Client ID	openid-connect	oidc-usersessionmodel-note-mapper	\N	22b3b841-ee9c-4b49-87f1-0dc2d3f3331f
fde6b251-d3f2-4f32-940d-e728dacc8d8e	Client Host	openid-connect	oidc-usersessionmodel-note-mapper	\N	22b3b841-ee9c-4b49-87f1-0dc2d3f3331f
7c017f82-9084-4ae4-987e-84213b15af75	Client IP Address	openid-connect	oidc-usersessionmodel-note-mapper	\N	22b3b841-ee9c-4b49-87f1-0dc2d3f3331f
023cb90c-090f-4393-aed3-0e19fb0a2dca	organization	openid-connect	oidc-organization-membership-mapper	\N	e75d2f91-2c3f-440a-98c4-439412e37175
daedde38-5c3e-4ed9-8624-2512e5af063b	audience resolve	openid-connect	oidc-audience-resolve-mapper	ed111216-43bb-40d4-81b7-c440a110de24	\N
6084355d-9259-4a8b-b4ed-e2a0e8dbfee8	role list	saml	saml-role-list-mapper	\N	d86339ea-230d-4d00-9acd-55f30d172409
45f269d7-9980-4c8e-8559-f71a910ef43c	organization	saml	saml-organization-membership-mapper	\N	e8b06218-b511-46e2-b20b-654afff68052
33c3fdb6-be38-44f1-af9d-9553bdd5277a	full name	openid-connect	oidc-full-name-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
e0384e52-5c00-46ba-8b37-eda8b0509782	family name	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
61f354fd-26c1-4514-955e-d1dd2805a9bf	given name	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
0aae6698-8c60-401d-b3fa-add1647bf239	middle name	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
aad3b5fb-f448-4a81-8574-0a5a8f944982	nickname	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
0cca4371-5dd2-4ebd-be06-360ef7d63478	username	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
0b30e419-24f0-4f8c-a729-b9701ea0da8a	profile	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
5fd236ee-346a-45e9-bfb6-f9ca3dd94847	picture	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
0f36adba-d442-415f-9e5c-fe8475517707	website	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
f309de94-e5c9-42cc-8b30-27797540eba0	gender	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
2591f64c-f9d8-4b5e-997e-9ef04898be35	birthdate	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
3b3eab86-c1cc-43fd-85c7-8e8271d6e49b	zoneinfo	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
c3c47880-9a46-4eee-ab7b-23617ec235f9	locale	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
f44dda61-e116-47df-8f00-dabec36cd735	updated at	openid-connect	oidc-usermodel-attribute-mapper	\N	a4a1104a-493f-4d45-b0cb-94ad21ba9d00
3cb9d869-b1f3-449a-b458-302a28ed440e	email	openid-connect	oidc-usermodel-attribute-mapper	\N	48bac497-bb5d-4dc4-8827-632ecc31a9c4
db015288-c54e-4d26-b1b1-57075e4aa76d	email verified	openid-connect	oidc-usermodel-property-mapper	\N	48bac497-bb5d-4dc4-8827-632ecc31a9c4
c84c03c5-98dc-4877-b874-bbe218508399	address	openid-connect	oidc-address-mapper	\N	a9f81487-aae0-4844-8066-be931ab3dc08
c3fd34d5-c038-49da-844b-4091de5100ea	phone number	openid-connect	oidc-usermodel-attribute-mapper	\N	a6e4a039-7eda-42af-a1be-d97243616cb7
46f93282-4339-42ae-84e2-649367c7d679	phone number verified	openid-connect	oidc-usermodel-attribute-mapper	\N	a6e4a039-7eda-42af-a1be-d97243616cb7
e6336088-dc0d-45b9-ae76-fedea1ff6b38	realm roles	openid-connect	oidc-usermodel-realm-role-mapper	\N	c7ebf3d6-e695-46cc-ac8c-75065ffc53cf
1cd48fa9-0ced-4495-a717-2b76388ef324	client roles	openid-connect	oidc-usermodel-client-role-mapper	\N	c7ebf3d6-e695-46cc-ac8c-75065ffc53cf
907e6a2b-388c-471d-9405-209ed39e79a1	audience resolve	openid-connect	oidc-audience-resolve-mapper	\N	c7ebf3d6-e695-46cc-ac8c-75065ffc53cf
1ea15793-f61a-4ead-bda7-f7db5863f1dc	allowed web origins	openid-connect	oidc-allowed-origins-mapper	\N	bdc45480-3be7-4f92-882e-34dabb5837b3
b11f2bc5-5e4b-4680-b073-8aba210edb8f	upn	openid-connect	oidc-usermodel-attribute-mapper	\N	e8e74038-29cf-48e9-ab55-c80e757c6bb4
497bb293-35bd-4a1e-b08e-29c24643e918	groups	openid-connect	oidc-usermodel-realm-role-mapper	\N	e8e74038-29cf-48e9-ab55-c80e757c6bb4
53116bfc-52d2-4322-ba17-9c309b049115	acr loa level	openid-connect	oidc-acr-mapper	\N	259a8e29-2ffd-472d-bb33-a06fbe28e7fb
593ab621-9be2-40f4-a0bc-1c6f743df053	auth_time	openid-connect	oidc-usersessionmodel-note-mapper	\N	74f3cc11-8fac-42ac-8fac-b2ff721c34a4
e7cbf409-5a9e-4259-bb5a-6fe02b63e6ef	sub	openid-connect	oidc-sub-mapper	\N	74f3cc11-8fac-42ac-8fac-b2ff721c34a4
abd4cf07-7b74-4d28-b38c-7093fb295352	Client ID	openid-connect	oidc-usersessionmodel-note-mapper	\N	08d1cbce-b904-462f-8916-270a0a58cc51
6e933d5d-7fb9-45f4-8b87-64212a411933	Client Host	openid-connect	oidc-usersessionmodel-note-mapper	\N	08d1cbce-b904-462f-8916-270a0a58cc51
bb4e0376-b116-4440-9bac-1e6f11e075f2	Client IP Address	openid-connect	oidc-usersessionmodel-note-mapper	\N	08d1cbce-b904-462f-8916-270a0a58cc51
e45afb88-9adf-4496-acc8-a72eaa85b059	organization	openid-connect	oidc-organization-membership-mapper	\N	f6667d1b-9a1d-4a41-9fcf-4b15c97109ff
fef43e8a-efa2-4324-964e-1415afcfc70b	locale	openid-connect	oidc-usermodel-attribute-mapper	874892be-6f1d-4646-a497-cf38baa87865	\N
\.


--
-- Data for Name: protocol_mapper_config; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.protocol_mapper_config (protocol_mapper_id, value, name) FROM stdin;
a9449058-dc80-4548-babe-115ccfac7254	true	introspection.token.claim
a9449058-dc80-4548-babe-115ccfac7254	true	userinfo.token.claim
a9449058-dc80-4548-babe-115ccfac7254	locale	user.attribute
a9449058-dc80-4548-babe-115ccfac7254	true	id.token.claim
a9449058-dc80-4548-babe-115ccfac7254	true	access.token.claim
a9449058-dc80-4548-babe-115ccfac7254	locale	claim.name
a9449058-dc80-4548-babe-115ccfac7254	String	jsonType.label
f26f50ce-4898-4f86-a376-078f4e903c67	false	single
f26f50ce-4898-4f86-a376-078f4e903c67	Basic	attribute.nameformat
f26f50ce-4898-4f86-a376-078f4e903c67	Role	attribute.name
332078f1-9c27-454a-a3d6-570d092e621c	true	introspection.token.claim
332078f1-9c27-454a-a3d6-570d092e621c	true	userinfo.token.claim
332078f1-9c27-454a-a3d6-570d092e621c	updatedAt	user.attribute
332078f1-9c27-454a-a3d6-570d092e621c	true	id.token.claim
332078f1-9c27-454a-a3d6-570d092e621c	true	access.token.claim
332078f1-9c27-454a-a3d6-570d092e621c	updated_at	claim.name
332078f1-9c27-454a-a3d6-570d092e621c	long	jsonType.label
5721710e-6467-4b0a-aebc-c3066b3045c3	true	introspection.token.claim
5721710e-6467-4b0a-aebc-c3066b3045c3	true	userinfo.token.claim
5721710e-6467-4b0a-aebc-c3066b3045c3	middleName	user.attribute
5721710e-6467-4b0a-aebc-c3066b3045c3	true	id.token.claim
5721710e-6467-4b0a-aebc-c3066b3045c3	true	access.token.claim
5721710e-6467-4b0a-aebc-c3066b3045c3	middle_name	claim.name
5721710e-6467-4b0a-aebc-c3066b3045c3	String	jsonType.label
6e1853de-088f-40a4-8469-9ceb1d11309d	true	introspection.token.claim
6e1853de-088f-40a4-8469-9ceb1d11309d	true	userinfo.token.claim
6e1853de-088f-40a4-8469-9ceb1d11309d	true	id.token.claim
6e1853de-088f-40a4-8469-9ceb1d11309d	true	access.token.claim
7608a3b0-6043-4c96-afea-2b95679f809e	true	introspection.token.claim
7608a3b0-6043-4c96-afea-2b95679f809e	true	userinfo.token.claim
7608a3b0-6043-4c96-afea-2b95679f809e	firstName	user.attribute
7608a3b0-6043-4c96-afea-2b95679f809e	true	id.token.claim
7608a3b0-6043-4c96-afea-2b95679f809e	true	access.token.claim
7608a3b0-6043-4c96-afea-2b95679f809e	given_name	claim.name
7608a3b0-6043-4c96-afea-2b95679f809e	String	jsonType.label
7af49e25-6619-4e8a-a5f4-f9e5c7204027	true	introspection.token.claim
7af49e25-6619-4e8a-a5f4-f9e5c7204027	true	userinfo.token.claim
7af49e25-6619-4e8a-a5f4-f9e5c7204027	locale	user.attribute
7af49e25-6619-4e8a-a5f4-f9e5c7204027	true	id.token.claim
7af49e25-6619-4e8a-a5f4-f9e5c7204027	true	access.token.claim
7af49e25-6619-4e8a-a5f4-f9e5c7204027	locale	claim.name
7af49e25-6619-4e8a-a5f4-f9e5c7204027	String	jsonType.label
834ca7bf-ccb0-463b-b8c7-5d858f9646eb	true	introspection.token.claim
834ca7bf-ccb0-463b-b8c7-5d858f9646eb	true	userinfo.token.claim
834ca7bf-ccb0-463b-b8c7-5d858f9646eb	zoneinfo	user.attribute
834ca7bf-ccb0-463b-b8c7-5d858f9646eb	true	id.token.claim
834ca7bf-ccb0-463b-b8c7-5d858f9646eb	true	access.token.claim
834ca7bf-ccb0-463b-b8c7-5d858f9646eb	zoneinfo	claim.name
834ca7bf-ccb0-463b-b8c7-5d858f9646eb	String	jsonType.label
87735a22-34ba-4f31-abaa-8c952679b86f	true	introspection.token.claim
87735a22-34ba-4f31-abaa-8c952679b86f	true	userinfo.token.claim
87735a22-34ba-4f31-abaa-8c952679b86f	birthdate	user.attribute
87735a22-34ba-4f31-abaa-8c952679b86f	true	id.token.claim
87735a22-34ba-4f31-abaa-8c952679b86f	true	access.token.claim
87735a22-34ba-4f31-abaa-8c952679b86f	birthdate	claim.name
87735a22-34ba-4f31-abaa-8c952679b86f	String	jsonType.label
9c4fa9bd-e1f1-4a7f-a301-ec91c962b77c	true	introspection.token.claim
9c4fa9bd-e1f1-4a7f-a301-ec91c962b77c	true	userinfo.token.claim
9c4fa9bd-e1f1-4a7f-a301-ec91c962b77c	profile	user.attribute
9c4fa9bd-e1f1-4a7f-a301-ec91c962b77c	true	id.token.claim
9c4fa9bd-e1f1-4a7f-a301-ec91c962b77c	true	access.token.claim
9c4fa9bd-e1f1-4a7f-a301-ec91c962b77c	profile	claim.name
9c4fa9bd-e1f1-4a7f-a301-ec91c962b77c	String	jsonType.label
b3d2dbd7-e851-4bc4-9395-c9851025c2f7	true	introspection.token.claim
b3d2dbd7-e851-4bc4-9395-c9851025c2f7	true	userinfo.token.claim
b3d2dbd7-e851-4bc4-9395-c9851025c2f7	nickname	user.attribute
b3d2dbd7-e851-4bc4-9395-c9851025c2f7	true	id.token.claim
b3d2dbd7-e851-4bc4-9395-c9851025c2f7	true	access.token.claim
b3d2dbd7-e851-4bc4-9395-c9851025c2f7	nickname	claim.name
b3d2dbd7-e851-4bc4-9395-c9851025c2f7	String	jsonType.label
cdb95387-de7b-4724-8d32-af0554f55184	true	introspection.token.claim
cdb95387-de7b-4724-8d32-af0554f55184	true	userinfo.token.claim
cdb95387-de7b-4724-8d32-af0554f55184	picture	user.attribute
cdb95387-de7b-4724-8d32-af0554f55184	true	id.token.claim
cdb95387-de7b-4724-8d32-af0554f55184	true	access.token.claim
cdb95387-de7b-4724-8d32-af0554f55184	picture	claim.name
cdb95387-de7b-4724-8d32-af0554f55184	String	jsonType.label
d10b0e33-1891-485a-8a72-6764d92f1e6a	true	introspection.token.claim
d10b0e33-1891-485a-8a72-6764d92f1e6a	true	userinfo.token.claim
d10b0e33-1891-485a-8a72-6764d92f1e6a	lastName	user.attribute
d10b0e33-1891-485a-8a72-6764d92f1e6a	true	id.token.claim
d10b0e33-1891-485a-8a72-6764d92f1e6a	true	access.token.claim
d10b0e33-1891-485a-8a72-6764d92f1e6a	family_name	claim.name
d10b0e33-1891-485a-8a72-6764d92f1e6a	String	jsonType.label
f20351c6-0de7-4c7a-887a-f169c4e1165a	true	introspection.token.claim
f20351c6-0de7-4c7a-887a-f169c4e1165a	true	userinfo.token.claim
f20351c6-0de7-4c7a-887a-f169c4e1165a	username	user.attribute
f20351c6-0de7-4c7a-887a-f169c4e1165a	true	id.token.claim
f20351c6-0de7-4c7a-887a-f169c4e1165a	true	access.token.claim
f20351c6-0de7-4c7a-887a-f169c4e1165a	preferred_username	claim.name
f20351c6-0de7-4c7a-887a-f169c4e1165a	String	jsonType.label
f600c7e7-3b5d-4b02-b34b-d1c91c453b90	true	introspection.token.claim
f600c7e7-3b5d-4b02-b34b-d1c91c453b90	true	userinfo.token.claim
f600c7e7-3b5d-4b02-b34b-d1c91c453b90	gender	user.attribute
f600c7e7-3b5d-4b02-b34b-d1c91c453b90	true	id.token.claim
f600c7e7-3b5d-4b02-b34b-d1c91c453b90	true	access.token.claim
f600c7e7-3b5d-4b02-b34b-d1c91c453b90	gender	claim.name
f600c7e7-3b5d-4b02-b34b-d1c91c453b90	String	jsonType.label
f84d2ccf-5554-43ce-a956-b47aabc00fc1	true	introspection.token.claim
f84d2ccf-5554-43ce-a956-b47aabc00fc1	true	userinfo.token.claim
f84d2ccf-5554-43ce-a956-b47aabc00fc1	website	user.attribute
f84d2ccf-5554-43ce-a956-b47aabc00fc1	true	id.token.claim
f84d2ccf-5554-43ce-a956-b47aabc00fc1	true	access.token.claim
f84d2ccf-5554-43ce-a956-b47aabc00fc1	website	claim.name
f84d2ccf-5554-43ce-a956-b47aabc00fc1	String	jsonType.label
16e1f93a-d69a-4eb9-9a24-dd41b1e022c9	true	introspection.token.claim
16e1f93a-d69a-4eb9-9a24-dd41b1e022c9	true	userinfo.token.claim
16e1f93a-d69a-4eb9-9a24-dd41b1e022c9	emailVerified	user.attribute
16e1f93a-d69a-4eb9-9a24-dd41b1e022c9	true	id.token.claim
16e1f93a-d69a-4eb9-9a24-dd41b1e022c9	true	access.token.claim
16e1f93a-d69a-4eb9-9a24-dd41b1e022c9	email_verified	claim.name
16e1f93a-d69a-4eb9-9a24-dd41b1e022c9	boolean	jsonType.label
60c7e418-4e0b-4ada-9d2c-8a1cb002e012	true	introspection.token.claim
60c7e418-4e0b-4ada-9d2c-8a1cb002e012	true	userinfo.token.claim
60c7e418-4e0b-4ada-9d2c-8a1cb002e012	email	user.attribute
60c7e418-4e0b-4ada-9d2c-8a1cb002e012	true	id.token.claim
60c7e418-4e0b-4ada-9d2c-8a1cb002e012	true	access.token.claim
60c7e418-4e0b-4ada-9d2c-8a1cb002e012	email	claim.name
60c7e418-4e0b-4ada-9d2c-8a1cb002e012	String	jsonType.label
3181eae2-ce79-4b14-a709-9036ad8b4b29	formatted	user.attribute.formatted
3181eae2-ce79-4b14-a709-9036ad8b4b29	country	user.attribute.country
3181eae2-ce79-4b14-a709-9036ad8b4b29	true	introspection.token.claim
3181eae2-ce79-4b14-a709-9036ad8b4b29	postal_code	user.attribute.postal_code
3181eae2-ce79-4b14-a709-9036ad8b4b29	true	userinfo.token.claim
3181eae2-ce79-4b14-a709-9036ad8b4b29	street	user.attribute.street
3181eae2-ce79-4b14-a709-9036ad8b4b29	true	id.token.claim
3181eae2-ce79-4b14-a709-9036ad8b4b29	region	user.attribute.region
3181eae2-ce79-4b14-a709-9036ad8b4b29	true	access.token.claim
3181eae2-ce79-4b14-a709-9036ad8b4b29	locality	user.attribute.locality
27bbc377-ddb4-42e8-ab97-61f7a300e886	true	introspection.token.claim
27bbc377-ddb4-42e8-ab97-61f7a300e886	true	userinfo.token.claim
27bbc377-ddb4-42e8-ab97-61f7a300e886	phoneNumber	user.attribute
27bbc377-ddb4-42e8-ab97-61f7a300e886	true	id.token.claim
27bbc377-ddb4-42e8-ab97-61f7a300e886	true	access.token.claim
27bbc377-ddb4-42e8-ab97-61f7a300e886	phone_number	claim.name
27bbc377-ddb4-42e8-ab97-61f7a300e886	String	jsonType.label
63456698-70c2-4ccf-b5f9-cf29cc2c076d	true	introspection.token.claim
63456698-70c2-4ccf-b5f9-cf29cc2c076d	true	userinfo.token.claim
63456698-70c2-4ccf-b5f9-cf29cc2c076d	phoneNumberVerified	user.attribute
63456698-70c2-4ccf-b5f9-cf29cc2c076d	true	id.token.claim
63456698-70c2-4ccf-b5f9-cf29cc2c076d	true	access.token.claim
63456698-70c2-4ccf-b5f9-cf29cc2c076d	phone_number_verified	claim.name
63456698-70c2-4ccf-b5f9-cf29cc2c076d	boolean	jsonType.label
03c24ec1-6a38-4a8f-919c-8f8d1697bb42	true	introspection.token.claim
03c24ec1-6a38-4a8f-919c-8f8d1697bb42	true	access.token.claim
3b7b3ebb-7638-4125-bd8f-0e64035c424e	true	introspection.token.claim
3b7b3ebb-7638-4125-bd8f-0e64035c424e	true	multivalued
3b7b3ebb-7638-4125-bd8f-0e64035c424e	foo	user.attribute
3b7b3ebb-7638-4125-bd8f-0e64035c424e	true	access.token.claim
3b7b3ebb-7638-4125-bd8f-0e64035c424e	resource_access.${client_id}.roles	claim.name
3b7b3ebb-7638-4125-bd8f-0e64035c424e	String	jsonType.label
cf498156-79eb-46a3-94de-c1224639f44b	true	introspection.token.claim
cf498156-79eb-46a3-94de-c1224639f44b	true	multivalued
cf498156-79eb-46a3-94de-c1224639f44b	foo	user.attribute
cf498156-79eb-46a3-94de-c1224639f44b	true	access.token.claim
cf498156-79eb-46a3-94de-c1224639f44b	realm_access.roles	claim.name
cf498156-79eb-46a3-94de-c1224639f44b	String	jsonType.label
ba140316-5b3d-47bf-a9db-3074c7c2e1c5	true	introspection.token.claim
ba140316-5b3d-47bf-a9db-3074c7c2e1c5	true	access.token.claim
16c8410d-f5d7-49ac-916f-063318a20aca	true	introspection.token.claim
16c8410d-f5d7-49ac-916f-063318a20aca	true	multivalued
16c8410d-f5d7-49ac-916f-063318a20aca	foo	user.attribute
16c8410d-f5d7-49ac-916f-063318a20aca	true	id.token.claim
16c8410d-f5d7-49ac-916f-063318a20aca	true	access.token.claim
16c8410d-f5d7-49ac-916f-063318a20aca	groups	claim.name
16c8410d-f5d7-49ac-916f-063318a20aca	String	jsonType.label
c2f36538-95d7-42fd-8e7e-0c3f2bf33115	true	introspection.token.claim
c2f36538-95d7-42fd-8e7e-0c3f2bf33115	true	userinfo.token.claim
c2f36538-95d7-42fd-8e7e-0c3f2bf33115	username	user.attribute
c2f36538-95d7-42fd-8e7e-0c3f2bf33115	true	id.token.claim
c2f36538-95d7-42fd-8e7e-0c3f2bf33115	true	access.token.claim
c2f36538-95d7-42fd-8e7e-0c3f2bf33115	upn	claim.name
c2f36538-95d7-42fd-8e7e-0c3f2bf33115	String	jsonType.label
4714323e-586f-4ebd-9243-e8e37ffcdc87	true	introspection.token.claim
4714323e-586f-4ebd-9243-e8e37ffcdc87	true	id.token.claim
4714323e-586f-4ebd-9243-e8e37ffcdc87	true	access.token.claim
5d557f69-4965-43ae-b0cd-6f99aaf3df65	true	introspection.token.claim
5d557f69-4965-43ae-b0cd-6f99aaf3df65	true	access.token.claim
86574db7-e15b-4959-9171-52deeb6fae86	AUTH_TIME	user.session.note
86574db7-e15b-4959-9171-52deeb6fae86	true	introspection.token.claim
86574db7-e15b-4959-9171-52deeb6fae86	true	id.token.claim
86574db7-e15b-4959-9171-52deeb6fae86	true	access.token.claim
86574db7-e15b-4959-9171-52deeb6fae86	auth_time	claim.name
86574db7-e15b-4959-9171-52deeb6fae86	long	jsonType.label
7769c6f3-cbab-478d-b7a6-1197b95ed7b3	client_id	user.session.note
7769c6f3-cbab-478d-b7a6-1197b95ed7b3	true	introspection.token.claim
7769c6f3-cbab-478d-b7a6-1197b95ed7b3	true	id.token.claim
7769c6f3-cbab-478d-b7a6-1197b95ed7b3	true	access.token.claim
7769c6f3-cbab-478d-b7a6-1197b95ed7b3	client_id	claim.name
7769c6f3-cbab-478d-b7a6-1197b95ed7b3	String	jsonType.label
7c017f82-9084-4ae4-987e-84213b15af75	clientAddress	user.session.note
7c017f82-9084-4ae4-987e-84213b15af75	true	introspection.token.claim
7c017f82-9084-4ae4-987e-84213b15af75	true	id.token.claim
7c017f82-9084-4ae4-987e-84213b15af75	true	access.token.claim
7c017f82-9084-4ae4-987e-84213b15af75	clientAddress	claim.name
7c017f82-9084-4ae4-987e-84213b15af75	String	jsonType.label
fde6b251-d3f2-4f32-940d-e728dacc8d8e	clientHost	user.session.note
fde6b251-d3f2-4f32-940d-e728dacc8d8e	true	introspection.token.claim
fde6b251-d3f2-4f32-940d-e728dacc8d8e	true	id.token.claim
fde6b251-d3f2-4f32-940d-e728dacc8d8e	true	access.token.claim
fde6b251-d3f2-4f32-940d-e728dacc8d8e	clientHost	claim.name
fde6b251-d3f2-4f32-940d-e728dacc8d8e	String	jsonType.label
023cb90c-090f-4393-aed3-0e19fb0a2dca	true	introspection.token.claim
023cb90c-090f-4393-aed3-0e19fb0a2dca	true	multivalued
023cb90c-090f-4393-aed3-0e19fb0a2dca	true	id.token.claim
023cb90c-090f-4393-aed3-0e19fb0a2dca	true	access.token.claim
023cb90c-090f-4393-aed3-0e19fb0a2dca	organization	claim.name
023cb90c-090f-4393-aed3-0e19fb0a2dca	String	jsonType.label
6084355d-9259-4a8b-b4ed-e2a0e8dbfee8	false	single
6084355d-9259-4a8b-b4ed-e2a0e8dbfee8	Basic	attribute.nameformat
6084355d-9259-4a8b-b4ed-e2a0e8dbfee8	Role	attribute.name
0aae6698-8c60-401d-b3fa-add1647bf239	true	introspection.token.claim
0aae6698-8c60-401d-b3fa-add1647bf239	true	userinfo.token.claim
0aae6698-8c60-401d-b3fa-add1647bf239	middleName	user.attribute
0aae6698-8c60-401d-b3fa-add1647bf239	true	id.token.claim
0aae6698-8c60-401d-b3fa-add1647bf239	true	access.token.claim
0aae6698-8c60-401d-b3fa-add1647bf239	middle_name	claim.name
0aae6698-8c60-401d-b3fa-add1647bf239	String	jsonType.label
0b30e419-24f0-4f8c-a729-b9701ea0da8a	true	introspection.token.claim
0b30e419-24f0-4f8c-a729-b9701ea0da8a	true	userinfo.token.claim
0b30e419-24f0-4f8c-a729-b9701ea0da8a	profile	user.attribute
0b30e419-24f0-4f8c-a729-b9701ea0da8a	true	id.token.claim
0b30e419-24f0-4f8c-a729-b9701ea0da8a	true	access.token.claim
0b30e419-24f0-4f8c-a729-b9701ea0da8a	profile	claim.name
0b30e419-24f0-4f8c-a729-b9701ea0da8a	String	jsonType.label
0cca4371-5dd2-4ebd-be06-360ef7d63478	true	introspection.token.claim
0cca4371-5dd2-4ebd-be06-360ef7d63478	true	userinfo.token.claim
0cca4371-5dd2-4ebd-be06-360ef7d63478	username	user.attribute
0cca4371-5dd2-4ebd-be06-360ef7d63478	true	id.token.claim
0cca4371-5dd2-4ebd-be06-360ef7d63478	true	access.token.claim
0cca4371-5dd2-4ebd-be06-360ef7d63478	preferred_username	claim.name
0cca4371-5dd2-4ebd-be06-360ef7d63478	String	jsonType.label
0f36adba-d442-415f-9e5c-fe8475517707	true	introspection.token.claim
0f36adba-d442-415f-9e5c-fe8475517707	true	userinfo.token.claim
0f36adba-d442-415f-9e5c-fe8475517707	website	user.attribute
0f36adba-d442-415f-9e5c-fe8475517707	true	id.token.claim
0f36adba-d442-415f-9e5c-fe8475517707	true	access.token.claim
0f36adba-d442-415f-9e5c-fe8475517707	website	claim.name
0f36adba-d442-415f-9e5c-fe8475517707	String	jsonType.label
2591f64c-f9d8-4b5e-997e-9ef04898be35	true	introspection.token.claim
2591f64c-f9d8-4b5e-997e-9ef04898be35	true	userinfo.token.claim
2591f64c-f9d8-4b5e-997e-9ef04898be35	birthdate	user.attribute
2591f64c-f9d8-4b5e-997e-9ef04898be35	true	id.token.claim
2591f64c-f9d8-4b5e-997e-9ef04898be35	true	access.token.claim
2591f64c-f9d8-4b5e-997e-9ef04898be35	birthdate	claim.name
2591f64c-f9d8-4b5e-997e-9ef04898be35	String	jsonType.label
33c3fdb6-be38-44f1-af9d-9553bdd5277a	true	introspection.token.claim
33c3fdb6-be38-44f1-af9d-9553bdd5277a	true	userinfo.token.claim
33c3fdb6-be38-44f1-af9d-9553bdd5277a	true	id.token.claim
33c3fdb6-be38-44f1-af9d-9553bdd5277a	true	access.token.claim
3b3eab86-c1cc-43fd-85c7-8e8271d6e49b	true	introspection.token.claim
3b3eab86-c1cc-43fd-85c7-8e8271d6e49b	true	userinfo.token.claim
3b3eab86-c1cc-43fd-85c7-8e8271d6e49b	zoneinfo	user.attribute
3b3eab86-c1cc-43fd-85c7-8e8271d6e49b	true	id.token.claim
3b3eab86-c1cc-43fd-85c7-8e8271d6e49b	true	access.token.claim
3b3eab86-c1cc-43fd-85c7-8e8271d6e49b	zoneinfo	claim.name
3b3eab86-c1cc-43fd-85c7-8e8271d6e49b	String	jsonType.label
5fd236ee-346a-45e9-bfb6-f9ca3dd94847	true	introspection.token.claim
5fd236ee-346a-45e9-bfb6-f9ca3dd94847	true	userinfo.token.claim
5fd236ee-346a-45e9-bfb6-f9ca3dd94847	picture	user.attribute
5fd236ee-346a-45e9-bfb6-f9ca3dd94847	true	id.token.claim
5fd236ee-346a-45e9-bfb6-f9ca3dd94847	true	access.token.claim
5fd236ee-346a-45e9-bfb6-f9ca3dd94847	picture	claim.name
5fd236ee-346a-45e9-bfb6-f9ca3dd94847	String	jsonType.label
61f354fd-26c1-4514-955e-d1dd2805a9bf	true	introspection.token.claim
61f354fd-26c1-4514-955e-d1dd2805a9bf	true	userinfo.token.claim
61f354fd-26c1-4514-955e-d1dd2805a9bf	firstName	user.attribute
61f354fd-26c1-4514-955e-d1dd2805a9bf	true	id.token.claim
61f354fd-26c1-4514-955e-d1dd2805a9bf	true	access.token.claim
61f354fd-26c1-4514-955e-d1dd2805a9bf	given_name	claim.name
61f354fd-26c1-4514-955e-d1dd2805a9bf	String	jsonType.label
aad3b5fb-f448-4a81-8574-0a5a8f944982	true	introspection.token.claim
aad3b5fb-f448-4a81-8574-0a5a8f944982	true	userinfo.token.claim
aad3b5fb-f448-4a81-8574-0a5a8f944982	nickname	user.attribute
aad3b5fb-f448-4a81-8574-0a5a8f944982	true	id.token.claim
aad3b5fb-f448-4a81-8574-0a5a8f944982	true	access.token.claim
aad3b5fb-f448-4a81-8574-0a5a8f944982	nickname	claim.name
aad3b5fb-f448-4a81-8574-0a5a8f944982	String	jsonType.label
c3c47880-9a46-4eee-ab7b-23617ec235f9	true	introspection.token.claim
c3c47880-9a46-4eee-ab7b-23617ec235f9	true	userinfo.token.claim
c3c47880-9a46-4eee-ab7b-23617ec235f9	locale	user.attribute
c3c47880-9a46-4eee-ab7b-23617ec235f9	true	id.token.claim
c3c47880-9a46-4eee-ab7b-23617ec235f9	true	access.token.claim
c3c47880-9a46-4eee-ab7b-23617ec235f9	locale	claim.name
c3c47880-9a46-4eee-ab7b-23617ec235f9	String	jsonType.label
e0384e52-5c00-46ba-8b37-eda8b0509782	true	introspection.token.claim
e0384e52-5c00-46ba-8b37-eda8b0509782	true	userinfo.token.claim
e0384e52-5c00-46ba-8b37-eda8b0509782	lastName	user.attribute
e0384e52-5c00-46ba-8b37-eda8b0509782	true	id.token.claim
e0384e52-5c00-46ba-8b37-eda8b0509782	true	access.token.claim
e0384e52-5c00-46ba-8b37-eda8b0509782	family_name	claim.name
e0384e52-5c00-46ba-8b37-eda8b0509782	String	jsonType.label
f309de94-e5c9-42cc-8b30-27797540eba0	true	introspection.token.claim
f309de94-e5c9-42cc-8b30-27797540eba0	true	userinfo.token.claim
f309de94-e5c9-42cc-8b30-27797540eba0	gender	user.attribute
f309de94-e5c9-42cc-8b30-27797540eba0	true	id.token.claim
f309de94-e5c9-42cc-8b30-27797540eba0	true	access.token.claim
f309de94-e5c9-42cc-8b30-27797540eba0	gender	claim.name
f309de94-e5c9-42cc-8b30-27797540eba0	String	jsonType.label
f44dda61-e116-47df-8f00-dabec36cd735	true	introspection.token.claim
f44dda61-e116-47df-8f00-dabec36cd735	true	userinfo.token.claim
f44dda61-e116-47df-8f00-dabec36cd735	updatedAt	user.attribute
f44dda61-e116-47df-8f00-dabec36cd735	true	id.token.claim
f44dda61-e116-47df-8f00-dabec36cd735	true	access.token.claim
f44dda61-e116-47df-8f00-dabec36cd735	updated_at	claim.name
f44dda61-e116-47df-8f00-dabec36cd735	long	jsonType.label
3cb9d869-b1f3-449a-b458-302a28ed440e	true	introspection.token.claim
3cb9d869-b1f3-449a-b458-302a28ed440e	true	userinfo.token.claim
3cb9d869-b1f3-449a-b458-302a28ed440e	email	user.attribute
3cb9d869-b1f3-449a-b458-302a28ed440e	true	id.token.claim
3cb9d869-b1f3-449a-b458-302a28ed440e	true	access.token.claim
3cb9d869-b1f3-449a-b458-302a28ed440e	email	claim.name
3cb9d869-b1f3-449a-b458-302a28ed440e	String	jsonType.label
db015288-c54e-4d26-b1b1-57075e4aa76d	true	introspection.token.claim
db015288-c54e-4d26-b1b1-57075e4aa76d	true	userinfo.token.claim
db015288-c54e-4d26-b1b1-57075e4aa76d	emailVerified	user.attribute
db015288-c54e-4d26-b1b1-57075e4aa76d	true	id.token.claim
db015288-c54e-4d26-b1b1-57075e4aa76d	true	access.token.claim
db015288-c54e-4d26-b1b1-57075e4aa76d	email_verified	claim.name
db015288-c54e-4d26-b1b1-57075e4aa76d	boolean	jsonType.label
c84c03c5-98dc-4877-b874-bbe218508399	formatted	user.attribute.formatted
c84c03c5-98dc-4877-b874-bbe218508399	country	user.attribute.country
c84c03c5-98dc-4877-b874-bbe218508399	true	introspection.token.claim
c84c03c5-98dc-4877-b874-bbe218508399	postal_code	user.attribute.postal_code
c84c03c5-98dc-4877-b874-bbe218508399	true	userinfo.token.claim
c84c03c5-98dc-4877-b874-bbe218508399	street	user.attribute.street
c84c03c5-98dc-4877-b874-bbe218508399	true	id.token.claim
c84c03c5-98dc-4877-b874-bbe218508399	region	user.attribute.region
c84c03c5-98dc-4877-b874-bbe218508399	true	access.token.claim
c84c03c5-98dc-4877-b874-bbe218508399	locality	user.attribute.locality
46f93282-4339-42ae-84e2-649367c7d679	true	introspection.token.claim
46f93282-4339-42ae-84e2-649367c7d679	true	userinfo.token.claim
46f93282-4339-42ae-84e2-649367c7d679	phoneNumberVerified	user.attribute
46f93282-4339-42ae-84e2-649367c7d679	true	id.token.claim
46f93282-4339-42ae-84e2-649367c7d679	true	access.token.claim
46f93282-4339-42ae-84e2-649367c7d679	phone_number_verified	claim.name
46f93282-4339-42ae-84e2-649367c7d679	boolean	jsonType.label
c3fd34d5-c038-49da-844b-4091de5100ea	true	introspection.token.claim
c3fd34d5-c038-49da-844b-4091de5100ea	true	userinfo.token.claim
c3fd34d5-c038-49da-844b-4091de5100ea	phoneNumber	user.attribute
c3fd34d5-c038-49da-844b-4091de5100ea	true	id.token.claim
c3fd34d5-c038-49da-844b-4091de5100ea	true	access.token.claim
c3fd34d5-c038-49da-844b-4091de5100ea	phone_number	claim.name
c3fd34d5-c038-49da-844b-4091de5100ea	String	jsonType.label
1cd48fa9-0ced-4495-a717-2b76388ef324	true	introspection.token.claim
1cd48fa9-0ced-4495-a717-2b76388ef324	true	multivalued
1cd48fa9-0ced-4495-a717-2b76388ef324	foo	user.attribute
1cd48fa9-0ced-4495-a717-2b76388ef324	true	access.token.claim
1cd48fa9-0ced-4495-a717-2b76388ef324	resource_access.${client_id}.roles	claim.name
1cd48fa9-0ced-4495-a717-2b76388ef324	String	jsonType.label
907e6a2b-388c-471d-9405-209ed39e79a1	true	introspection.token.claim
907e6a2b-388c-471d-9405-209ed39e79a1	true	access.token.claim
e6336088-dc0d-45b9-ae76-fedea1ff6b38	true	introspection.token.claim
e6336088-dc0d-45b9-ae76-fedea1ff6b38	true	multivalued
e6336088-dc0d-45b9-ae76-fedea1ff6b38	foo	user.attribute
e6336088-dc0d-45b9-ae76-fedea1ff6b38	true	access.token.claim
e6336088-dc0d-45b9-ae76-fedea1ff6b38	realm_access.roles	claim.name
e6336088-dc0d-45b9-ae76-fedea1ff6b38	String	jsonType.label
1ea15793-f61a-4ead-bda7-f7db5863f1dc	true	introspection.token.claim
1ea15793-f61a-4ead-bda7-f7db5863f1dc	true	access.token.claim
497bb293-35bd-4a1e-b08e-29c24643e918	true	introspection.token.claim
497bb293-35bd-4a1e-b08e-29c24643e918	true	multivalued
497bb293-35bd-4a1e-b08e-29c24643e918	foo	user.attribute
497bb293-35bd-4a1e-b08e-29c24643e918	true	id.token.claim
497bb293-35bd-4a1e-b08e-29c24643e918	true	access.token.claim
497bb293-35bd-4a1e-b08e-29c24643e918	groups	claim.name
497bb293-35bd-4a1e-b08e-29c24643e918	String	jsonType.label
b11f2bc5-5e4b-4680-b073-8aba210edb8f	true	introspection.token.claim
b11f2bc5-5e4b-4680-b073-8aba210edb8f	true	userinfo.token.claim
b11f2bc5-5e4b-4680-b073-8aba210edb8f	username	user.attribute
b11f2bc5-5e4b-4680-b073-8aba210edb8f	true	id.token.claim
b11f2bc5-5e4b-4680-b073-8aba210edb8f	true	access.token.claim
b11f2bc5-5e4b-4680-b073-8aba210edb8f	upn	claim.name
b11f2bc5-5e4b-4680-b073-8aba210edb8f	String	jsonType.label
53116bfc-52d2-4322-ba17-9c309b049115	true	introspection.token.claim
53116bfc-52d2-4322-ba17-9c309b049115	true	id.token.claim
53116bfc-52d2-4322-ba17-9c309b049115	true	access.token.claim
593ab621-9be2-40f4-a0bc-1c6f743df053	AUTH_TIME	user.session.note
593ab621-9be2-40f4-a0bc-1c6f743df053	true	introspection.token.claim
593ab621-9be2-40f4-a0bc-1c6f743df053	true	id.token.claim
593ab621-9be2-40f4-a0bc-1c6f743df053	true	access.token.claim
593ab621-9be2-40f4-a0bc-1c6f743df053	auth_time	claim.name
593ab621-9be2-40f4-a0bc-1c6f743df053	long	jsonType.label
e7cbf409-5a9e-4259-bb5a-6fe02b63e6ef	true	introspection.token.claim
e7cbf409-5a9e-4259-bb5a-6fe02b63e6ef	true	access.token.claim
6e933d5d-7fb9-45f4-8b87-64212a411933	clientHost	user.session.note
6e933d5d-7fb9-45f4-8b87-64212a411933	true	introspection.token.claim
6e933d5d-7fb9-45f4-8b87-64212a411933	true	id.token.claim
6e933d5d-7fb9-45f4-8b87-64212a411933	true	access.token.claim
6e933d5d-7fb9-45f4-8b87-64212a411933	clientHost	claim.name
6e933d5d-7fb9-45f4-8b87-64212a411933	String	jsonType.label
abd4cf07-7b74-4d28-b38c-7093fb295352	client_id	user.session.note
abd4cf07-7b74-4d28-b38c-7093fb295352	true	introspection.token.claim
abd4cf07-7b74-4d28-b38c-7093fb295352	true	id.token.claim
abd4cf07-7b74-4d28-b38c-7093fb295352	true	access.token.claim
abd4cf07-7b74-4d28-b38c-7093fb295352	client_id	claim.name
abd4cf07-7b74-4d28-b38c-7093fb295352	String	jsonType.label
bb4e0376-b116-4440-9bac-1e6f11e075f2	clientAddress	user.session.note
bb4e0376-b116-4440-9bac-1e6f11e075f2	true	introspection.token.claim
bb4e0376-b116-4440-9bac-1e6f11e075f2	true	id.token.claim
bb4e0376-b116-4440-9bac-1e6f11e075f2	true	access.token.claim
bb4e0376-b116-4440-9bac-1e6f11e075f2	clientAddress	claim.name
bb4e0376-b116-4440-9bac-1e6f11e075f2	String	jsonType.label
e45afb88-9adf-4496-acc8-a72eaa85b059	true	introspection.token.claim
e45afb88-9adf-4496-acc8-a72eaa85b059	true	multivalued
e45afb88-9adf-4496-acc8-a72eaa85b059	true	id.token.claim
e45afb88-9adf-4496-acc8-a72eaa85b059	true	access.token.claim
e45afb88-9adf-4496-acc8-a72eaa85b059	organization	claim.name
e45afb88-9adf-4496-acc8-a72eaa85b059	String	jsonType.label
fef43e8a-efa2-4324-964e-1415afcfc70b	true	introspection.token.claim
fef43e8a-efa2-4324-964e-1415afcfc70b	true	userinfo.token.claim
fef43e8a-efa2-4324-964e-1415afcfc70b	locale	user.attribute
fef43e8a-efa2-4324-964e-1415afcfc70b	true	id.token.claim
fef43e8a-efa2-4324-964e-1415afcfc70b	true	access.token.claim
fef43e8a-efa2-4324-964e-1415afcfc70b	locale	claim.name
fef43e8a-efa2-4324-964e-1415afcfc70b	String	jsonType.label
\.


--
-- Data for Name: realm; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.realm (id, access_code_lifespan, user_action_lifespan, access_token_lifespan, account_theme, admin_theme, email_theme, enabled, events_enabled, events_expiration, login_theme, name, not_before, password_policy, registration_allowed, remember_me, reset_password_allowed, social, ssl_required, sso_idle_timeout, sso_max_lifespan, update_profile_on_soc_login, verify_email, master_admin_client, login_lifespan, internationalization_enabled, default_locale, reg_email_as_username, admin_events_enabled, admin_events_details_enabled, edit_username_allowed, otp_policy_counter, otp_policy_window, otp_policy_period, otp_policy_digits, otp_policy_alg, otp_policy_type, browser_flow, registration_flow, direct_grant_flow, reset_credentials_flow, client_auth_flow, offline_session_idle_timeout, revoke_refresh_token, access_token_life_implicit, login_with_email_allowed, duplicate_emails_allowed, docker_auth_flow, refresh_token_max_reuse, allow_user_managed_access, sso_max_lifespan_remember_me, sso_idle_timeout_remember_me, default_role) FROM stdin;
e4b40266-0967-452a-b1e2-26a574255a2d	60	300	60	\N	\N	\N	t	f	0	\N	master	0	\N	f	f	f	f	EXTERNAL	1800	36000	f	f	7b2d0efa-a437-467b-84a3-e4f3459550bb	1800	f	\N	f	f	f	f	0	1	30	6	HmacSHA1	totp	ec7eacab-0440-4436-8cb9-763d8e235a16	889f410f-12b6-495b-b6c8-f4e43d5bb92c	bf234d81-ce17-4f86-927b-d4fbbc4eef18	eeb5ab7b-a3df-4a34-9848-57f66d8a5b0b	b33592c6-24a1-4aa4-a5c8-71479910c4ea	2592000	f	900	t	f	d468cea5-ae36-4814-9170-75f340fb2ae3	0	f	0	0	3bef6e98-1dfb-4e70-90d6-9f8de5436ca3
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	60	300	300	\N	\N	\N	t	f	0	\N	app	0	\N	t	t	t	f	EXTERNAL	1800	36000	f	f	25edb070-4c40-451b-bfd9-5e4efcd153f7	1800	f	\N	f	f	f	f	0	1	30	6	HmacSHA1	totp	287a927b-c005-4eb0-a6d1-7883f84b2af0	dab08650-3b84-4c14-827e-f74e6f30eefd	5d84259a-e398-4e9a-93b5-eb586c9e130b	411a404f-2368-4e98-8b1d-68d33138ad19	8415925b-5388-4096-a7f4-f7adf28c3969	2592000	f	900	t	f	8e4cf74e-6b2e-472e-bae6-e6d361e034d2	0	f	0	0	9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85
\.


--
-- Data for Name: realm_attribute; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.realm_attribute (name, realm_id, value) FROM stdin;
_browser_header.contentSecurityPolicyReportOnly	e4b40266-0967-452a-b1e2-26a574255a2d	
_browser_header.xContentTypeOptions	e4b40266-0967-452a-b1e2-26a574255a2d	nosniff
_browser_header.referrerPolicy	e4b40266-0967-452a-b1e2-26a574255a2d	no-referrer
_browser_header.xRobotsTag	e4b40266-0967-452a-b1e2-26a574255a2d	none
_browser_header.xFrameOptions	e4b40266-0967-452a-b1e2-26a574255a2d	SAMEORIGIN
_browser_header.contentSecurityPolicy	e4b40266-0967-452a-b1e2-26a574255a2d	frame-src 'self'; frame-ancestors 'self'; object-src 'none';
_browser_header.xXSSProtection	e4b40266-0967-452a-b1e2-26a574255a2d	1; mode=block
_browser_header.strictTransportSecurity	e4b40266-0967-452a-b1e2-26a574255a2d	max-age=31536000; includeSubDomains
bruteForceProtected	e4b40266-0967-452a-b1e2-26a574255a2d	false
permanentLockout	e4b40266-0967-452a-b1e2-26a574255a2d	false
maxTemporaryLockouts	e4b40266-0967-452a-b1e2-26a574255a2d	0
bruteForceStrategy	e4b40266-0967-452a-b1e2-26a574255a2d	MULTIPLE
maxFailureWaitSeconds	e4b40266-0967-452a-b1e2-26a574255a2d	900
minimumQuickLoginWaitSeconds	e4b40266-0967-452a-b1e2-26a574255a2d	60
waitIncrementSeconds	e4b40266-0967-452a-b1e2-26a574255a2d	60
quickLoginCheckMilliSeconds	e4b40266-0967-452a-b1e2-26a574255a2d	1000
maxDeltaTimeSeconds	e4b40266-0967-452a-b1e2-26a574255a2d	43200
failureFactor	e4b40266-0967-452a-b1e2-26a574255a2d	30
realmReusableOtpCode	e4b40266-0967-452a-b1e2-26a574255a2d	false
firstBrokerLoginFlowId	e4b40266-0967-452a-b1e2-26a574255a2d	e77a1f9d-aab9-4fd4-a1b5-3876543fcd47
displayName	e4b40266-0967-452a-b1e2-26a574255a2d	Keycloak
displayNameHtml	e4b40266-0967-452a-b1e2-26a574255a2d	<div class="kc-logo-text"><span>Keycloak</span></div>
defaultSignatureAlgorithm	e4b40266-0967-452a-b1e2-26a574255a2d	RS256
offlineSessionMaxLifespanEnabled	e4b40266-0967-452a-b1e2-26a574255a2d	false
offlineSessionMaxLifespan	e4b40266-0967-452a-b1e2-26a574255a2d	5184000
bruteForceProtected	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	false
permanentLockout	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	false
maxTemporaryLockouts	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	0
bruteForceStrategy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	MULTIPLE
maxFailureWaitSeconds	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	900
minimumQuickLoginWaitSeconds	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	60
waitIncrementSeconds	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	60
quickLoginCheckMilliSeconds	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	1000
maxDeltaTimeSeconds	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	43200
failureFactor	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	30
realmReusableOtpCode	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	false
defaultSignatureAlgorithm	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	RS256
offlineSessionMaxLifespanEnabled	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	false
offlineSessionMaxLifespan	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	5184000
actionTokenGeneratedByAdminLifespan	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	43200
actionTokenGeneratedByUserLifespan	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	300
oauth2DeviceCodeLifespan	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	600
oauth2DevicePollingInterval	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	5
webAuthnPolicyRpEntityName	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	keycloak
webAuthnPolicySignatureAlgorithms	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	ES256,RS256
webAuthnPolicyRpId	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	
webAuthnPolicyAttestationConveyancePreference	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	not specified
webAuthnPolicyAuthenticatorAttachment	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	not specified
webAuthnPolicyRequireResidentKey	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	not specified
webAuthnPolicyUserVerificationRequirement	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	not specified
webAuthnPolicyCreateTimeout	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	0
webAuthnPolicyAvoidSameAuthenticatorRegister	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	false
webAuthnPolicyRpEntityNamePasswordless	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	keycloak
webAuthnPolicySignatureAlgorithmsPasswordless	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	ES256,RS256
webAuthnPolicyRpIdPasswordless	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	
webAuthnPolicyAttestationConveyancePreferencePasswordless	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	not specified
webAuthnPolicyAuthenticatorAttachmentPasswordless	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	not specified
webAuthnPolicyRequireResidentKeyPasswordless	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	not specified
webAuthnPolicyUserVerificationRequirementPasswordless	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	not specified
webAuthnPolicyCreateTimeoutPasswordless	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	0
webAuthnPolicyAvoidSameAuthenticatorRegisterPasswordless	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	false
cibaBackchannelTokenDeliveryMode	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	poll
cibaExpiresIn	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	120
cibaInterval	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	5
cibaAuthRequestedUserHint	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	login_hint
parRequestUriLifespan	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	60
firstBrokerLoginFlowId	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	078a5877-fb65-4673-8331-1a96979e24cc
organizationsEnabled	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	false
adminPermissionsEnabled	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	false
verifiableCredentialsEnabled	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	false
clientSessionIdleTimeout	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	0
clientSessionMaxLifespan	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	0
clientOfflineSessionIdleTimeout	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	0
clientOfflineSessionMaxLifespan	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	0
client-policies.profiles	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	{"profiles":[]}
client-policies.policies	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	{"policies":[]}
_browser_header.contentSecurityPolicyReportOnly	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	
_browser_header.xContentTypeOptions	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	nosniff
_browser_header.referrerPolicy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	no-referrer
_browser_header.xRobotsTag	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	none
_browser_header.xFrameOptions	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	SAMEORIGIN
_browser_header.contentSecurityPolicy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	frame-src 'self'; frame-ancestors 'self'; object-src 'none';
_browser_header.xXSSProtection	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	1; mode=block
_browser_header.strictTransportSecurity	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	max-age=31536000; includeSubDomains
\.


--
-- Data for Name: realm_default_groups; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.realm_default_groups (realm_id, group_id) FROM stdin;
\.


--
-- Data for Name: realm_enabled_event_types; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.realm_enabled_event_types (realm_id, value) FROM stdin;
\.


--
-- Data for Name: realm_events_listeners; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.realm_events_listeners (realm_id, value) FROM stdin;
e4b40266-0967-452a-b1e2-26a574255a2d	jboss-logging
de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	jboss-logging
\.


--
-- Data for Name: realm_localizations; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.realm_localizations (realm_id, locale, texts) FROM stdin;
\.


--
-- Data for Name: realm_required_credential; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.realm_required_credential (type, form_label, input, secret, realm_id) FROM stdin;
password	password	t	t	e4b40266-0967-452a-b1e2-26a574255a2d
password	password	t	t	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5
\.


--
-- Data for Name: realm_smtp_config; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.realm_smtp_config (realm_id, value, name) FROM stdin;
\.


--
-- Data for Name: realm_supported_locales; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.realm_supported_locales (realm_id, value) FROM stdin;
\.


--
-- Data for Name: redirect_uris; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.redirect_uris (client_id, value) FROM stdin;
8601052c-64a0-4aa2-8a44-6086ca390c4d	/realms/master/account/*
326a5eb7-4a21-4106-a30c-7f97c29d3fab	/realms/master/account/*
ada9c621-b0c0-4b02-b33e-011a78309041	/admin/master/console/*
6769e5ef-51ad-41fa-b763-6215030eb3d8	/realms/app/account/*
ed111216-43bb-40d4-81b7-c440a110de24	/realms/app/account/*
874892be-6f1d-4646-a497-cf38baa87865	/admin/app/console/*
c200afa9-e84a-4df3-b313-5ccb1e69b28c	http://localhost:8080/api/auth/callback
c200afa9-e84a-4df3-b313-5ccb1e69b28c	https://stg.ssafymaker.cloud/api/auth/callback
c200afa9-e84a-4df3-b313-5ccb1e69b28c	https://ssafymaker.cloud/api/auth/callback
\.


--
-- Data for Name: required_action_config; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.required_action_config (required_action_id, value, name) FROM stdin;
\.


--
-- Data for Name: required_action_provider; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.required_action_provider (id, alias, name, realm_id, enabled, default_action, provider_id, priority) FROM stdin;
1891cf67-edf3-4bb3-b8af-949770f093e5	VERIFY_EMAIL	Verify Email	e4b40266-0967-452a-b1e2-26a574255a2d	t	f	VERIFY_EMAIL	50
89fc5f30-15ba-498f-9985-56f19acadfce	UPDATE_PROFILE	Update Profile	e4b40266-0967-452a-b1e2-26a574255a2d	t	f	UPDATE_PROFILE	40
58ae4868-781a-4e91-97f7-1995c33cf330	CONFIGURE_TOTP	Configure OTP	e4b40266-0967-452a-b1e2-26a574255a2d	t	f	CONFIGURE_TOTP	10
91328219-676a-42ed-b052-8a2f5184d4fe	UPDATE_PASSWORD	Update Password	e4b40266-0967-452a-b1e2-26a574255a2d	t	f	UPDATE_PASSWORD	30
9b4fe04f-63c3-451c-a186-f3eeb886e472	TERMS_AND_CONDITIONS	Terms and Conditions	e4b40266-0967-452a-b1e2-26a574255a2d	f	f	TERMS_AND_CONDITIONS	20
716ba22d-b229-4a0e-ba5a-86cb109c478a	delete_account	Delete Account	e4b40266-0967-452a-b1e2-26a574255a2d	f	f	delete_account	60
3d866e5c-9cf3-4624-af9c-42c2eeb1170d	delete_credential	Delete Credential	e4b40266-0967-452a-b1e2-26a574255a2d	t	f	delete_credential	100
fbdd9a8b-9150-4d9f-86dc-6288f517018b	update_user_locale	Update User Locale	e4b40266-0967-452a-b1e2-26a574255a2d	t	f	update_user_locale	1000
43e1fc6c-40d0-4df7-b97c-153019b36478	webauthn-register	Webauthn Register	e4b40266-0967-452a-b1e2-26a574255a2d	t	f	webauthn-register	70
039b1081-d1fd-4641-9870-cd81fb368afe	webauthn-register-passwordless	Webauthn Register Passwordless	e4b40266-0967-452a-b1e2-26a574255a2d	t	f	webauthn-register-passwordless	80
09db1230-c88a-4a18-94b1-07238be0526e	VERIFY_PROFILE	Verify Profile	e4b40266-0967-452a-b1e2-26a574255a2d	t	f	VERIFY_PROFILE	90
5d0bc071-cc70-4f7a-8951-88e344679e7b	UPDATE_PROFILE	Update Profile	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	t	f	UPDATE_PROFILE	40
75ff824e-f239-4fcc-a744-7520b3c6b834	CONFIGURE_TOTP	Configure OTP	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	t	f	CONFIGURE_TOTP	10
8bc0b1b1-a69b-47d6-9bea-4d600d9be79d	UPDATE_PASSWORD	Update Password	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	t	f	UPDATE_PASSWORD	30
8acb66f9-9a52-4374-bf47-19d2ac08ae8b	TERMS_AND_CONDITIONS	Terms and Conditions	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	f	f	TERMS_AND_CONDITIONS	20
b16ef79e-ae71-4ea1-b380-1db27a648f98	delete_account	Delete Account	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	f	f	delete_account	60
d6c20575-3f98-4af8-9ab2-693d1dfc4603	delete_credential	Delete Credential	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	t	f	delete_credential	100
2c8c4c37-2a5d-4207-af4c-12f2e81182d4	update_user_locale	Update User Locale	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	t	f	update_user_locale	1000
2d861ed6-e02c-46d7-8a88-9eaff9398767	webauthn-register	Webauthn Register	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	t	f	webauthn-register	70
54262ae9-ce54-4569-a17b-85764663e419	webauthn-register-passwordless	Webauthn Register Passwordless	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	t	f	webauthn-register-passwordless	80
1c78ac80-e2b7-473d-abe7-5703c30b0057	VERIFY_PROFILE	Verify Profile	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	t	f	VERIFY_PROFILE	90
89f016c8-faa5-49c8-97db-1224a9086dbb	VERIFY_EMAIL	Verify Email	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	f	f	VERIFY_EMAIL	50
\.


--
-- Data for Name: resource_attribute; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.resource_attribute (id, name, value, resource_id) FROM stdin;
\.


--
-- Data for Name: resource_policy; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.resource_policy (resource_id, policy_id) FROM stdin;
\.


--
-- Data for Name: resource_scope; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.resource_scope (resource_id, scope_id) FROM stdin;
\.


--
-- Data for Name: resource_server; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.resource_server (id, allow_rs_remote_mgmt, policy_enforce_mode, decision_strategy) FROM stdin;
\.


--
-- Data for Name: resource_server_perm_ticket; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.resource_server_perm_ticket (id, owner, requester, created_timestamp, granted_timestamp, resource_id, scope_id, resource_server_id, policy_id) FROM stdin;
\.


--
-- Data for Name: resource_server_policy; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.resource_server_policy (id, name, description, type, decision_strategy, logic, resource_server_id, owner) FROM stdin;
\.


--
-- Data for Name: resource_server_resource; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.resource_server_resource (id, name, type, icon_uri, owner, resource_server_id, owner_managed_access, display_name) FROM stdin;
\.


--
-- Data for Name: resource_server_scope; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.resource_server_scope (id, name, icon_uri, resource_server_id, display_name) FROM stdin;
\.


--
-- Data for Name: resource_uris; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.resource_uris (resource_id, value) FROM stdin;
\.


--
-- Data for Name: revoked_token; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.revoked_token (id, expire) FROM stdin;
\.


--
-- Data for Name: role_attribute; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.role_attribute (id, role_id, name, value) FROM stdin;
\.


--
-- Data for Name: save_files; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.save_files (id, user_id, slot_number, name, game_state, created_at, updated_at) FROM stdin;
cf34fa52-c0bc-4514-8a72-447a335cf760	4ffa93bb-94ac-46d7-a03c-951cb6b4842f	1	저장 슬롯 1 | 1주차 월요일 오전	{"gameState":{"hud":{"timeLabel":"오전","locationLabel":"전체 지도","week":1,"dayLabel":"월요일","actionPoint":4,"maxActionPoint":4,"hp":82,"hpMax":100,"money":100000,"stress":20},"stats":{"fe":20,"be":20,"teamwork":40,"luck":10,"stress":20},"affection":{},"flags":[]},"inventory":{"inventorySlots":[{"templateId":"item-chocolate","quantity":1},{"templateId":"item-energy-drink","quantity":1},null,null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":0},"progression":{"timeState":{"actionPoint":4,"maxActionPoint":4,"timeCycleIndex":0,"dayCycleIndex":0,"week":1},"weeklyPlan":["ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice"],"weeklyPlanWeek":1,"lastPaidWeeklySalaryWeek":1},"world":{"areaId":"world","sceneId":"scene_world_default","sceneState":{"id":"world_default","area":"world","npcs":[{"npcId":"hyoryeon","x":325,"y":480,"facing":"down","dialogueId":"npc_hyoryeon"},{"npcId":"jiwoo","x":700,"y":600,"facing":"down","dialogueId":"npc_jiwoo"},{"npcId":"jongmin","x":1120,"y":480,"facing":"down","dialogueId":"npc_jongmin"}]},"playerTile":{"tileX":9,"tileY":11}},"story":{"completedFixedEventIds":[]}}	2026-03-25 05:29:02.968814+00	2026-03-25 05:29:02.968814+00
877e3246-dfb2-45a7-a9c7-5ee30fca6b74	0ea51a71-a9a5-44a6-87c5-9a9acff0c6fb	1	저장 슬롯 1 | 1주차 월요일 저녁	{"gameState":{"hud":{"timeLabel":"저녁","locationLabel":"교실","week":1,"dayLabel":"월요일","actionPoint":2,"maxActionPoint":4,"hp":62,"hpMax":100,"money":100000,"stress":36},"stats":{"fe":10,"be":20,"teamwork":12,"luck":10,"stress":36},"affection":{},"flags":["minigame:unlocked:InterviewScene"],"endingProgress":{"gamePlayCount":0,"lottoRank":null}},"inventory":{"inventorySlots":[{"templateId":"item-chocolate","quantity":1},{"templateId":"item-energy-drink","quantity":1},null,null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":0},"progression":{"timeState":{"actionPoint":2,"maxActionPoint":4,"timeCycleIndex":2,"dayCycleIndex":0,"week":1},"weeklyPlan":["ui_practice","rest_api_db","team_project","ui_practice","rest_api_db","ui_practice","ui_practice","ui_practice","ui_practice","team_project"],"weeklyPlanWeek":1,"lastPaidWeeklySalaryWeek":1,"completedPlanSlotIndices":[1]},"world":{"areaId":"classroom","sceneId":"scene_classroom_default","sceneState":{"id":"classroom_default","area":"classroom","npcs":[{"npcId":"minigame_npc","x":1020,"y":280,"facing":"down","dialogueId":"npc_minigame_npc"}]},"playerTile":{"tileX":25,"tileY":7}},"story":{"completedFixedEventIds":["EVT_MAIN_W1_D1_MORNING_INTRO"]}}	2026-03-27 08:40:57.571197+00	2026-03-27 08:40:57.571197+00
5660e16f-a9a4-4b35-971c-19a8938a44cc	d2113e26-81f9-4102-a204-bd535939eba5	1	저장 슬롯 1 | 1주차 월요일 저녁	{"gameState":{"hud":{"timeLabel":"저녁","locationLabel":"전체 지도","week":1,"dayLabel":"월요일","actionPoint":2,"maxActionPoint":4,"hp":62,"hpMax":100,"money":100000,"stress":12},"stats":{"fe":20,"be":10,"teamwork":7,"luck":10,"stress":12},"affection":{},"flags":[],"endingProgress":{"gamePlayCount":0,"lottoRank":null}},"inventory":{"inventorySlots":[{"templateId":"item-chocolate","quantity":1},{"templateId":"item-energy-drink","quantity":1},null,null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":0},"progression":{"timeState":{"actionPoint":2,"maxActionPoint":4,"timeCycleIndex":2,"dayCycleIndex":0,"week":1},"weeklyPlan":["ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice"],"weeklyPlanWeek":1,"lastPaidWeeklySalaryWeek":1,"completedPlanSlotIndices":[1]},"world":{"areaId":"world","sceneId":"scene_world_default","sceneState":{"id":"world_default","area":"world","npcs":[{"npcId":"hyoryeon","x":325,"y":480,"facing":"down","dialogueId":"npc_hyoryeon"},{"npcId":"jiwoo","x":700,"y":600,"facing":"down","dialogueId":"npc_jiwoo"},{"npcId":"jongmin","x":1120,"y":480,"facing":"down","dialogueId":"npc_jongmin"}]},"playerTile":{"tileX":14,"tileY":5}},"story":{"completedFixedEventIds":["EVT_MAIN_W1_D1_MORNING_INTRO"]}}	2026-03-27 08:42:21.691573+00	2026-03-27 08:42:21.691573+00
f0804263-4eae-46f4-94b9-82df75da492b	d2113e26-81f9-4102-a204-bd535939eba5	2	저장 슬롯 2 | 1주차 월요일 저녁	{"gameState":{"hud":{"timeLabel":"저녁","locationLabel":"번화가","week":1,"dayLabel":"월요일","actionPoint":2,"maxActionPoint":4,"hp":62,"hpMax":100,"money":100000,"stress":12},"stats":{"fe":20,"be":10,"teamwork":7,"luck":10,"stress":12},"affection":{},"flags":[],"endingProgress":{"gamePlayCount":0,"lottoRank":null}},"inventory":{"inventorySlots":[{"templateId":"item-chocolate","quantity":1},{"templateId":"item-energy-drink","quantity":1},null,null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":0},"progression":{"timeState":{"actionPoint":2,"maxActionPoint":4,"timeCycleIndex":2,"dayCycleIndex":0,"week":1},"weeklyPlan":["ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice"],"weeklyPlanWeek":1,"lastPaidWeeklySalaryWeek":1,"completedPlanSlotIndices":[1]},"world":{"areaId":"downtown","sceneId":"scene_downtown_default","sceneState":{"id":"downtown_default","area":"downtown","npcs":[{"npcId":"yeonwoong","x":380,"y":300,"facing":"down","dialogueId":"npc_yeonwoong"},{"npcId":"minsu","x":590,"y":290,"facing":"down","dialogueId":"npc_minsu"},{"npcId":"myungjin","x":696,"y":520,"facing":"down","dialogueId":"npc_myungjin"}]},"playerTile":{"tileX":21,"tileY":5}},"story":{"completedFixedEventIds":["EVT_MAIN_W1_D1_MORNING_INTRO"]}}	2026-03-27 08:43:33.028592+00	2026-03-27 08:43:33.028592+00
98e3394e-8133-43b5-9add-158f17fe2942	d2113e26-81f9-4102-a204-bd535939eba5	999999	Auto Save | 1주차 목요일 오전	{"gameState":{"hud":{"timeLabel":"오전","locationLabel":"전체 지도","week":1,"dayLabel":"목요일","actionPoint":4,"maxActionPoint":4,"hp":1,"hpMax":100,"money":76000,"stress":99},"stats":{"fe":20,"be":15,"teamwork":7,"luck":11,"stress":99},"affection":{},"flags":[],"endingProgress":{"gamePlayCount":1,"lottoRank":null}},"inventory":{"inventorySlots":[{"templateId":"item-chocolate","quantity":1},{"templateId":"item-energy-drink","quantity":1},null,null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":0},"progression":{"timeState":{"actionPoint":4,"maxActionPoint":4,"timeCycleIndex":0,"dayCycleIndex":3,"week":1},"weeklyPlan":["ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice"],"weeklyPlanWeek":1,"lastPaidWeeklySalaryWeek":1,"completedPlanSlotIndices":[1]},"world":{"areaId":"world","sceneId":"scene_world_default","sceneState":{"id":"world_default","area":"world","npcs":[{"npcId":"hyoryeon","x":325,"y":480,"facing":"down","dialogueId":"npc_hyoryeon"},{"npcId":"jiwoo","x":700,"y":600,"facing":"down","dialogueId":"npc_jiwoo"},{"npcId":"jongmin","x":1120,"y":480,"facing":"down","dialogueId":"npc_jongmin"}]},"playerTile":{"tileX":13,"tileY":15}},"story":{"completedFixedEventIds":["EVT_MAIN_W1_D1_MORNING_INTRO","EVT_MAIN_W1_D2_AFTERNOON_ROBO"]}}	2026-03-27 08:50:21.870203+00	2026-03-27 08:50:21.870203+00
d2449660-866a-410d-be81-7218649bf7fc	cc7ceb98-cd8e-4542-9d31-679519bb6db2	2	저장 슬롯 2 | 2주차 화요일 저녁	{"gameState":{"hud":{"timeLabel":"저녁","locationLabel":"전체 지도","week":2,"dayLabel":"화요일","actionPoint":2,"maxActionPoint":4,"hp":37,"hpMax":110,"money":89000,"stress":46},"stats":{"fe":51,"be":24,"teamwork":59,"luck":14,"stress":46},"affection":{},"flags":["minigame:unlocked:InterviewScene","minigame:unlocked:RhythmScene","minigame:unlocked:DrinkingScene","minigame:unlocked:CookingScene","minigame:unlocked:GymScene"],"endingProgress":{"gamePlayCount":2,"lottoRank":null}},"inventory":{"inventorySlots":[null,{"templateId":"item-energy-drink","quantity":1},null,null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":0},"progression":{"timeState":{"actionPoint":2,"maxActionPoint":4,"timeCycleIndex":2,"dayCycleIndex":1,"week":2},"weeklyPlan":["ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice"],"weeklyPlanWeek":2,"lastPaidWeeklySalaryWeek":2,"completedPlanSlotIndices":[1,2]},"world":{"areaId":"world","sceneId":"scene_world_default","sceneState":{"id":"world_default","area":"world","npcs":[{"npcId":"hyoryeon","x":325,"y":480,"facing":"down","dialogueId":"npc_hyoryeon"},{"npcId":"jiwoo","x":700,"y":600,"facing":"down","dialogueId":"npc_jiwoo"},{"npcId":"jongmin","x":1120,"y":480,"facing":"down","dialogueId":"npc_jongmin"}]},"playerTile":{"tileX":9,"tileY":9}},"story":{"completedFixedEventIds":["EVT_MAIN_W1_D1_MORNING_INTRO","EVT_MAIN_W1_D2_AFTERNOON_ROBO","EVT_ROMANCE_HYO_W1_D4_MORNING","EVT_MAIN_W1_D5_MORNING_ALGO","EVT_MAIN_W2_D1_MORNING_PRO","EVT_ROMANCE_HYO_W2_D2_AFTERNOON"]}}	2026-03-27 10:37:32.555632+00	2026-03-27 21:28:31.076781+00
7aa23197-4d91-49a1-872b-a7af60d3fde9	cc7ceb98-cd8e-4542-9d31-679519bb6db2	999999	Auto Save | 1주차 토요일 오후	{"gameState":{"hud":{"timeLabel":"오후","locationLabel":"전체 지도","week":1,"dayLabel":"토요일","actionPoint":3,"maxActionPoint":4,"hp":1,"hpMax":100,"money":61000,"stress":99},"stats":{"fe":30,"be":23,"teamwork":48,"luck":20,"stress":99},"affection":{},"flags":["minigame:unlocked:InterviewScene","minigame:unlocked:RhythmScene","minigame:unlocked:DrinkingScene","minigame:unlocked:CookingScene","minigame:unlocked:LottoScene"],"endingProgress":{"gamePlayCount":1,"lottoRank":5}},"inventory":{"inventorySlots":[null,{"templateId":"item-energy-drink","quantity":1},null,null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":1},"progression":{"timeState":{"actionPoint":3,"maxActionPoint":4,"timeCycleIndex":1,"dayCycleIndex":5,"week":1},"weeklyPlan":["ui_practice","team_project","rest_api_db","ui_practice","team_project","ui_practice","ui_practice","ui_practice","ui_practice","team_project"],"weeklyPlanWeek":1,"lastPaidWeeklySalaryWeek":1,"completedPlanSlotIndices":[1,7,9]},"world":{"areaId":"world","sceneId":"scene_world_default","sceneState":{"id":"world_default","area":"world","npcs":[{"npcId":"hyoryeon","x":325,"y":480,"facing":"down","dialogueId":"npc_hyoryeon"},{"npcId":"jiwoo","x":700,"y":600,"facing":"down","dialogueId":"npc_jiwoo"},{"npcId":"jongmin","x":1120,"y":480,"facing":"down","dialogueId":"npc_jongmin"}]},"playerTile":{"tileX":12,"tileY":15}},"story":{"completedFixedEventIds":["EVT_MAIN_W1_D1_MORNING_INTRO","EVT_MAIN_W1_D2_AFTERNOON_ROBO","EVT_ROMANCE_HYO_W1_D4_MORNING","EVT_MAIN_W1_D5_MORNING_ALGO"]}}	2026-03-27 21:16:22.300656+00	2026-03-27 21:16:22.300656+00
19595a43-fa86-4ce8-abc8-45eaabfc41ab	cc7ceb98-cd8e-4542-9d31-679519bb6db2	1	저장 슬롯 1 | 2주차 화요일 저녁	{"gameState":{"hud":{"timeLabel":"저녁","locationLabel":"전체 지도","week":2,"dayLabel":"화요일","actionPoint":2,"maxActionPoint":4,"hp":37,"hpMax":110,"money":89000,"stress":46},"stats":{"fe":51,"be":24,"teamwork":59,"luck":14,"stress":46},"affection":{},"flags":["minigame:unlocked:InterviewScene","minigame:unlocked:RhythmScene","minigame:unlocked:DrinkingScene","minigame:unlocked:CookingScene","minigame:unlocked:GymScene"],"endingProgress":{"gamePlayCount":2,"lottoRank":null}},"inventory":{"inventorySlots":[null,{"templateId":"item-energy-drink","quantity":1},null,null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":0},"progression":{"timeState":{"actionPoint":2,"maxActionPoint":4,"timeCycleIndex":2,"dayCycleIndex":1,"week":2},"weeklyPlan":["ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice"],"weeklyPlanWeek":2,"lastPaidWeeklySalaryWeek":2,"completedPlanSlotIndices":[1,2]},"world":{"areaId":"world","sceneId":"scene_world_default","sceneState":{"id":"world_default","area":"world","npcs":[{"npcId":"hyoryeon","x":325,"y":480,"facing":"down","dialogueId":"npc_hyoryeon"},{"npcId":"jiwoo","x":700,"y":600,"facing":"down","dialogueId":"npc_jiwoo"},{"npcId":"jongmin","x":1120,"y":480,"facing":"down","dialogueId":"npc_jongmin"}]},"playerTile":{"tileX":9,"tileY":9}},"story":{"completedFixedEventIds":["EVT_MAIN_W1_D1_MORNING_INTRO","EVT_MAIN_W1_D2_AFTERNOON_ROBO","EVT_ROMANCE_HYO_W1_D4_MORNING","EVT_MAIN_W1_D5_MORNING_ALGO","EVT_MAIN_W2_D1_MORNING_PRO","EVT_ROMANCE_HYO_W2_D2_AFTERNOON"]}}	2026-03-27 10:20:27.522144+00	2026-03-27 21:28:36.634401+00
d69cb98d-85f2-4b0e-93b5-580e088b5f6c	e4b9a455-6418-45b6-a1f0-7684d6776436	999999	Auto Save | 2주차 월요일 저녁	{"gameState":{"hud":{"timeLabel":"저녁","locationLabel":"번화가","week":2,"dayLabel":"월요일","actionPoint":2,"maxActionPoint":4,"hp":80,"hpMax":100,"money":150000,"stress":2},"stats":{"fe":55,"be":11,"teamwork":12,"luck":10,"stress":2},"affection":{},"flags":[],"endingProgress":{"gamePlayCount":0,"lottoRank":null}},"inventory":{"inventorySlots":[{"templateId":"item-chocolate","quantity":1},{"templateId":"item-energy-drink","quantity":1},null,null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":0},"progression":{"timeState":{"actionPoint":2,"maxActionPoint":4,"timeCycleIndex":2,"dayCycleIndex":0,"week":2},"weeklyPlan":["ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice"],"weeklyPlanWeek":2,"lastPaidWeeklySalaryWeek":2,"completedPlanSlotIndices":[1]},"world":{"areaId":"downtown","sceneId":"scene_downtown_default","sceneState":{"id":"downtown_default","area":"downtown","npcs":[{"npcId":"yeonwoong","x":380,"y":300,"facing":"down","dialogueId":"npc_yeonwoong"},{"npcId":"minsu","x":590,"y":290,"facing":"down","dialogueId":"npc_minsu"},{"npcId":"myungjin","x":696,"y":520,"facing":"down","dialogueId":"npc_myungjin"}]},"playerTile":{"tileX":14,"tileY":8}},"story":{"completedFixedEventIds":["EVT_MAIN_W1_D1_MORNING_INTRO","EVT_MAIN_W1_D2_AFTERNOON_ROBO","EVT_ROMANCE_HYO_W1_D4_MORNING","EVT_MAIN_W1_D5_MORNING_ALGO","EVT_MAIN_W2_D1_MORNING_PRO"]}}	2026-03-27 08:57:40.709815+00	2026-03-29 12:38:03.748555+00
7b3c80e5-767f-4826-902d-22c4413baa1d	8cb3b22c-7f8b-48e2-a869-cbaac68934c7	1	저장 슬롯 1 | 2주차 목요일 저녁	{"gameState":{"hud":{"timeLabel":"저녁","locationLabel":"전체 지도","week":2,"dayLabel":"목요일","actionPoint":2,"maxActionPoint":4,"hp":61,"hpMax":110,"money":61000,"stress":16},"stats":{"fe":104,"be":95,"teamwork":86,"luck":53,"stress":16},"affection":{},"flags":["minigame:unlocked:LottoScene","minigame:unlocked:DrinkingScene","minigame:unlocked:CookingScene","minigame:unlocked:RhythmScene","minigame:unlocked:GymScene"],"endingProgress":{"gamePlayCount":1,"lottoRank":3}},"inventory":{"inventorySlots":[{"templateId":"item-chocolate","quantity":1},{"templateId":"item-energy-drink","quantity":1},null,null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":0},"progression":{"timeState":{"actionPoint":2,"maxActionPoint":4,"timeCycleIndex":2,"dayCycleIndex":3,"week":2},"weeklyPlan":["ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice"],"weeklyPlanWeek":2,"lastPaidWeeklySalaryWeek":2,"completedPlanSlotIndices":[1,2,4,5,7]},"world":{"areaId":"world","sceneId":"scene_world_default","sceneState":{"id":"world_default","area":"world","npcs":[{"npcId":"hyoryeon","x":325,"y":480,"facing":"down","dialogueId":"npc_hyoryeon"},{"npcId":"jiwoo","x":700,"y":600,"facing":"down","dialogueId":"npc_jiwoo"},{"npcId":"jongmin","x":1120,"y":480,"facing":"down","dialogueId":"npc_jongmin"}]},"playerTile":{"tileX":8,"tileY":7}},"story":{"completedFixedEventIds":["EVT_MAIN_W1_D1_MORNING_INTRO","EVT_MAIN_W1_D2_AFTERNOON_ROBO","EVT_ROMANCE_HYO_W1_D4_MORNING","EVT_MAIN_W1_D5_MORNING_ALGO","EVT_MAIN_W2_D1_MORNING_PRO","EVT_ROMANCE_HYO_W2_D2_AFTERNOON","EVT_MAIN_W2_D4_MORNING_MM"]}}	2026-03-28 12:12:35.737752+00	2026-03-28 12:30:20.694635+00
7471e4b4-8a2b-47ab-bc2d-a9da946b2621	8cb3b22c-7f8b-48e2-a869-cbaac68934c7	999999	Auto Save | 1주차 월요일 오전	{"gameState":{"hud":{"timeLabel":"오전","locationLabel":"전체 지역","week":1,"dayLabel":"월요일","actionPoint":4,"maxActionPoint":4,"hp":82,"hpMax":100,"money":100000,"stress":20},"stats":{"fe":10,"be":10,"teamwork":10,"luck":10,"stress":20},"affection":{},"flags":[],"endingProgress":{"gamePlayCount":0,"lottoRank":null}},"inventory":{"inventorySlots":[{"templateId":"item-chocolate","quantity":1},{"templateId":"item-energy-drink","quantity":1},null,null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":0},"progression":{"timeState":{"actionPoint":4,"maxActionPoint":4,"timeCycleIndex":0,"dayCycleIndex":0,"week":1},"weeklyPlan":["ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice"],"weeklyPlanWeek":1,"lastPaidWeeklySalaryWeek":1,"completedPlanSlotIndices":[]},"world":{"areaId":"world","sceneId":"scene_world_default","sceneState":{"id":"world_default","area":"world","npcs":[{"npcId":"hyoryeon","x":325,"y":480,"facing":"down","dialogueId":"npc_hyoryeon"},{"npcId":"jiwoo","x":700,"y":600,"facing":"down","dialogueId":"npc_jiwoo"},{"npcId":"jongmin","x":1120,"y":480,"facing":"down","dialogueId":"npc_jongmin"}]},"playerTile":{"tileX":9,"tileY":11}},"story":{"completedFixedEventIds":[]}}	2026-03-27 08:55:09.284884+00	2026-03-28 12:54:32.973413+00
0ef9046f-8da6-4ebc-9c2f-f38a03fcdd4b	4ffa93bb-94ac-46d7-a03c-951cb6b4842f	999999	Auto Save | 1주차 월요일 밤	{"gameState":{"hud":{"timeLabel":"밤","locationLabel":"번화가","week":1,"dayLabel":"월요일","actionPoint":1,"maxActionPoint":4,"hp":62,"hpMax":100,"money":89000,"stress":22},"stats":{"fe":20,"be":10,"teamwork":14,"luck":17,"stress":22},"affection":{},"flags":["minigame:unlocked:LottoScene"],"endingProgress":{"gamePlayCount":0,"lottoRank":4}},"inventory":{"inventorySlots":[{"templateId":"item-chocolate","quantity":1},{"templateId":"item-energy-drink","quantity":2},{"templateId":"item-soju","quantity":2},null,null,null,null,null,null,null,null,null,null,null,null,null],"equippedSlots":{"keyboard":null,"mouse":null},"consumablesUsedToday":0},"progression":{"timeState":{"actionPoint":1,"maxActionPoint":4,"timeCycleIndex":3,"dayCycleIndex":0,"week":1},"weeklyPlan":["ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice","ui_practice"],"weeklyPlanWeek":1,"lastPaidWeeklySalaryWeek":1,"completedPlanSlotIndices":[1]},"world":{"areaId":"downtown","sceneId":"scene_downtown_default","sceneState":{"id":"downtown_default","area":"downtown","npcs":[{"npcId":"yeonwoong","x":380,"y":300,"facing":"down","dialogueId":"npc_yeonwoong"},{"npcId":"minsu","x":590,"y":290,"facing":"down","dialogueId":"npc_minsu"},{"npcId":"myungjin","x":696,"y":520,"facing":"down","dialogueId":"npc_myungjin"}]},"playerTile":{"tileX":22,"tileY":4}},"story":{"completedFixedEventIds":["EVT_MAIN_W1_D1_MORNING_INTRO"]}}	2026-03-29 06:48:09.579391+00	2026-03-29 16:52:08.559024+00
\.


--
-- Data for Name: scope_mapping; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.scope_mapping (client_id, role_id) FROM stdin;
326a5eb7-4a21-4106-a30c-7f97c29d3fab	28f280d1-aab5-4d39-89c0-956e65f3980f
326a5eb7-4a21-4106-a30c-7f97c29d3fab	17f23e76-9e62-4b80-a860-3b748e296b2d
ed111216-43bb-40d4-81b7-c440a110de24	473c2ddd-0866-4eb9-a694-d5583b236960
ed111216-43bb-40d4-81b7-c440a110de24	09ffc33c-f53a-4f6a-95df-3376bce8eef1
\.


--
-- Data for Name: scope_policy; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.scope_policy (scope_id, policy_id) FROM stdin;
\.


--
-- Data for Name: user_attribute; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_attribute (name, value, user_id, id, long_value_hash, long_value_hash_lower_case, long_value) FROM stdin;
is_temporary_admin	true	198ab9f4-5762-4075-b97f-61745bd4ece8	2fde3c35-08e5-466d-b6dd-b237a3a58a5d	\N	\N	\N
\.


--
-- Data for Name: user_challenges; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_challenges (id, user_id, challenge_id, progress, target_progress, status, assigned_at, achieved_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_consent; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_consent (id, client_id, user_id, created_date, last_updated_date, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: user_consent_client_scope; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_consent_client_scope (user_consent_id, scope_id) FROM stdin;
\.


--
-- Data for Name: user_death_records; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_death_records (id, user_id, area_id, scene_id, cause, death_count_snapshot, created_at) FROM stdin;
ad94628a-d945-44c6-874d-8979d17df8bd	4ffa93bb-94ac-46d7-a03c-951cb6b4842f	CAMPUS	SCENE_CAMPUS_DEFAULT	HP_ZERO	1	2026-03-29 07:20:48.310795+00
aa7d7d68-6476-4fd3-94af-855bf3d7c03e	4ffa93bb-94ac-46d7-a03c-951cb6b4842f	WORLD	SCENE_WORLD_DEFAULT	HP_ZERO	2	2026-03-29 15:50:58.829826+00
1453d499-2c09-4d19-b6dc-c6bc8c4b9c4c	4ffa93bb-94ac-46d7-a03c-951cb6b4842f	WORLD	SCENE_WORLD_DEFAULT	HP_ZERO	3	2026-03-29 15:52:55.304627+00
\.


--
-- Data for Name: user_entity; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_entity (id, email, email_constraint, email_verified, enabled, federation_link, first_name, last_name, realm_id, username, created_timestamp, service_account_client_link, not_before) FROM stdin;
198ab9f4-5762-4075-b97f-61745bd4ece8	\N	a9191aae-fdd2-4d31-8e74-16aa6fdc894b	f	t	\N	\N	\N	e4b40266-0967-452a-b1e2-26a574255a2d	admin	1773886367333	\N	0
f6f67297-f72f-4281-97f4-a2d19a62da65	admin@test.com	admin@test.com	f	t	\N	ad	min	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	admin	1773906497141	\N	0
c4754cc1-baf9-4132-97ff-e7fed6652069	0w0n2@gmail.com	0w0n2@gmail.com	f	t	\N	0w0n	0w0n	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	0w0n	1773971737691	\N	0
0eab09e2-2bea-4bf5-bb63-9574a08edbe9	asdf@asdf.asdf	asdf@asdf.asdf	f	t	\N	asdf1234	asdf1234	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	asdf1234	1773976949266	\N	0
d634c0f9-747d-44f6-9e35-ed34fb15005d	nanau9u@gmail.com	nanau9u@gmail.com	f	t	\N	하나	송	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	nana	1773977036692	\N	0
ae05df72-09fd-4f97-b1ee-3549662a97ba	hyeon@naver.com	hyeon@naver.com	f	t	\N	yeon	seohyeon	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	hyeon	1773977084744	\N	0
8d80f9cf-b8f0-48d0-b20c-d8b9dea86542	hslee0912@gmail.com	hslee0912@gmail.com	f	t	\N	HYUNSEOK	LEE	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	consultant_hslee0912	1773977102614	\N	0
7426d1d8-56ae-45b7-9acc-1b6003094c0a	admin@admin.com	admin@admin.com	f	t	\N	admin	admin	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	gm_admin	1773977497145	\N	0
df0c4640-e891-4a1c-a1f6-12eb36d4cef2	abc@abcde	abc@abcde	f	t	\N	who	amI	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	ssafyman	1773977547969	\N	0
b98bfd99-b4d8-48fa-afb0-a863de37946e	gmlfla0219@naver.com	gmlfla0219@naver.com	f	t	\N	hehe	hehe	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	hehe	1773977580632	\N	0
cb08f2c4-e0ad-4f37-9f82-319e543d10a2	minseok6641@gmail.com	minseok6641@gmail.com	f	t	\N	Min Seok	Choi	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	minseok	1773977897491	\N	0
6198b8cd-b64d-434c-af55-151e08e8b7a4	gpgpgp12@naver.com	gpgpgp12@naver.com	f	t	\N	aa	aa	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	gpgpgp	1773977951627	\N	0
1931ca0f-fa30-4e0a-b34d-36d040bcb5ee	test@test.com	test@test.com	f	t	\N	test	test	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	test	1773977973039	\N	0
5545f1ba-f5e9-466a-a92d-24aa49bfcb71	arkk20000@gmail.com	arkk20000@gmail.com	f	t	\N	Myeong Jae	Lee	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	arkk200	1773978119899	\N	0
950cf1fd-22a5-4fd4-91e8-2d89495ebc3e	stworld27@naver.com	stworld27@naver.com	f	t	\N	영빈	박	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	dudqls	1773978288779	\N	0
903153d4-899a-40f4-8d36-8613f6efae42	swh4077@naver.com	swh4077@naver.com	f	t	\N	원호	신	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	swh4077	1773978350694	\N	0
27a641b6-35c6-4c36-bf0b-07e449dd8f01	cj855695@gmail.com	cj855695@gmail.com	f	t	\N	최	종학	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	hihi	1773979604534	\N	0
183e42a5-955e-441c-bf1c-25dad3e9f378	ssafyyoung@gmail.com	ssafyyoung@gmail.com	f	t	\N	최	영권	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	ssafyyoung	1773982143211	\N	0
024884af-efed-42a6-9f19-1bdf3da7ee06	mgc2109cc@gmail.com	mgc2109cc@gmail.com	f	t	\N	m	g	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	mgmg	1773984781893	\N	0
66352a6d-e40c-4302-b9c9-ed638de14697	yunwoong2@gmail.com	yunwoong2@gmail.com	f	t	\N	컷웅	수	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	yunwoong2	1773986382547	\N	0
a27c7ad9-536a-4f88-941b-d0f68bd5476c	jjw3300@naver.com	jjw3300@naver.com	f	t	\N	jinuk	jang	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	jjw3300	1773987218372	\N	0
57c38932-a790-4a36-ad8d-21068c693183	ssaaffyy@naver.com	ssaaffyy@naver.com	f	t	\N	kim	ssafy	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	ssaaffyy	1773988602033	\N	0
71e2a54a-5b9b-4b84-88a6-e58faecb8eba	test1234@test.com	test1234@test.com	f	t	\N	test	tess	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	test1234	1774405714968	\N	0
9dfef4bf-681c-4b96-b938-dcdd980e020f	ssadagu@gmail.com	ssadagu@gmail.com	f	t	\N	ssa	dagu	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	ssadagu	1774497823782	\N	0
97f92d79-47fd-458b-b07b-3dae515d8de3	asdf@asdf.com	asdf@asdf.com	f	t	\N	te	st	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	testuser	1774569747166	\N	0
94eb5fdc-f253-46a8-8c79-71e5e1d4e8af	1@1	1@1	f	t	\N	11	11	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	wooong1	1774598590019	\N	0
9e55faf5-d80f-4f81-b097-135f917baf45	101@gmail.com	101@gmail.com	f	t	\N	Lee	DongHwi	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	donghwi	1774598652868	\N	0
b7799718-862f-4bcd-9101-32e78605a028	qqqq@naver.com	qqqq@naver.com	f	t	\N	우치하	마다라	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	wrktpdyd	1774598965120	\N	0
8c43a270-a8f8-4ee7-899c-0c5d3095b3fb	cpop02@naver.com	cpop02@naver.com	f	t	\N	jin 	jongmin	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	cpop02	1774598989634	\N	0
e4cf9557-621d-4708-b647-94132db20430	toffl1102@naver.com	toffl1102@naver.com	f	t	\N	하	지우	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	jiwoo	1774599020553	\N	0
a948ee9a-3b92-4c97-800a-142bf5d9ce19	ehtm01@gmail.com	ehtm01@gmail.com	f	t	\N	이	도현	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	ehtm01	1774599181154	\N	0
7b34b9bd-1e6c-4729-9557-9f5ce9cb71ed	asdf@qwer.com	asdf@qwer.com	f	t	\N	asdf	qwer	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	qwerasdf	1774599630001	\N	0
5e95f7a0-d26a-4835-a32d-4e189ee0bb0f	chowh0823@gmail.com	chowh0823@gmail.com	f	t	\N	싸	피생	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	short	1774599765711	\N	0
6ea45f40-1ec3-483e-9ac1-327670b326ac	namyunseo85@gmail.com	namyunseo85@gmail.com	f	t	\N	윤서	남윤서_광주_1반_C103	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	namyunseo85@gmail.com	1774599776305	\N	0
daee01df-c4f4-41f6-bb66-b7fafb306ac8	dltmdduq8484@gmail.com	dltmdduq8484@gmail.com	f	t	\N	승엽	LEE	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	axc5126	1774599824200	\N	0
758a8dc0-92e7-4b5b-8fbd-6a1be29501dc	gksqls578@naver.com	gksqls578@naver.com	f	t	\N	최	우영	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	yangonebin	1774600757901	\N	0
32878125-c7dc-4e4e-b93c-2c9b8252e6df	sf1451605@gmail.com	sf1451605@gmail.com	f	t	\N	test	test	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	testtest	1774601820461	\N	0
426b437b-abc7-4e84-b2d7-04186a1e27f4	tjrlgus19@gmail.com	tjrlgus19@gmail.com	f	t	\N	Seo	ki hyeon	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	seokihyeon	1774601855740	\N	0
5aebbb58-3305-4bbe-b6b6-2aa6c01a8a18	dltnwls301@gmail.com	dltnwls301@gmail.com	f	t	\N	수진	이	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	sujin31	1774601882067	\N	0
4dd5b315-d087-49c4-bb3f-6a975540fbf9	hjh4212@naver.com	hjh4212@naver.com	f	t	\N	Jeongho	Ha	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	hjh1248	1774601942002	\N	0
326fb589-eaf8-406b-87fe-24f472852b8c	z9901z@naver.com	z9901z@naver.com	f	t	\N	eom 	song	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	eomsong	1774601989933	\N	0
6fe02703-d5c2-4d94-99a7-86607bf7a6bc	admin1234@gmail.com	admin1234@gmail.com	f	t	\N	ad	min	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	admin4321	1774624663501	\N	0
4ccac717-3e2a-4663-a14c-1bad93f325a4	hhh@hhh.com	hhh@hhh.com	f	t	\N	h	hh	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	hhh	1774702449735	\N	0
16903467-bdcd-48bb-97ce-f81462399d69	admin4444@gmail.com	admin4444@gmail.com	f	t	\N	admin	4444	de428ae7-f15c-47c3-9d4f-8003ed1cc2d5	admin4444	1774705589899	\N	0
\.


--
-- Data for Name: user_federation_config; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_federation_config (user_federation_provider_id, value, name) FROM stdin;
\.


--
-- Data for Name: user_federation_mapper; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_federation_mapper (id, name, federation_provider_id, federation_mapper_type, realm_id) FROM stdin;
\.


--
-- Data for Name: user_federation_mapper_config; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_federation_mapper_config (user_federation_mapper_id, value, name) FROM stdin;
\.


--
-- Data for Name: user_federation_provider; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_federation_provider (id, changed_sync_period, display_name, full_sync_period, last_sync, priority, provider_name, realm_id) FROM stdin;
\.


--
-- Data for Name: user_group_membership; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_group_membership (group_id, user_id, membership_type) FROM stdin;
\.


--
-- Data for Name: user_required_action; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_required_action (user_id, required_action) FROM stdin;
\.


--
-- Data for Name: user_role_mapping; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.user_role_mapping (role_id, user_id) FROM stdin;
3bef6e98-1dfb-4e70-90d6-9f8de5436ca3	198ab9f4-5762-4075-b97f-61745bd4ece8
d1ee855c-d858-4e55-825e-c68258acd3ac	198ab9f4-5762-4075-b97f-61745bd4ece8
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	f6f67297-f72f-4281-97f4-a2d19a62da65
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	c4754cc1-baf9-4132-97ff-e7fed6652069
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	0eab09e2-2bea-4bf5-bb63-9574a08edbe9
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	d634c0f9-747d-44f6-9e35-ed34fb15005d
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	ae05df72-09fd-4f97-b1ee-3549662a97ba
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	8d80f9cf-b8f0-48d0-b20c-d8b9dea86542
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	7426d1d8-56ae-45b7-9acc-1b6003094c0a
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	df0c4640-e891-4a1c-a1f6-12eb36d4cef2
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	b98bfd99-b4d8-48fa-afb0-a863de37946e
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	cb08f2c4-e0ad-4f37-9f82-319e543d10a2
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	6198b8cd-b64d-434c-af55-151e08e8b7a4
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	1931ca0f-fa30-4e0a-b34d-36d040bcb5ee
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	5545f1ba-f5e9-466a-a92d-24aa49bfcb71
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	950cf1fd-22a5-4fd4-91e8-2d89495ebc3e
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	903153d4-899a-40f4-8d36-8613f6efae42
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	27a641b6-35c6-4c36-bf0b-07e449dd8f01
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	183e42a5-955e-441c-bf1c-25dad3e9f378
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	024884af-efed-42a6-9f19-1bdf3da7ee06
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	66352a6d-e40c-4302-b9c9-ed638de14697
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	a27c7ad9-536a-4f88-941b-d0f68bd5476c
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	57c38932-a790-4a36-ad8d-21068c693183
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	71e2a54a-5b9b-4b84-88a6-e58faecb8eba
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	9dfef4bf-681c-4b96-b938-dcdd980e020f
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	97f92d79-47fd-458b-b07b-3dae515d8de3
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	94eb5fdc-f253-46a8-8c79-71e5e1d4e8af
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	9e55faf5-d80f-4f81-b097-135f917baf45
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	b7799718-862f-4bcd-9101-32e78605a028
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	8c43a270-a8f8-4ee7-899c-0c5d3095b3fb
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	e4cf9557-621d-4708-b647-94132db20430
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	a948ee9a-3b92-4c97-800a-142bf5d9ce19
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	7b34b9bd-1e6c-4729-9557-9f5ce9cb71ed
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	5e95f7a0-d26a-4835-a32d-4e189ee0bb0f
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	6ea45f40-1ec3-483e-9ac1-327670b326ac
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	daee01df-c4f4-41f6-bb66-b7fafb306ac8
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	758a8dc0-92e7-4b5b-8fbd-6a1be29501dc
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	32878125-c7dc-4e4e-b93c-2c9b8252e6df
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	426b437b-abc7-4e84-b2d7-04186a1e27f4
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	5aebbb58-3305-4bbe-b6b6-2aa6c01a8a18
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	4dd5b315-d087-49c4-bb3f-6a975540fbf9
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	326fb589-eaf8-406b-87fe-24f472852b8c
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	6fe02703-d5c2-4d94-99a7-86607bf7a6bc
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	4ccac717-3e2a-4663-a14c-1bad93f325a4
9d4372aa-bbbf-4536-bb1e-d0e9ccb8be85	16903467-bdcd-48bb-97ce-f81462399d69
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.users (id, email, username, email_verified, phone, birthday, provider, provider_id, last_login_at, created_at, updated_at, deleted_at, death_count, last_death_at) FROM stdin;
8539d7bb-d458-41c4-9fc6-8d1a8e25490f	toffl1102@naver.com	jiwoo	f	\N	\N	keycloak	e4cf9557-621d-4708-b647-94132db20430	2026-03-27 08:59:50.18961+00	2026-03-27 08:10:21.222134+00	2026-03-27 08:59:50.189874+00	\N	0	\N
8f7bbfe7-4b65-4f43-bf47-00fe4b177f8f	asdf@qwer.com	qwerasdf	f	\N	\N	keycloak	7b34b9bd-1e6c-4729-9557-9f5ce9cb71ed	2026-03-27 08:20:30.382449+00	2026-03-27 08:20:30.383154+00	2026-03-27 08:20:30.383154+00	\N	0	\N
ab7f65b1-7a73-4954-ab45-e698cb453962	cj855695@gmail.com	hihi	f	\N	\N	keycloak	27a641b6-35c6-4c36-bf0b-07e449dd8f01	2026-03-27 08:21:56.654465+00	2026-03-20 04:06:44.919848+00	2026-03-27 08:21:56.654823+00	\N	0	\N
2a50b8f5-0e25-4900-b15d-e00e7eb9a259	swh4077@naver.com	swh4077	f	\N	\N	keycloak	903153d4-899a-40f4-8d36-8613f6efae42	2026-03-27 07:59:58.058059+00	2026-03-20 03:45:51.069941+00	2026-03-27 07:59:58.058517+00	\N	0	\N
f54dc344-c674-4e79-9407-4f39155109c7	admin1234@gmail.com	admin4321	f	\N	\N	keycloak	6fe02703-d5c2-4d94-99a7-86607bf7a6bc	2026-03-27 15:17:43.96439+00	2026-03-27 15:17:43.965121+00	2026-03-27 15:17:43.965121+00	\N	0	\N
d6f81035-f582-4809-85b4-21e6182b953f	qqqq@naver.com	wrktpdyd	f	\N	\N	keycloak	b7799718-862f-4bcd-9101-32e78605a028	2026-03-27 08:09:25.27362+00	2026-03-27 08:09:25.274356+00	2026-03-27 08:09:25.274356+00	\N	0	\N
159ba3f6-fe15-4b25-8e23-d5e97a1a0451	test1234@test.com	test1234	f	\N	\N	keycloak	71e2a54a-5b9b-4b84-88a6-e58faecb8eba	2026-03-25 03:02:42.018946+00	2026-03-25 02:28:35.464347+00	2026-03-25 03:02:42.019357+00	\N	0	\N
80fcfba7-fff2-4b1d-b920-0a8f0d417eec	0w0n2@gmail.com	0w0n	f	\N	\N	keycloak	c4754cc1-baf9-4132-97ff-e7fed6652069	2026-03-20 01:56:49.522142+00	2026-03-20 01:55:38.534945+00	2026-03-20 01:56:49.522511+00	\N	0	\N
56a02358-2325-41b3-bc42-8790583f1932	asdf@asdf.asdf	asdf1234	f	\N	\N	keycloak	0eab09e2-2bea-4bf5-bb63-9574a08edbe9	2026-03-20 03:22:29.722889+00	2026-03-20 03:22:29.724003+00	2026-03-20 03:22:29.724003+00	\N	0	\N
107f2a72-5aad-49cd-8a9f-54ffa4402ccd	hyeon@naver.com	hyeon	f	\N	\N	keycloak	ae05df72-09fd-4f97-b1ee-3549662a97ba	2026-03-20 03:24:45.127646+00	2026-03-20 03:24:45.128598+00	2026-03-20 03:24:45.128598+00	\N	0	\N
13b358a8-4b13-4293-b747-383314a05655	nanau9u@gmail.com	nana	f	\N	\N	keycloak	d634c0f9-747d-44f6-9e35-ed34fb15005d	2026-03-20 03:30:22.050429+00	2026-03-20 03:23:57.06648+00	2026-03-20 03:30:22.050842+00	\N	0	\N
8c83de8f-5dff-4b55-8789-57859bc1d3c2	admin@admin.com	gm_admin	f	\N	\N	keycloak	7426d1d8-56ae-45b7-9acc-1b6003094c0a	2026-03-20 03:31:37.508337+00	2026-03-20 03:31:37.509427+00	2026-03-20 03:31:37.509427+00	\N	0	\N
f428392a-6d61-451c-adac-cbd5d261440a	abc@abcde	ssafyman	f	\N	\N	keycloak	df0c4640-e891-4a1c-a1f6-12eb36d4cef2	2026-03-20 03:32:28.642958+00	2026-03-20 03:32:28.643827+00	2026-03-20 03:32:28.643827+00	\N	0	\N
107bc74a-0858-43f3-afc2-3a2fc553ff17	gmlfla0219@naver.com	hehe	f	\N	\N	keycloak	b98bfd99-b4d8-48fa-afb0-a863de37946e	2026-03-20 03:33:00.999959+00	2026-03-20 03:33:01.000789+00	2026-03-20 03:33:01.000789+00	\N	0	\N
cfdaf1f8-00a9-4018-b9b3-a2cf97fdbcab	minseok6641@gmail.com	minseok	f	\N	\N	keycloak	cb08f2c4-e0ad-4f37-9f82-319e543d10a2	2026-03-20 03:38:18.43404+00	2026-03-20 03:38:18.435037+00	2026-03-20 03:38:18.435037+00	\N	0	\N
1c0cd33c-79fc-47b8-83f4-515b370b2c8e	gpgpgp12@naver.com	gpgpgp	f	\N	\N	keycloak	6198b8cd-b64d-434c-af55-151e08e8b7a4	2026-03-20 03:39:12.032354+00	2026-03-20 03:39:12.033215+00	2026-03-20 03:39:12.033215+00	\N	0	\N
1a24d285-9ee7-4494-9e91-cb6fc5910370	test@test.com	test	f	\N	\N	keycloak	1931ca0f-fa30-4e0a-b34d-36d040bcb5ee	2026-03-20 03:39:33.42288+00	2026-03-17 08:52:36.641372+00	2026-03-20 03:39:33.423265+00	\N	0	\N
660888cd-685a-45df-9430-91f3d662a964	stworld27@naver.com	dudqls	f	\N	\N	keycloak	950cf1fd-22a5-4fd4-91e8-2d89495ebc3e	2026-03-20 03:44:49.21544+00	2026-03-20 03:44:49.216433+00	2026-03-20 03:44:49.216433+00	\N	0	\N
fd66b113-5b64-438a-bc40-e6ea31ff00ee	dltmdduq8484@gmail.com	axc5126	f	\N	\N	keycloak	daee01df-c4f4-41f6-bb66-b7fafb306ac8	2026-03-27 08:23:44.592622+00	2026-03-27 08:23:44.593296+00	2026-03-27 08:23:44.593296+00	\N	0	\N
d2113e26-81f9-4102-a204-bd535939eba5	101@gmail.com	donghwi	f	\N	\N	keycloak	9e55faf5-d80f-4f81-b097-135f917baf45	2026-03-27 08:46:01.277877+00	2026-03-27 08:04:13.573349+00	2026-03-27 08:46:01.278155+00	\N	0	\N
c51bc93c-e31e-494c-916b-c3d5142e5b49	arkk20000@gmail.com	arkk200	f	\N	\N	keycloak	5545f1ba-f5e9-466a-a92d-24aa49bfcb71	2026-03-20 04:29:19.037999+00	2026-03-20 03:42:00.281122+00	2026-03-20 04:29:19.03848+00	\N	0	\N
c0ba1b56-f6b5-4af1-adef-f5c31b0fc977	ssafyyoung@gmail.com	ssafyyoung	f	\N	\N	keycloak	183e42a5-955e-441c-bf1c-25dad3e9f378	2026-03-20 04:49:03.963898+00	2026-03-20 04:49:03.965015+00	2026-03-20 04:49:03.965015+00	\N	0	\N
fa34ae8b-6e5c-493c-9c1a-a57e30199afc	mgc2109cc@gmail.com	mgmg	f	\N	\N	keycloak	024884af-efed-42a6-9f19-1bdf3da7ee06	2026-03-20 05:46:48.018829+00	2026-03-20 05:33:02.481602+00	2026-03-20 05:46:48.019235+00	\N	0	\N
234bef6b-44c4-4fc0-b0b9-aaf77ce062ad	jjw3300@naver.com	jjw3300	f	\N	\N	keycloak	a27c7ad9-536a-4f88-941b-d0f68bd5476c	2026-03-20 06:13:38.862633+00	2026-03-20 06:13:38.863678+00	2026-03-20 06:13:38.863678+00	\N	0	\N
2a497860-7b33-4fe3-baa7-c4eb99025b4d	ssaaffyy@naver.com	ssaaffyy	f	\N	\N	keycloak	57c38932-a790-4a36-ad8d-21068c693183	2026-03-20 06:36:42.511331+00	2026-03-20 06:36:42.512336+00	2026-03-20 06:36:42.512336+00	\N	0	\N
e5f370fa-720b-431c-8702-d248b7ce622c	z9901z@naver.com	eomsong	f	\N	\N	keycloak	326fb589-eaf8-406b-87fe-24f472852b8c	2026-03-27 10:24:47.978814+00	2026-03-27 08:59:50.369573+00	2026-03-27 10:24:47.979082+00	\N	0	\N
2df0ccbf-11c6-47bc-b25c-382b07ddfd76	chowh0823@gmail.com	short	f	\N	\N	keycloak	5e95f7a0-d26a-4835-a32d-4e189ee0bb0f	2026-03-27 08:28:13.543673+00	2026-03-27 08:22:46.163908+00	2026-03-27 08:28:13.544035+00	\N	0	\N
99652a7b-0d84-4f53-bbec-f91fcc13acc4	ehtm01@gmail.com	ehtm01	f	\N	\N	keycloak	a948ee9a-3b92-4c97-800a-142bf5d9ce19	2026-03-27 08:13:01.776211+00	2026-03-27 08:13:01.776965+00	2026-03-27 08:13:01.776965+00	\N	0	\N
1566394c-0069-4c7d-8cd9-33c6dd256443	namyunseo85@gmail.com	namyunseo85@gmail.com	f	\N	\N	keycloak	6ea45f40-1ec3-483e-9ac1-327670b326ac	2026-03-27 08:28:13.901081+00	2026-03-27 08:22:56.777407+00	2026-03-27 08:28:13.901455+00	\N	0	\N
eb132cfd-4f75-4a8e-b1ff-8f9583182dc0	hhh@hhh.com	hhh	f	\N	\N	keycloak	4ccac717-3e2a-4663-a14c-1bad93f325a4	2026-03-28 12:59:19.77587+00	2026-03-28 12:54:10.147559+00	2026-03-28 12:59:19.7761+00	\N	0	\N
3c2301dd-d1a3-4214-a142-1770cee6602f	ssadagu@gmail.com	ssadagu	f	\N	\N	keycloak	9dfef4bf-681c-4b96-b938-dcdd980e020f	2026-03-26 04:03:44.312785+00	2026-03-26 04:03:44.314217+00	2026-03-26 04:03:44.314217+00	\N	0	\N
5ac5bf77-f501-44ec-aca6-17caf27b6f70	admin4444@gmail.com	admin4444	f	\N	\N	keycloak	16903467-bdcd-48bb-97ce-f81462399d69	2026-03-28 13:46:30.424906+00	2026-03-28 13:46:30.42562+00	2026-03-28 13:46:30.42562+00	\N	0	\N
f09299ba-32b4-45e3-b81c-17d6ec90f098	asdf@asdf.com	testuser	f	\N	\N	keycloak	97f92d79-47fd-458b-b07b-3dae515d8de3	2026-03-27 08:55:24.242417+00	2026-03-27 00:02:28.969299+00	2026-03-27 08:55:24.242802+00	\N	0	\N
4ffa93bb-94ac-46d7-a03c-951cb6b4842f	admin@test.com	admin	f	\N	\N	keycloak	f6f67297-f72f-4281-97f4-a2d19a62da65	2026-03-29 16:49:31.739081+00	2026-03-19 08:44:22.353576+00	2026-03-29 16:49:31.739438+00	\N	3	2026-03-29 15:52:55.302179+00
ed571711-212d-4d4f-bbcd-f09384e33b38	sf1451605@gmail.com	testtest	f	\N	\N	keycloak	32878125-c7dc-4e4e-b93c-2c9b8252e6df	2026-03-27 08:57:00.930152+00	2026-03-27 08:57:00.930694+00	2026-03-27 08:57:00.930694+00	\N	0	\N
e4b9a455-6418-45b6-a1f0-7684d6776436	yunwoong2@gmail.com	yunwoong2	f	\N	\N	keycloak	66352a6d-e40c-4302-b9c9-ed638de14697	2026-03-29 12:34:00.159328+00	2026-03-19 00:56:38.29701+00	2026-03-29 12:34:00.169577+00	\N	0	\N
0ea51a71-a9a5-44a6-87c5-9a9acff0c6fb	1@1	wooong1	f	\N	\N	keycloak	94eb5fdc-f253-46a8-8c79-71e5e1d4e8af	2026-03-27 08:39:16.569493+00	2026-03-27 08:03:10.461332+00	2026-03-27 08:39:16.56986+00	\N	0	\N
8cb3b22c-7f8b-48e2-a869-cbaac68934c7	cpop02@naver.com	cpop02	f	\N	\N	keycloak	8c43a270-a8f8-4ee7-899c-0c5d3095b3fb	2026-03-29 13:37:05.950976+00	2026-03-27 08:09:50.457136+00	2026-03-29 13:37:05.951337+00	\N	0	\N
5a9835d4-3abe-4e3d-8649-bd2da9b22d65	tjrlgus19@gmail.com	seokihyeon	f	\N	\N	keycloak	426b437b-abc7-4e84-b2d7-04186a1e27f4	2026-03-27 08:57:36.423241+00	2026-03-27 08:57:36.42382+00	2026-03-27 08:57:36.42382+00	\N	0	\N
368aca09-a2f5-472b-ae27-32b9d1d0bbc1	dltnwls301@gmail.com	sujin31	f	\N	\N	keycloak	5aebbb58-3305-4bbe-b6b6-2aa6c01a8a18	2026-03-27 08:58:02.441838+00	2026-03-27 08:58:02.442579+00	2026-03-27 08:58:02.442579+00	\N	0	\N
dd9f59fc-7d20-4d85-909f-d03241a1cc39	hjh4212@naver.com	hjh1248	f	\N	\N	keycloak	4dd5b315-d087-49c4-bb3f-6a975540fbf9	2026-03-27 08:59:02.39132+00	2026-03-27 08:59:02.391869+00	2026-03-27 08:59:02.391869+00	\N	0	\N
cc7ceb98-cd8e-4542-9d31-679519bb6db2	hslee0912@gmail.com	consultant_hslee0912	f	\N	\N	keycloak	8d80f9cf-b8f0-48d0-b20c-d8b9dea86542	2026-03-28 09:02:10.237169+00	2026-03-20 03:25:02.984602+00	2026-03-28 09:02:10.237456+00	\N	0	\N
\.


--
-- Data for Name: web_origins; Type: TABLE DATA; Schema: public; Owner: stg_app
--

COPY public.web_origins (client_id, value) FROM stdin;
ada9c621-b0c0-4b02-b33e-011a78309041	+
874892be-6f1d-4646-a497-cf38baa87865	+
c200afa9-e84a-4df3-b313-5ccb1e69b28c	https://ssafymaker.cloud
c200afa9-e84a-4df3-b313-5ccb1e69b28c	http://localhost:5173
c200afa9-e84a-4df3-b313-5ccb1e69b28c	https://stg.ssafymaker.cloud
\.


--
-- Name: org_domain ORG_DOMAIN_pkey; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.org_domain
    ADD CONSTRAINT "ORG_DOMAIN_pkey" PRIMARY KEY (id, name);


--
-- Name: org ORG_pkey; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT "ORG_pkey" PRIMARY KEY (id);


--
-- Name: keycloak_role UK_J3RWUVD56ONTGSUHOGM184WW2-2; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT "UK_J3RWUVD56ONTGSUHOGM184WW2-2" UNIQUE (name, client_realm_constraint);


--
-- Name: asset_bundle_files asset_bundle_files_pkey; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.asset_bundle_files
    ADD CONSTRAINT asset_bundle_files_pkey PRIMARY KEY (id);


--
-- Name: client_auth_flow_bindings c_cli_flow_bind; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_auth_flow_bindings
    ADD CONSTRAINT c_cli_flow_bind PRIMARY KEY (client_id, binding_name);


--
-- Name: client_scope_client c_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_scope_client
    ADD CONSTRAINT c_cli_scope_bind PRIMARY KEY (client_id, scope_id);


--
-- Name: challenges challenges_code_key; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_code_key UNIQUE (code);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: client_initial_access cnstr_client_init_acc_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT cnstr_client_init_acc_pk PRIMARY KEY (id);


--
-- Name: realm_default_groups con_group_id_def_groups; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT con_group_id_def_groups UNIQUE (group_id);


--
-- Name: broker_link constr_broker_link_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.broker_link
    ADD CONSTRAINT constr_broker_link_pk PRIMARY KEY (identity_provider, user_id);


--
-- Name: component_config constr_component_config_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT constr_component_config_pk PRIMARY KEY (id);


--
-- Name: component constr_component_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT constr_component_pk PRIMARY KEY (id);


--
-- Name: fed_user_required_action constr_fed_required_action; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.fed_user_required_action
    ADD CONSTRAINT constr_fed_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: fed_user_attribute constr_fed_user_attr_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.fed_user_attribute
    ADD CONSTRAINT constr_fed_user_attr_pk PRIMARY KEY (id);


--
-- Name: fed_user_consent constr_fed_user_consent_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.fed_user_consent
    ADD CONSTRAINT constr_fed_user_consent_pk PRIMARY KEY (id);


--
-- Name: fed_user_credential constr_fed_user_cred_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.fed_user_credential
    ADD CONSTRAINT constr_fed_user_cred_pk PRIMARY KEY (id);


--
-- Name: fed_user_group_membership constr_fed_user_group; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.fed_user_group_membership
    ADD CONSTRAINT constr_fed_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: fed_user_role_mapping constr_fed_user_role; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.fed_user_role_mapping
    ADD CONSTRAINT constr_fed_user_role PRIMARY KEY (role_id, user_id);


--
-- Name: federated_user constr_federated_user; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.federated_user
    ADD CONSTRAINT constr_federated_user PRIMARY KEY (id);


--
-- Name: realm_default_groups constr_realm_default_groups; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT constr_realm_default_groups PRIMARY KEY (realm_id, group_id);


--
-- Name: realm_enabled_event_types constr_realm_enabl_event_types; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT constr_realm_enabl_event_types PRIMARY KEY (realm_id, value);


--
-- Name: realm_events_listeners constr_realm_events_listeners; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT constr_realm_events_listeners PRIMARY KEY (realm_id, value);


--
-- Name: realm_supported_locales constr_realm_supported_locales; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT constr_realm_supported_locales PRIMARY KEY (realm_id, value);


--
-- Name: identity_provider constraint_2b; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT constraint_2b PRIMARY KEY (internal_id);


--
-- Name: client_attributes constraint_3c; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT constraint_3c PRIMARY KEY (client_id, name);


--
-- Name: event_entity constraint_4; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.event_entity
    ADD CONSTRAINT constraint_4 PRIMARY KEY (id);


--
-- Name: federated_identity constraint_40; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT constraint_40 PRIMARY KEY (identity_provider, user_id);


--
-- Name: realm constraint_4a; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT constraint_4a PRIMARY KEY (id);


--
-- Name: user_federation_provider constraint_5c; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT constraint_5c PRIMARY KEY (id);


--
-- Name: client constraint_7; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT constraint_7 PRIMARY KEY (id);


--
-- Name: scope_mapping constraint_81; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT constraint_81 PRIMARY KEY (client_id, role_id);


--
-- Name: client_node_registrations constraint_84; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT constraint_84 PRIMARY KEY (client_id, name);


--
-- Name: realm_attribute constraint_9; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT constraint_9 PRIMARY KEY (name, realm_id);


--
-- Name: realm_required_credential constraint_92; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT constraint_92 PRIMARY KEY (realm_id, type);


--
-- Name: keycloak_role constraint_a; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT constraint_a PRIMARY KEY (id);


--
-- Name: admin_event_entity constraint_admin_event_entity; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.admin_event_entity
    ADD CONSTRAINT constraint_admin_event_entity PRIMARY KEY (id);


--
-- Name: authenticator_config_entry constraint_auth_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.authenticator_config_entry
    ADD CONSTRAINT constraint_auth_cfg_pk PRIMARY KEY (authenticator_id, name);


--
-- Name: authentication_execution constraint_auth_exec_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT constraint_auth_exec_pk PRIMARY KEY (id);


--
-- Name: authentication_flow constraint_auth_flow_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT constraint_auth_flow_pk PRIMARY KEY (id);


--
-- Name: authenticator_config constraint_auth_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT constraint_auth_pk PRIMARY KEY (id);


--
-- Name: user_role_mapping constraint_c; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT constraint_c PRIMARY KEY (role_id, user_id);


--
-- Name: composite_role constraint_composite_role; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT constraint_composite_role PRIMARY KEY (composite, child_role);


--
-- Name: identity_provider_config constraint_d; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT constraint_d PRIMARY KEY (identity_provider_id, name);


--
-- Name: policy_config constraint_dpc; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT constraint_dpc PRIMARY KEY (policy_id, name);


--
-- Name: realm_smtp_config constraint_e; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT constraint_e PRIMARY KEY (realm_id, name);


--
-- Name: credential constraint_f; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT constraint_f PRIMARY KEY (id);


--
-- Name: user_federation_config constraint_f9; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT constraint_f9 PRIMARY KEY (user_federation_provider_id, name);


--
-- Name: resource_server_perm_ticket constraint_fapmt; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT constraint_fapmt PRIMARY KEY (id);


--
-- Name: resource_server_resource constraint_farsr; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT constraint_farsr PRIMARY KEY (id);


--
-- Name: resource_server_policy constraint_farsrp; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT constraint_farsrp PRIMARY KEY (id);


--
-- Name: associated_policy constraint_farsrpap; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT constraint_farsrpap PRIMARY KEY (policy_id, associated_policy_id);


--
-- Name: resource_policy constraint_farsrpp; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT constraint_farsrpp PRIMARY KEY (resource_id, policy_id);


--
-- Name: resource_server_scope constraint_farsrs; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT constraint_farsrs PRIMARY KEY (id);


--
-- Name: resource_scope constraint_farsrsp; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT constraint_farsrsp PRIMARY KEY (resource_id, scope_id);


--
-- Name: scope_policy constraint_farsrsps; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT constraint_farsrsps PRIMARY KEY (scope_id, policy_id);


--
-- Name: user_entity constraint_fb; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT constraint_fb PRIMARY KEY (id);


--
-- Name: user_federation_mapper_config constraint_fedmapper_cfg_pm; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT constraint_fedmapper_cfg_pm PRIMARY KEY (user_federation_mapper_id, name);


--
-- Name: user_federation_mapper constraint_fedmapperpm; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT constraint_fedmapperpm PRIMARY KEY (id);


--
-- Name: fed_user_consent_cl_scope constraint_fgrntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.fed_user_consent_cl_scope
    ADD CONSTRAINT constraint_fgrntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent_client_scope constraint_grntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT constraint_grntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent constraint_grntcsnt_pm; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT constraint_grntcsnt_pm PRIMARY KEY (id);


--
-- Name: keycloak_group constraint_group; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT constraint_group PRIMARY KEY (id);


--
-- Name: group_attribute constraint_group_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT constraint_group_attribute_pk PRIMARY KEY (id);


--
-- Name: group_role_mapping constraint_group_role; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT constraint_group_role PRIMARY KEY (role_id, group_id);


--
-- Name: identity_provider_mapper constraint_idpm; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT constraint_idpm PRIMARY KEY (id);


--
-- Name: idp_mapper_config constraint_idpmconfig; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT constraint_idpmconfig PRIMARY KEY (idp_mapper_id, name);


--
-- Name: jgroups_ping constraint_jgroups_ping; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.jgroups_ping
    ADD CONSTRAINT constraint_jgroups_ping PRIMARY KEY (address);


--
-- Name: migration_model constraint_migmod; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.migration_model
    ADD CONSTRAINT constraint_migmod PRIMARY KEY (id);


--
-- Name: offline_client_session constraint_offl_cl_ses_pk3; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.offline_client_session
    ADD CONSTRAINT constraint_offl_cl_ses_pk3 PRIMARY KEY (user_session_id, client_id, client_storage_provider, external_client_id, offline_flag);


--
-- Name: offline_user_session constraint_offl_us_ses_pk2; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.offline_user_session
    ADD CONSTRAINT constraint_offl_us_ses_pk2 PRIMARY KEY (user_session_id, offline_flag);


--
-- Name: protocol_mapper constraint_pcm; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT constraint_pcm PRIMARY KEY (id);


--
-- Name: protocol_mapper_config constraint_pmconfig; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT constraint_pmconfig PRIMARY KEY (protocol_mapper_id, name);


--
-- Name: redirect_uris constraint_redirect_uris; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT constraint_redirect_uris PRIMARY KEY (client_id, value);


--
-- Name: required_action_config constraint_req_act_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.required_action_config
    ADD CONSTRAINT constraint_req_act_cfg_pk PRIMARY KEY (required_action_id, name);


--
-- Name: required_action_provider constraint_req_act_prv_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT constraint_req_act_prv_pk PRIMARY KEY (id);


--
-- Name: user_required_action constraint_required_action; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT constraint_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: resource_uris constraint_resour_uris_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT constraint_resour_uris_pk PRIMARY KEY (resource_id, value);


--
-- Name: role_attribute constraint_role_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT constraint_role_attribute_pk PRIMARY KEY (id);


--
-- Name: revoked_token constraint_rt; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.revoked_token
    ADD CONSTRAINT constraint_rt PRIMARY KEY (id);


--
-- Name: user_attribute constraint_user_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT constraint_user_attribute_pk PRIMARY KEY (id);


--
-- Name: user_group_membership constraint_user_group; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT constraint_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: web_origins constraint_web_origins; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT constraint_web_origins PRIMARY KEY (client_id, value);


--
-- Name: databasechangeloglock databasechangeloglock_pkey; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.databasechangeloglock
    ADD CONSTRAINT databasechangeloglock_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: client_scope_attributes pk_cl_tmpl_attr; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT pk_cl_tmpl_attr PRIMARY KEY (scope_id, name);


--
-- Name: client_scope pk_cli_template; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT pk_cli_template PRIMARY KEY (id);


--
-- Name: resource_server pk_resource_server; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server
    ADD CONSTRAINT pk_resource_server PRIMARY KEY (id);


--
-- Name: client_scope_role_mapping pk_template_scope; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT pk_template_scope PRIMARY KEY (scope_id, role_id);


--
-- Name: default_client_scope r_def_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT r_def_cli_scope_bind PRIMARY KEY (realm_id, scope_id);


--
-- Name: realm_localizations realm_localizations_pkey; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_localizations
    ADD CONSTRAINT realm_localizations_pkey PRIMARY KEY (realm_id, locale);


--
-- Name: resource_attribute res_attr_pk; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT res_attr_pk PRIMARY KEY (id);


--
-- Name: save_files save_files_pkey; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.save_files
    ADD CONSTRAINT save_files_pkey PRIMARY KEY (id);


--
-- Name: keycloak_group sibling_names; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT sibling_names UNIQUE (realm_id, parent_group, name);


--
-- Name: identity_provider uk_2daelwnibji49avxsrtuf6xj33; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT uk_2daelwnibji49avxsrtuf6xj33 UNIQUE (provider_alias, realm_id);


--
-- Name: client uk_b71cjlbenv945rb6gcon438at; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT uk_b71cjlbenv945rb6gcon438at UNIQUE (realm_id, client_id);


--
-- Name: client_scope uk_cli_scope; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT uk_cli_scope UNIQUE (realm_id, name);


--
-- Name: user_entity uk_dykn684sl8up1crfei6eckhd7; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_dykn684sl8up1crfei6eckhd7 UNIQUE (realm_id, email_constraint);


--
-- Name: user_consent uk_external_consent; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT uk_external_consent UNIQUE (client_storage_provider, external_client_id, user_id);


--
-- Name: resource_server_resource uk_frsr6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5ha6 UNIQUE (name, owner, resource_server_id);


--
-- Name: resource_server_perm_ticket uk_frsr6t700s9v50bu18ws5pmt; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5pmt UNIQUE (owner, requester, resource_server_id, resource_id, scope_id);


--
-- Name: resource_server_policy uk_frsrpt700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT uk_frsrpt700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: resource_server_scope uk_frsrst700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT uk_frsrst700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: user_consent uk_local_consent; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT uk_local_consent UNIQUE (client_id, user_id);


--
-- Name: org uk_org_alias; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT uk_org_alias UNIQUE (realm_id, alias);


--
-- Name: org uk_org_group; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT uk_org_group UNIQUE (group_id);


--
-- Name: org uk_org_name; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT uk_org_name UNIQUE (realm_id, name);


--
-- Name: realm uk_orvsdmla56612eaefiq6wl5oi; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT uk_orvsdmla56612eaefiq6wl5oi UNIQUE (name);


--
-- Name: user_entity uk_ru8tt6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_ru8tt6t700s9v50bu18ws5ha6 UNIQUE (realm_id, username);


--
-- Name: save_files uq_save_files_user_slot; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.save_files
    ADD CONSTRAINT uq_save_files_user_slot UNIQUE (user_id, slot_number);


--
-- Name: user_challenges uq_user_challenges_user_challenge; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT uq_user_challenges_user_challenge UNIQUE (user_id, challenge_id);


--
-- Name: user_challenges user_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT user_challenges_pkey PRIMARY KEY (id);


--
-- Name: user_death_records user_death_records_pkey; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_death_records
    ADD CONSTRAINT user_death_records_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_provider_id_key UNIQUE (provider_id);


--
-- Name: fed_user_attr_long_values; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX fed_user_attr_long_values ON public.fed_user_attribute USING btree (long_value_hash, name);


--
-- Name: fed_user_attr_long_values_lower_case; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX fed_user_attr_long_values_lower_case ON public.fed_user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_admin_event_time; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_admin_event_time ON public.admin_event_entity USING btree (realm_id, admin_event_time);


--
-- Name: idx_asset_bundle_files_bundle_id; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_asset_bundle_files_bundle_id ON public.asset_bundle_files USING btree (asset_bundle_id);


--
-- Name: idx_assoc_pol_assoc_pol_id; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_assoc_pol_assoc_pol_id ON public.associated_policy USING btree (associated_policy_id);


--
-- Name: idx_auth_config_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_auth_config_realm ON public.authenticator_config USING btree (realm_id);


--
-- Name: idx_auth_exec_flow; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_auth_exec_flow ON public.authentication_execution USING btree (flow_id);


--
-- Name: idx_auth_exec_realm_flow; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_auth_exec_realm_flow ON public.authentication_execution USING btree (realm_id, flow_id);


--
-- Name: idx_auth_flow_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_auth_flow_realm ON public.authentication_flow USING btree (realm_id);


--
-- Name: idx_cl_clscope; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_cl_clscope ON public.client_scope_client USING btree (scope_id);


--
-- Name: idx_client_att_by_name_value; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_client_att_by_name_value ON public.client_attributes USING btree (name, substr(value, 1, 255));


--
-- Name: idx_client_id; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_client_id ON public.client USING btree (client_id);


--
-- Name: idx_client_init_acc_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_client_init_acc_realm ON public.client_initial_access USING btree (realm_id);


--
-- Name: idx_clscope_attrs; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_clscope_attrs ON public.client_scope_attributes USING btree (scope_id);


--
-- Name: idx_clscope_cl; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_clscope_cl ON public.client_scope_client USING btree (client_id);


--
-- Name: idx_clscope_protmap; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_clscope_protmap ON public.protocol_mapper USING btree (client_scope_id);


--
-- Name: idx_clscope_role; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_clscope_role ON public.client_scope_role_mapping USING btree (scope_id);


--
-- Name: idx_compo_config_compo; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_compo_config_compo ON public.component_config USING btree (component_id);


--
-- Name: idx_component_provider_type; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_component_provider_type ON public.component USING btree (provider_type);


--
-- Name: idx_component_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_component_realm ON public.component USING btree (realm_id);


--
-- Name: idx_composite; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_composite ON public.composite_role USING btree (composite);


--
-- Name: idx_composite_child; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_composite_child ON public.composite_role USING btree (child_role);


--
-- Name: idx_defcls_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_defcls_realm ON public.default_client_scope USING btree (realm_id);


--
-- Name: idx_defcls_scope; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_defcls_scope ON public.default_client_scope USING btree (scope_id);


--
-- Name: idx_event_time; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_event_time ON public.event_entity USING btree (realm_id, event_time);


--
-- Name: idx_fedidentity_feduser; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fedidentity_feduser ON public.federated_identity USING btree (federated_user_id);


--
-- Name: idx_fedidentity_user; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fedidentity_user ON public.federated_identity USING btree (user_id);


--
-- Name: idx_fu_attribute; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_attribute ON public.fed_user_attribute USING btree (user_id, realm_id, name);


--
-- Name: idx_fu_cnsnt_ext; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_cnsnt_ext ON public.fed_user_consent USING btree (user_id, client_storage_provider, external_client_id);


--
-- Name: idx_fu_consent; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_consent ON public.fed_user_consent USING btree (user_id, client_id);


--
-- Name: idx_fu_consent_ru; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_consent_ru ON public.fed_user_consent USING btree (realm_id, user_id);


--
-- Name: idx_fu_credential; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_credential ON public.fed_user_credential USING btree (user_id, type);


--
-- Name: idx_fu_credential_ru; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_credential_ru ON public.fed_user_credential USING btree (realm_id, user_id);


--
-- Name: idx_fu_group_membership; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_group_membership ON public.fed_user_group_membership USING btree (user_id, group_id);


--
-- Name: idx_fu_group_membership_ru; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_group_membership_ru ON public.fed_user_group_membership USING btree (realm_id, user_id);


--
-- Name: idx_fu_required_action; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_required_action ON public.fed_user_required_action USING btree (user_id, required_action);


--
-- Name: idx_fu_required_action_ru; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_required_action_ru ON public.fed_user_required_action USING btree (realm_id, user_id);


--
-- Name: idx_fu_role_mapping; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_role_mapping ON public.fed_user_role_mapping USING btree (user_id, role_id);


--
-- Name: idx_fu_role_mapping_ru; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_fu_role_mapping_ru ON public.fed_user_role_mapping USING btree (realm_id, user_id);


--
-- Name: idx_group_att_by_name_value; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_group_att_by_name_value ON public.group_attribute USING btree (name, ((value)::character varying(250)));


--
-- Name: idx_group_attr_group; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_group_attr_group ON public.group_attribute USING btree (group_id);


--
-- Name: idx_group_role_mapp_group; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_group_role_mapp_group ON public.group_role_mapping USING btree (group_id);


--
-- Name: idx_id_prov_mapp_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_id_prov_mapp_realm ON public.identity_provider_mapper USING btree (realm_id);


--
-- Name: idx_ident_prov_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_ident_prov_realm ON public.identity_provider USING btree (realm_id);


--
-- Name: idx_idp_for_login; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_idp_for_login ON public.identity_provider USING btree (realm_id, enabled, link_only, hide_on_login, organization_id);


--
-- Name: idx_idp_realm_org; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_idp_realm_org ON public.identity_provider USING btree (realm_id, organization_id);


--
-- Name: idx_inventory_items_save_file_id; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_inventory_items_save_file_id ON public.inventory_items USING btree (save_file_id);


--
-- Name: idx_keycloak_role_client; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_keycloak_role_client ON public.keycloak_role USING btree (client);


--
-- Name: idx_keycloak_role_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_keycloak_role_realm ON public.keycloak_role USING btree (realm);


--
-- Name: idx_offline_uss_by_broker_session_id; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_offline_uss_by_broker_session_id ON public.offline_user_session USING btree (broker_session_id, realm_id);


--
-- Name: idx_offline_uss_by_last_session_refresh; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_offline_uss_by_last_session_refresh ON public.offline_user_session USING btree (realm_id, offline_flag, last_session_refresh);


--
-- Name: idx_offline_uss_by_user; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_offline_uss_by_user ON public.offline_user_session USING btree (user_id, realm_id, offline_flag);


--
-- Name: idx_org_domain_org_id; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_org_domain_org_id ON public.org_domain USING btree (org_id);


--
-- Name: idx_perm_ticket_owner; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_perm_ticket_owner ON public.resource_server_perm_ticket USING btree (owner);


--
-- Name: idx_perm_ticket_requester; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_perm_ticket_requester ON public.resource_server_perm_ticket USING btree (requester);


--
-- Name: idx_protocol_mapper_client; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_protocol_mapper_client ON public.protocol_mapper USING btree (client_id);


--
-- Name: idx_realm_attr_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_realm_attr_realm ON public.realm_attribute USING btree (realm_id);


--
-- Name: idx_realm_clscope; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_realm_clscope ON public.client_scope USING btree (realm_id);


--
-- Name: idx_realm_def_grp_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_realm_def_grp_realm ON public.realm_default_groups USING btree (realm_id);


--
-- Name: idx_realm_evt_list_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_realm_evt_list_realm ON public.realm_events_listeners USING btree (realm_id);


--
-- Name: idx_realm_evt_types_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_realm_evt_types_realm ON public.realm_enabled_event_types USING btree (realm_id);


--
-- Name: idx_realm_master_adm_cli; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_realm_master_adm_cli ON public.realm USING btree (master_admin_client);


--
-- Name: idx_realm_supp_local_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_realm_supp_local_realm ON public.realm_supported_locales USING btree (realm_id);


--
-- Name: idx_redir_uri_client; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_redir_uri_client ON public.redirect_uris USING btree (client_id);


--
-- Name: idx_req_act_prov_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_req_act_prov_realm ON public.required_action_provider USING btree (realm_id);


--
-- Name: idx_res_policy_policy; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_res_policy_policy ON public.resource_policy USING btree (policy_id);


--
-- Name: idx_res_scope_scope; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_res_scope_scope ON public.resource_scope USING btree (scope_id);


--
-- Name: idx_res_serv_pol_res_serv; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_res_serv_pol_res_serv ON public.resource_server_policy USING btree (resource_server_id);


--
-- Name: idx_res_srv_res_res_srv; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_res_srv_res_res_srv ON public.resource_server_resource USING btree (resource_server_id);


--
-- Name: idx_res_srv_scope_res_srv; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_res_srv_scope_res_srv ON public.resource_server_scope USING btree (resource_server_id);


--
-- Name: idx_rev_token_on_expire; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_rev_token_on_expire ON public.revoked_token USING btree (expire);


--
-- Name: idx_role_attribute; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_role_attribute ON public.role_attribute USING btree (role_id);


--
-- Name: idx_role_clscope; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_role_clscope ON public.client_scope_role_mapping USING btree (role_id);


--
-- Name: idx_save_files_user_id; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_save_files_user_id ON public.save_files USING btree (user_id);


--
-- Name: idx_scope_mapping_role; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_scope_mapping_role ON public.scope_mapping USING btree (role_id);


--
-- Name: idx_scope_policy_policy; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_scope_policy_policy ON public.scope_policy USING btree (policy_id);


--
-- Name: idx_update_time; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_update_time ON public.migration_model USING btree (update_time);


--
-- Name: idx_usconsent_clscope; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_usconsent_clscope ON public.user_consent_client_scope USING btree (user_consent_id);


--
-- Name: idx_usconsent_scope_id; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_usconsent_scope_id ON public.user_consent_client_scope USING btree (scope_id);


--
-- Name: idx_user_attribute; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_attribute ON public.user_attribute USING btree (user_id);


--
-- Name: idx_user_attribute_name; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_attribute_name ON public.user_attribute USING btree (name, value);


--
-- Name: idx_user_challenges_user_id; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_challenges_user_id ON public.user_challenges USING btree (user_id);


--
-- Name: idx_user_consent; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_consent ON public.user_consent USING btree (user_id);


--
-- Name: idx_user_credential; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_credential ON public.credential USING btree (user_id);


--
-- Name: idx_user_death_records_created_at; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_death_records_created_at ON public.user_death_records USING btree (created_at DESC);


--
-- Name: idx_user_death_records_user_id_created_at; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_death_records_user_id_created_at ON public.user_death_records USING btree (user_id, created_at DESC);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_email ON public.user_entity USING btree (email);


--
-- Name: idx_user_group_mapping; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_group_mapping ON public.user_group_membership USING btree (user_id);


--
-- Name: idx_user_reqactions; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_reqactions ON public.user_required_action USING btree (user_id);


--
-- Name: idx_user_role_mapping; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_role_mapping ON public.user_role_mapping USING btree (user_id);


--
-- Name: idx_user_service_account; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_user_service_account ON public.user_entity USING btree (realm_id, service_account_client_link);


--
-- Name: idx_usr_fed_map_fed_prv; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_usr_fed_map_fed_prv ON public.user_federation_mapper USING btree (federation_provider_id);


--
-- Name: idx_usr_fed_map_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_usr_fed_map_realm ON public.user_federation_mapper USING btree (realm_id);


--
-- Name: idx_usr_fed_prv_realm; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_usr_fed_prv_realm ON public.user_federation_provider USING btree (realm_id);


--
-- Name: idx_web_orig_client; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX idx_web_orig_client ON public.web_origins USING btree (client_id);


--
-- Name: user_attr_long_values; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX user_attr_long_values ON public.user_attribute USING btree (long_value_hash, name);


--
-- Name: user_attr_long_values_lower_case; Type: INDEX; Schema: public; Owner: stg_app
--

CREATE INDEX user_attr_long_values_lower_case ON public.user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: identity_provider fk2b4ebc52ae5c3b34; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT fk2b4ebc52ae5c3b34 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_attributes fk3c47c64beacca966; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT fk3c47c64beacca966 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: federated_identity fk404288b92ef007a6; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT fk404288b92ef007a6 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_node_registrations fk4129723ba992f594; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT fk4129723ba992f594 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: redirect_uris fk_1burs8pb4ouj97h5wuppahv9f; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT fk_1burs8pb4ouj97h5wuppahv9f FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: user_federation_provider fk_1fj32f6ptolw2qy60cd8n01e8; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT fk_1fj32f6ptolw2qy60cd8n01e8 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_required_credential fk_5hg65lybevavkqfki3kponh9v; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT fk_5hg65lybevavkqfki3kponh9v FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_attribute fk_5hrm2vlf9ql5fu022kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu022kqepovbr FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: user_attribute fk_5hrm2vlf9ql5fu043kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu043kqepovbr FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: user_required_action fk_6qj3w1jw9cvafhe19bwsiuvmd; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT fk_6qj3w1jw9cvafhe19bwsiuvmd FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: keycloak_role fk_6vyqfe4cn4wlq8r6kt5vdsj5c; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT fk_6vyqfe4cn4wlq8r6kt5vdsj5c FOREIGN KEY (realm) REFERENCES public.realm(id);


--
-- Name: realm_smtp_config fk_70ej8xdxgxd0b9hh6180irr0o; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT fk_70ej8xdxgxd0b9hh6180irr0o FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_attribute fk_8shxd6l3e9atqukacxgpffptw; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT fk_8shxd6l3e9atqukacxgpffptw FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: composite_role fk_a63wvekftu8jo1pnj81e7mce2; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_a63wvekftu8jo1pnj81e7mce2 FOREIGN KEY (composite) REFERENCES public.keycloak_role(id);


--
-- Name: authentication_execution fk_auth_exec_flow; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_flow FOREIGN KEY (flow_id) REFERENCES public.authentication_flow(id);


--
-- Name: authentication_execution fk_auth_exec_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authentication_flow fk_auth_flow_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT fk_auth_flow_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authenticator_config fk_auth_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT fk_auth_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_role_mapping fk_c4fqv34p1mbylloxang7b1q3l; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT fk_c4fqv34p1mbylloxang7b1q3l FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_scope_attributes fk_cl_scope_attr_scope; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT fk_cl_scope_attr_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_scope_role_mapping fk_cl_scope_rm_scope; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT fk_cl_scope_rm_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: protocol_mapper fk_cli_scope_mapper; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_cli_scope_mapper FOREIGN KEY (client_scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_initial_access fk_client_init_acc_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT fk_client_init_acc_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: component_config fk_component_config; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT fk_component_config FOREIGN KEY (component_id) REFERENCES public.component(id);


--
-- Name: component fk_component_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT fk_component_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_default_groups fk_def_groups_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT fk_def_groups_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_mapper_config fk_fedmapper_cfg; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT fk_fedmapper_cfg FOREIGN KEY (user_federation_mapper_id) REFERENCES public.user_federation_mapper(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_fedprv; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_fedprv FOREIGN KEY (federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: associated_policy fk_frsr5s213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsr5s213xcx4wnkog82ssrfy FOREIGN KEY (associated_policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrasp13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrasp13xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog82sspmt; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82sspmt FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_resource fk_frsrho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog83sspmt; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog83sspmt FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog84sspmt; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog84sspmt FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: associated_policy fk_frsrpas14xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsrpas14xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrpass3xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrpass3xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_perm_ticket fk_frsrpo2128cx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrpo2128cx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_policy fk_frsrpo213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT fk_frsrpo213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_scope fk_frsrpos13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrpos13xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpos53xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpos53xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpp213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpp213xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_scope fk_frsrps213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrps213xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_scope fk_frsrso213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT fk_frsrso213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: composite_role fk_gr7thllb9lu8q4vqa4524jjy8; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_gr7thllb9lu8q4vqa4524jjy8 FOREIGN KEY (child_role) REFERENCES public.keycloak_role(id);


--
-- Name: user_consent_client_scope fk_grntcsnt_clsc_usc; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT fk_grntcsnt_clsc_usc FOREIGN KEY (user_consent_id) REFERENCES public.user_consent(id);


--
-- Name: user_consent fk_grntcsnt_user; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT fk_grntcsnt_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: group_attribute fk_group_attribute_group; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT fk_group_attribute_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: group_role_mapping fk_group_role_group; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT fk_group_role_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: realm_enabled_event_types fk_h846o4h0w8epx5nwedrf5y69j; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT fk_h846o4h0w8epx5nwedrf5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_events_listeners fk_h846o4h0w8epx5nxev9f5y69j; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT fk_h846o4h0w8epx5nxev9f5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: identity_provider_mapper fk_idpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT fk_idpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: idp_mapper_config fk_idpmconfig; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT fk_idpmconfig FOREIGN KEY (idp_mapper_id) REFERENCES public.identity_provider_mapper(id);


--
-- Name: web_origins fk_lojpho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT fk_lojpho213xcx4wnkog82ssrfy FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: scope_mapping fk_ouse064plmlr732lxjcn1q5f1; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT fk_ouse064plmlr732lxjcn1q5f1 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: protocol_mapper fk_pcm_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_pcm_realm FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: credential fk_pfyr0glasqyl0dei3kl69r6v0; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT fk_pfyr0glasqyl0dei3kl69r6v0 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: protocol_mapper_config fk_pmconfig; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT fk_pmconfig FOREIGN KEY (protocol_mapper_id) REFERENCES public.protocol_mapper(id);


--
-- Name: default_client_scope fk_r_def_cli_scope_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT fk_r_def_cli_scope_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: required_action_provider fk_req_act_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT fk_req_act_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_uris fk_resource_server_uris; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT fk_resource_server_uris FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: role_attribute fk_role_attribute_id; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT fk_role_attribute_id FOREIGN KEY (role_id) REFERENCES public.keycloak_role(id);


--
-- Name: realm_supported_locales fk_supported_locales_realm; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT fk_supported_locales_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_config fk_t13hpu1j94r2ebpekr39x5eu5; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT fk_t13hpu1j94r2ebpekr39x5eu5 FOREIGN KEY (user_federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_group_membership fk_user_group_user; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT fk_user_group_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: policy_config fkdc34197cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT fkdc34197cf864c4e43 FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: identity_provider_config fkdc4897cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT fkdc4897cf864c4e43 FOREIGN KEY (identity_provider_id) REFERENCES public.identity_provider(internal_id);


--
-- Name: inventory_items inventory_items_save_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_save_file_id_fkey FOREIGN KEY (save_file_id) REFERENCES public.save_files(id) ON DELETE CASCADE;


--
-- Name: save_files save_files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.save_files
    ADD CONSTRAINT save_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_challenges user_challenges_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT user_challenges_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id);


--
-- Name: user_challenges user_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT user_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_death_records user_death_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stg_app
--

ALTER TABLE ONLY public.user_death_records
    ADD CONSTRAINT user_death_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict rIjsSiU2EIomVnQgcPggcAAfPwqd8a5eQvBTY5mr3StBtWmPKcJGNqV3TO2SMBg

