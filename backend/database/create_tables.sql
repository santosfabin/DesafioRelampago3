CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    importance SMALLINT NOT NULL CHECK (importance BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    asset_id UUID NOT NULL REFERENCES asset(id) ON DELETE CASCADE,

    service TEXT NOT NULL,  -- O que foi feito
    description TEXT,       -- Descrição opcional
    performed_at DATE,      -- Data da atualização do serviço

    -- Previsão por data
    next_due_date DATE, 

    -- Previsão por uso
    next_due_usage_limit INTEGER,   
    next_due_usage_current INTEGER,
    usage_unit TEXT CHECK (usage_unit IN ('km', 'horas', 'ciclos')),

    -- Status da manutenção prevista
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (
        status IN ('ativa', 'realizada', 'adiada', 'cancelada')
    ),

    created_at TIMESTAMP DEFAULT NOW(),

    -- Regra: ou previsão por data, ou por uso, ou nenhuma. Nunca as duas.
    CHECK (
        (next_due_date IS NOT NULL AND next_due_usage_limit IS NULL AND next_due_usage_current IS NULL AND usage_unit IS NULL)
        OR
        (next_due_date IS NULL AND next_due_usage_limit IS NOT NULL AND next_due_usage_current IS NOT NULL AND usage_unit IS NOT NULL)
        OR
        (next_due_date IS NULL AND next_due_usage_limit IS NULL AND next_due_usage_current IS NULL AND usage_unit IS NULL)
    )
);