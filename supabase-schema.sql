-- ========================================================================================
-- WA-ZAKKER SUPABASE SCHEMA
-- ========================================================================================

-- 1. Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================================================
-- TABLES
-- ========================================================================================

DROP TABLE IF EXISTS public.stats CASCADE;
DROP TABLE IF EXISTS public.social_links CASCADE;
DROP TABLE IF EXISTS public.dhikr_cards CASCADE;

-- --------------------------------------------------------
-- Table: stats
-- Stores the global statistics shown on the landing page
-- --------------------------------------------------------
CREATE TABLE public.stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL, -- e.g., 'dhikr_count', 'downloads'
    label TEXT NOT NULL,      -- e.g., 'عدد الأذكار'
    value TEXT NOT NULL,      -- e.g., '11+'
    icon TEXT NOT NULL,       -- e.g., 'CreditCard2Front'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- Table: social_links
-- Stores the social media links shown in the footer
-- --------------------------------------------------------
CREATE TABLE public.social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT UNIQUE NOT NULL, -- e.g., 'instagram', 'x'
    url TEXT NOT NULL,             -- e.g., 'https://instagram.com/...'
    handle TEXT NOT NULL,          -- e.g., '@AALMABKHOUT'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- Table: dhikr_cards
-- Stores the Apple Wallet cards metadata and storage references
-- --------------------------------------------------------
CREATE TABLE public.dhikr_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,           -- e.g., 'أذكار الصباح'
    category TEXT NOT NULL,        -- e.g., 'صباح'
    dhikr TEXT NOT NULL,           -- e.g., 'سبحان الله وبحمده'
    icon TEXT NOT NULL,            -- e.g., 'SunFill'
    color TEXT NOT NULL,           -- e.g., '#11538C'
    pkpass_url TEXT,               -- URL/Path to the generated .pkpass file in Supabase Storage
    sort_order INTEGER DEFAULT 0,  -- For manual reordering if needed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================================
-- TRIGGERS (Auto-update updated_at)
-- ========================================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stats_updated_at
    BEFORE UPDATE ON public.stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_links_updated_at
    BEFORE UPDATE ON public.social_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dhikr_cards_updated_at
    BEFORE UPDATE ON public.dhikr_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================================================

-- Enable RLS on all tables
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dhikr_cards ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- Policies: stats
-- --------------------------------------------------------
-- Anyone can read stats (for the public landing page)
CREATE POLICY "Allow public read access on stats" 
    ON public.stats FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Allow authenticated full access on stats" 
    ON public.stats FOR ALL USING (auth.role() = 'authenticated');

-- --------------------------------------------------------
-- Policies: social_links
-- --------------------------------------------------------
-- Anyone can read social links
CREATE POLICY "Allow public read access on social_links" 
    ON public.social_links FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Allow authenticated full access on social_links" 
    ON public.social_links FOR ALL USING (auth.role() = 'authenticated');

-- --------------------------------------------------------
-- Policies: dhikr_cards
-- --------------------------------------------------------
-- Anyone can read dhikr cards
CREATE POLICY "Allow public read access on dhikr_cards" 
    ON public.dhikr_cards FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Allow authenticated full access on dhikr_cards" 
    ON public.dhikr_cards FOR ALL USING (auth.role() = 'authenticated');

-- ========================================================================================
-- STORAGE BUCKET (For .pkpass files)
-- ========================================================================================

-- Create a public bucket for the wallet passes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wallet-passes', 'wallet-passes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Allow public read access on wallet-passes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated full access on wallet-passes" ON storage.objects;

-- Anyone can download the passes
CREATE POLICY "Allow public read access on wallet-passes"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'wallet-passes');

-- Only authenticated users can upload/update/delete passes
CREATE POLICY "Allow authenticated full access on wallet-passes"
    ON storage.objects FOR ALL
    USING (bucket_id = 'wallet-passes' AND auth.role() = 'authenticated');

-- ========================================================================================
-- INITIAL SEED DATA
-- ========================================================================================

INSERT INTO public.stats (key, label, value, icon) VALUES
    ('dhikr_count', 'عدد الأذكار', '11+', 'CreditCard2Front'),
    ('downloads', 'عدد التحميلات', '200+', 'FileArrowDown')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.social_links (platform, url, handle) VALUES
    ('instagram', 'https://instagram.com/placeholder', '@AALMABKHOUT'),
    ('x', 'https://x.com/placeholder', '@AALMABKHOUT')
ON CONFLICT (platform) DO NOTHING;

INSERT INTO public.dhikr_cards (title, category, dhikr, icon, color, sort_order) VALUES
    ('أذكار الصباح', 'صباح', 'سبحان الله وبحمده', 'SunFill', '#11538C', 1),
    ('أذكار المساء', 'مساء', 'اللهم بك أمسينا', 'MoonStarsFill', '#398CBF', 2),
    ('أذكار النوم', 'نوم', 'باسمك ربي وضعت جنبي', 'StarFill', '#11538C', 3),
    ('أذكار الصلاة', 'صلاة', 'أستغفر الله', 'HandIndexThumbFill', '#398CBF', 4),
    ('أذكار القرآن', 'قرآن', 'اللهم ارحمني بالقرآن', 'BookFill', '#11538C', 5),
    ('أدعية مختارة', 'دعاء', 'اللهم آتنا في الدنيا حسنة', 'HeartFill', '#398CBF', 6);

-- --------------------------------------------------------
-- Table: card_downloads
-- Tracks each time a card is downloaded/added to wallet
-- --------------------------------------------------------
CREATE TABLE public.card_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES public.dhikr_cards(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.card_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert access on card_downloads" 
    ON public.card_downloads FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read access on card_downloads" 
    ON public.card_downloads FOR SELECT USING (auth.role() = 'authenticated');
