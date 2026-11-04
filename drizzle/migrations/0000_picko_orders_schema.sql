CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL CHECK (char_length(code) BETWEEN 1 AND 20 AND code ~ '^(?=.*[0-9])(?!-)(?!.*--)(?!.*-$)[A-Za-z0-9-]{1,20}$'),
  customer_name text NOT NULL DEFAULT '' CHECK (char_length(customer_name) <= 120),
  status text NOT NULL CHECK (status IN ('pending','preparing','ready','completed','picked_up','cancelled')),
  qr_status text NOT NULL CHECK (qr_status IN ('missing','waiting','issued')),
  notification_status text NOT NULL CHECK (notification_status IN ('none','demo')),
  note text CHECK (note IS NULL OR char_length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ready_at timestamptz
);
CREATE UNIQUE INDEX orders_active_code_key ON public.orders (lower(code)) WHERE status IN ('pending','preparing','ready');
CREATE INDEX orders_created_idx ON public.orders (created_at, id);
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  quantity int NOT NULL CHECK (quantity > 0),
  note text CHECK (note IS NULL OR char_length(note) <= 300),
  sort_order int NOT NULL DEFAULT 0 CHECK (sort_order >= 0)
);
CREATE INDEX order_items_order_idx ON public.order_items (order_id, sort_order, id);
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tracking_tokens (
  token text PRIMARY KEY CHECK (token ~ '^[A-Za-z0-9_-]{43}$'),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tracking_tokens TO service_role;
ALTER TABLE public.tracking_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE CHECK (char_length(endpoint) BETWEEN 1 AND 2048),
  p256dh text NOT NULL CHECK (char_length(p256dh) BETWEEN 1 AND 255),
  auth text NOT NULL CHECK (char_length(auth) BETWEEN 1 AND 255),
  order_id uuid REFERENCES public.orders(id),
  expiration_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.daily_board_hides (
  order_id uuid NOT NULL REFERENCES public.orders(id),
  hidden_on date NOT NULL,
  PRIMARY KEY (order_id, hidden_on)
);
GRANT ALL ON public.daily_board_hides TO service_role;
ALTER TABLE public.daily_board_hides ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.place_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id),
  stars smallint,
  note text CHECK (note IS NULL OR char_length(note) <= 500),
  skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((skipped AND stars IS NULL AND note IS NULL) OR (NOT skipped AND stars BETWEEN 1 AND 5))
);
CREATE INDEX place_ratings_created_idx ON public.place_ratings (created_at DESC);
GRANT ALL ON public.place_ratings TO service_role;
ALTER TABLE public.place_ratings ENABLE ROW LEVEL SECURITY;

-- Atomic writes, same rules as the original server.
CREATE OR REPLACE FUNCTION public.picko_create_order(p_code text, p_token text)
RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO orders (id, code, customer_name, status, qr_status, notification_status)
  VALUES (v_id, p_code, '', 'ready', 'issued', 'none');
  INSERT INTO tracking_tokens (token, order_id) VALUES (p_token, v_id);
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.picko_complete_order(p_id uuid)
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_prev text;
BEGIN
  SELECT status INTO v_prev FROM orders WHERE id = p_id AND status <> 'completed' FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE orders SET status = 'completed', ready_at = now(), updated_at = now() WHERE id = p_id;
  RETURN v_prev;
END $$;

CREATE OR REPLACE FUNCTION public.picko_reopen_order(p_id uuid, p_window_ms int)
RETURNS boolean LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE orders SET status = 'ready', ready_at = NULL, updated_at = now()
  WHERE id = p_id AND status = 'completed'
    AND updated_at > now() - make_interval(secs => p_window_ms / 1000.0);
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.picko_pickup_order(p_id uuid, p_window_ms int)
RETURNS boolean LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE orders SET status = 'picked_up', updated_at = now()
  WHERE id = p_id AND status = 'completed'
    AND updated_at <= now() - make_interval(secs => p_window_ms / 1000.0);
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.picko_day_bounds(p_day date, OUT day_start timestamptz, OUT day_end timestamptz)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT (p_day::timestamp AT TIME ZONE 'Africa/Cairo'), ((p_day + 1)::timestamp AT TIME ZONE 'Africa/Cairo')
$$;

CREATE OR REPLACE FUNCTION public.picko_today() RETURNS date
LANGUAGE sql STABLE AS $$ SELECT (now() AT TIME ZONE 'Africa/Cairo')::date $$;

CREATE OR REPLACE FUNCTION public.picko_daily_board()
RETURNS TABLE (id uuid, code text, token text) LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT o.id, o.code, t.token
  FROM orders o JOIN tracking_tokens t ON t.order_id = o.id,
       picko_day_bounds(picko_today()) b
  WHERE o.created_at >= b.day_start AND o.created_at < b.day_end
    AND NOT EXISTS (SELECT 1 FROM daily_board_hides h WHERE h.order_id = o.id AND h.hidden_on = picko_today())
  ORDER BY o.created_at, o.id
$$;

CREATE OR REPLACE FUNCTION public.picko_clear_daily_board()
RETURNS int LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n int;
BEGIN
  INSERT INTO daily_board_hides (order_id, hidden_on)
  SELECT d.id, picko_today() FROM picko_daily_board() d
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.picko_archive(p_code text, p_from date, p_to date)
RETURNS TABLE (id uuid, code text, status text, created_at timestamptz, updated_at timestamptz, ready_at timestamptz)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT o.id, o.code, o.status, o.created_at, o.updated_at, o.ready_at
  FROM orders o
  WHERE (p_code IS NULL OR o.code ILIKE '%' || replace(replace(replace(p_code, '\', '\\'), '%', '\%'), '_', '\_') || '%')
    AND (p_from IS NULL OR o.created_at >= (SELECT day_start FROM picko_day_bounds(p_from)))
    AND (p_to IS NULL OR o.created_at < (SELECT day_end FROM picko_day_bounds(p_to)))
  ORDER BY o.created_at DESC, o.id DESC
  LIMIT 200
$$;

CREATE OR REPLACE FUNCTION public.picko_rating_summary(OUT rating_count int, OUT average_stars float8)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT count(*)::int, avg(stars)::float8 FROM place_ratings WHERE NOT skipped
$$;

DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY[
    'picko_create_order(text,text)','picko_complete_order(uuid)','picko_reopen_order(uuid,int)',
    'picko_pickup_order(uuid,int)','picko_day_bounds(date)','picko_today()','picko_daily_board()',
    'picko_clear_daily_board()','picko_archive(text,date,date)','picko_rating_summary()']
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
  END LOOP;
END $$;