-- CodiPalette v2 — Supabase PostgreSQL Schema
-- Supabase SQL Editor에서 실행

-- 1. users 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free' | 'premium'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. saved_combos 테이블
CREATE TABLE IF NOT EXISTS saved_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT '저장된 코디',
  outer_color VARCHAR(20) NOT NULL,
  top_color VARCHAR(20) NOT NULL,
  bottom_color VARCHAR(20) NOT NULL,
  shoes_color VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_saved_combos_user_id ON saved_combos(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. purchases 테이블 (결제 이력)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  payment_key VARCHAR(300) NOT NULL,
  amount INTEGER NOT NULL,
  order_name VARCHAR(200) NOT NULL DEFAULT 'CodiPalette 구독',
  status VARCHAR(30) NOT NULL DEFAULT 'DONE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);

-- 6. 테스트용 premium 유저 수동 업그레이드 쿼리
-- UPDATE users SET subscription_status = 'premium' WHERE email = 'your@email.com';
