CREATE TABLE IF NOT EXISTS ai_explanations (
    id           BIGSERIAL PRIMARY KEY,
    event_type   VARCHAR(50)  NOT NULL,
    event_id     VARCHAR(100) NOT NULL,
    prompt_hash  VARCHAR(64)  NOT NULL,
    explanation_text TEXT     NOT NULL,
    tokens_used  INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_explanations_event ON ai_explanations (event_type, event_id);
