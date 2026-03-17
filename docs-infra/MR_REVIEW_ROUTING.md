# MR Review Routing

## Document Paths
- Frontend review rules: `FrontEnd/ssafy-maker/docs/infra/REVIEW_RULES.md`
- Frontend structure map: `FrontEnd/ssafy-maker/docs/infra/STRUCTURE_MAP.md`
- Backend review rules: `BackEnd/docs/infra/REVIEW_RULES.md`
- Backend structure map: `BackEnd/docs/infra/STRUCTURE_MAP.md`

## Frontend Routing
- `FrontEnd/ssafy-maker/src/scenes/**`
    - Use: `FrontEnd/ssafy-maker/docs/infra/REVIEW_RULES.md`
    - Use: `FrontEnd/ssafy-maker/docs/infra/STRUCTURE_MAP.md`
    - Anchor: `FrontEnd/ssafy-maker/src/app/registry/scenes.ts`
    - Focus: scene lifecycle, registry consistency, listener cleanup

- `FrontEnd/ssafy-maker/src/app/**`
    - Use: `FrontEnd/ssafy-maker/docs/infra/REVIEW_RULES.md`
    - Use: `FrontEnd/ssafy-maker/docs/infra/STRUCTURE_MAP.md`
    - Anchor: `FrontEnd/ssafy-maker/src/app/registry/scenes.ts`
    - Focus: bootstrap, global registration, scene wiring

- `FrontEnd/ssafy-maker/src/infra/**`
    - Use: `FrontEnd/ssafy-maker/docs/infra/REVIEW_RULES.md`
    - Use: `FrontEnd/ssafy-maker/docs/infra/STRUCTURE_MAP.md`
    - Focus: external API access, error handling, null safety

- `FrontEnd/ssafy-maker/src/core/**`
    - Use: `FrontEnd/ssafy-maker/docs/infra/REVIEW_RULES.md`
    - Use: `FrontEnd/ssafy-maker/docs/infra/STRUCTURE_MAP.md`
    - Focus: global events, shared state, dependency spread

- `FrontEnd/ssafy-maker/src/features/**`
    - Use: `FrontEnd/ssafy-maker/docs/infra/REVIEW_RULES.md`
    - Use: `FrontEnd/ssafy-maker/docs/infra/STRUCTURE_MAP.md`
    - Focus: feature boundaries, core and infra usage, stale state risk

## Backend Routing
- `BackEnd/src/main/java/**/controller/**`
    - Use: `BackEnd/docs/infra/REVIEW_RULES.md`
    - Use: `BackEnd/docs/infra/STRUCTURE_MAP.md`
    - Anchor: corresponding service
    - Focus: validation, request boundary, auth trust checks

- `BackEnd/src/main/java/**/service/**`
    - Use: `BackEnd/docs/infra/REVIEW_RULES.md`
    - Use: `BackEnd/docs/infra/STRUCTURE_MAP.md`
    - Focus: business logic, null safety, transaction boundary

- `BackEnd/src/main/java/**/repository/**`
    - Use: `BackEnd/docs/infra/REVIEW_RULES.md`
    - Use: `BackEnd/docs/infra/STRUCTURE_MAP.md`
    - Focus: query efficiency, persistence contract, N+1 risk

- `BackEnd/src/main/java/**/dto/**`
    - Use: `BackEnd/docs/infra/REVIEW_RULES.md`
    - Use: `BackEnd/docs/infra/STRUCTURE_MAP.md`
    - Focus: request and response contract consistency, nullability

- `BackEnd/src/main/java/**/config/**`
    - Use: `BackEnd/docs/infra/REVIEW_RULES.md`
    - Use: `BackEnd/docs/infra/STRUCTURE_MAP.md`
    - Escalate: large model preferred
    - Focus: global config impact, backward compatibility

- `BackEnd/src/main/java/**/security/**`
    - Use: `BackEnd/docs/infra/REVIEW_RULES.md`
    - Use: `BackEnd/docs/infra/STRUCTURE_MAP.md`
    - Escalate: large model preferred
    - Focus: auth boundary, filter chain, trust model

## Cross-Layer Routing
- Frontend and Backend paths changed together
    - Use: both frontend and backend docs
    - Escalate: large model preferred
    - Focus: API contract drift, response field mismatch, auth flow mismatch

## Large Model Triggers
- cross-layer changes
- auth, security, jwt, keycloak
- config, jackson, object mapper
- registry or global event flow changes
- controller, service, dto changed together
- changes requiring extra anchor files to understand structure

## Minimal Context Policy
- Do not send full README files
- Prefer changed hunk plus selected rules
- Add symbol context only when needed
- Add anchor files only for high-risk or ambiguous changes