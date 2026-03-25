
-- 1) Publisher wallets table
CREATE TABLE public.publisher_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance numeric NOT NULL DEFAULT 0,
  pending_balance numeric NOT NULL DEFAULT 0,
  withdrawn_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.publisher_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publishers can view own wallet" ON public.publisher_wallets
  FOR SELECT TO authenticated USING (publisher_id = auth.uid());

CREATE POLICY "Admins can view all wallets" ON public.publisher_wallets
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "System can insert wallets" ON public.publisher_wallets
  FOR INSERT TO authenticated WITH CHECK (publisher_id = auth.uid());

CREATE POLICY "Admins can update wallets" ON public.publisher_wallets
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_publisher_wallets_updated_at
  BEFORE UPDATE ON public.publisher_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2) Wallet transactions (immutable ledger)
CREATE TYPE public.wallet_tx_type AS ENUM (
  'escrow_hold', 'escrow_release', 'commission_deduct',
  'refund_buyer', 'refund_publisher', 'payout_debit', 'payout_reversal'
);

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.publisher_wallets(id),
  order_id uuid REFERENCES public.orders(id),
  transaction_id uuid REFERENCES public.transactions(id),
  payout_id uuid REFERENCES public.payouts(id),
  type public.wallet_tx_type NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publishers view own wallet txns" ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.publisher_wallets pw
    WHERE pw.id = wallet_transactions.wallet_id AND pw.publisher_id = auth.uid()
  ));

CREATE POLICY "Admins view all wallet txns" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- No INSERT/UPDATE/DELETE from client - only via edge functions with service role

-- 3) Add enhanced transaction status
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'disputed';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'failed';

-- 4) Enhanced payout statuses 
ALTER TYPE public.payout_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.payout_status ADD VALUE IF NOT EXISTS 'failed';
ALTER TYPE public.payout_status ADD VALUE IF NOT EXISTS 'paid';

-- 5) Add refund tracking to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS refund_reason text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- 6) Add dispute resolution type
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS resolution_type text; -- 'refund_buyer' or 'release_publisher'

-- 7) Add auto_approve_at for escrow timeout
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS auto_approve_at timestamptz;

-- 8) Enable realtime for wallet tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.publisher_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- 9) DB function to create/get wallet for publisher
CREATE OR REPLACE FUNCTION public.ensure_publisher_wallet(_publisher_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _wallet_id uuid;
BEGIN
  SELECT id INTO _wallet_id FROM publisher_wallets WHERE publisher_id = _publisher_id;
  IF _wallet_id IS NULL THEN
    INSERT INTO publisher_wallets (publisher_id) VALUES (_publisher_id) RETURNING id INTO _wallet_id;
  END IF;
  RETURN _wallet_id;
END;
$$;

-- 10) DB function to release escrow (atomic wallet update + ledger entry)
CREATE OR REPLACE FUNCTION public.release_escrow(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tx RECORD;
  _wallet_id uuid;
  _new_balance numeric;
BEGIN
  -- Get the escrow transaction
  SELECT * INTO _tx FROM transactions WHERE order_id = _order_id AND status = 'escrow' FOR UPDATE;
  IF _tx IS NULL THEN
    RAISE EXCEPTION 'No escrow transaction found for order %', _order_id;
  END IF;

  -- Update transaction to released
  UPDATE transactions SET status = 'released', updated_at = now() WHERE id = _tx.id;

  -- Get or create publisher wallet
  _wallet_id := ensure_publisher_wallet(_tx.publisher_id);

  -- Update wallet balances atomically
  UPDATE publisher_wallets
  SET pending_balance = pending_balance - _tx.publisher_amount,
      available_balance = available_balance + _tx.publisher_amount,
      updated_at = now()
  WHERE id = _wallet_id;

  -- Get new balance
  SELECT available_balance INTO _new_balance FROM publisher_wallets WHERE id = _wallet_id;

  -- Create ledger entry
  INSERT INTO wallet_transactions (wallet_id, order_id, transaction_id, type, amount, balance_after, description)
  VALUES (_wallet_id, _order_id, _tx.id, 'escrow_release', _tx.publisher_amount, _new_balance,
    'Escrow released for order ' || _order_id);

  -- Create commission ledger entry
  INSERT INTO wallet_transactions (wallet_id, order_id, transaction_id, type, amount, balance_after, description)
  VALUES (_wallet_id, _order_id, _tx.id, 'commission_deduct', -_tx.commission_amount, _new_balance,
    'Platform commission (15%) for order ' || _order_id);

  -- Update order
  UPDATE orders SET status = 'completed', completed_at = now(), updated_at = now() WHERE id = _order_id;
END;
$$;

-- 11) DB function to refund buyer (atomic)
CREATE OR REPLACE FUNCTION public.refund_escrow(_order_id uuid, _reason text DEFAULT 'Dispute resolved - refund')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tx RECORD;
  _wallet_id uuid;
BEGIN
  SELECT * INTO _tx FROM transactions WHERE order_id = _order_id AND status IN ('escrow', 'disputed') FOR UPDATE;
  IF _tx IS NULL THEN
    RAISE EXCEPTION 'No escrowed/disputed transaction found for order %', _order_id;
  END IF;

  -- Update transaction
  UPDATE transactions SET status = 'refunded', refund_reason = _reason, refunded_at = now(), updated_at = now()
  WHERE id = _tx.id;

  -- Remove pending balance from publisher wallet if exists
  _wallet_id := ensure_publisher_wallet(_tx.publisher_id);
  UPDATE publisher_wallets
  SET pending_balance = GREATEST(pending_balance - _tx.publisher_amount, 0), updated_at = now()
  WHERE id = _wallet_id;

  -- Ledger entry
  INSERT INTO wallet_transactions (wallet_id, order_id, transaction_id, type, amount, balance_after, description)
  VALUES (_wallet_id, _order_id, _tx.id, 'refund_buyer', -_tx.publisher_amount,
    (SELECT available_balance FROM publisher_wallets WHERE id = _wallet_id),
    'Refund to buyer: ' || _reason);

  -- Update order
  UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = _order_id;
END;
$$;

-- 12) DB function for payout debit
CREATE OR REPLACE FUNCTION public.process_payout_debit(_payout_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _payout RECORD;
  _wallet_id uuid;
  _new_balance numeric;
BEGIN
  SELECT * INTO _payout FROM payouts WHERE id = _payout_id AND status = 'approved' FOR UPDATE;
  IF _payout IS NULL THEN
    RAISE EXCEPTION 'No approved payout found with id %', _payout_id;
  END IF;

  _wallet_id := ensure_publisher_wallet(_payout.publisher_id);

  -- Check sufficient balance
  IF (SELECT available_balance FROM publisher_wallets WHERE id = _wallet_id) < _payout.amount THEN
    RAISE EXCEPTION 'Insufficient available balance for payout';
  END IF;

  -- Debit wallet
  UPDATE publisher_wallets
  SET available_balance = available_balance - _payout.amount,
      withdrawn_balance = withdrawn_balance + _payout.amount,
      updated_at = now()
  WHERE id = _wallet_id;

  SELECT available_balance INTO _new_balance FROM publisher_wallets WHERE id = _wallet_id;

  -- Update payout
  UPDATE payouts SET status = 'paid', processed_at = now(), updated_at = now() WHERE id = _payout_id;

  -- Ledger entry
  INSERT INTO wallet_transactions (wallet_id, payout_id, type, amount, balance_after, description)
  VALUES (_wallet_id, _payout_id, 'payout_debit', -_payout.amount, _new_balance,
    'Payout processed: $' || _payout.amount);
END;
$$;

-- 13) Function for escrow hold on order creation
CREATE OR REPLACE FUNCTION public.create_escrow(_order_id uuid, _buyer_id uuid, _publisher_id uuid, _amount numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _commission numeric;
  _publisher_amount numeric;
  _tx_id uuid;
  _wallet_id uuid;
BEGIN
  _commission := ROUND(_amount * 0.15, 2);
  _publisher_amount := _amount - _commission;

  INSERT INTO transactions (order_id, buyer_id, publisher_id, amount, commission_rate, commission_amount, publisher_amount, status)
  VALUES (_order_id, _buyer_id, _publisher_id, _amount, 0.15, _commission, _publisher_amount, 'escrow')
  RETURNING id INTO _tx_id;

  -- Add to publisher pending balance
  _wallet_id := ensure_publisher_wallet(_publisher_id);
  UPDATE publisher_wallets
  SET pending_balance = pending_balance + _publisher_amount, updated_at = now()
  WHERE id = _wallet_id;

  -- Ledger entry
  INSERT INTO wallet_transactions (wallet_id, order_id, transaction_id, type, amount, balance_after, description)
  VALUES (_wallet_id, _order_id, _tx_id, 'escrow_hold', _publisher_amount,
    (SELECT available_balance FROM publisher_wallets WHERE id = _wallet_id),
    'Payment held in escrow for order ' || _order_id);

  RETURN _tx_id;
END;
$$;

-- 14) Function for dispute hold
CREATE OR REPLACE FUNCTION public.dispute_escrow(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE transactions SET status = 'disputed', updated_at = now()
  WHERE order_id = _order_id AND status = 'escrow';
  
  UPDATE orders SET status = 'disputed', updated_at = now() WHERE id = _order_id;
END;
$$;
