-- Migration: increase topico.nome length to 500
ALTER TABLE topico ALTER COLUMN nome TYPE varchar(500);
