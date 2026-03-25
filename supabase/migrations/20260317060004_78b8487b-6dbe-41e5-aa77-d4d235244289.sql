
-- =============================================
-- LINKFORGE: COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'publisher', 'buyer');

-- 2. User roles table (separate from profiles per security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  company_name TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Website status enum
CREATE TYPE public.website_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- 5. Websites table
CREATE TABLE public.websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  url TEXT NOT NULL,
  niche TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  da INTEGER DEFAULT 0,
  dr INTEGER DEFAULT 0,
  traffic TEXT DEFAULT '0',
  turnaround_days INTEGER DEFAULT 7,
  country TEXT DEFAULT 'US',
  content_guidelines TEXT,
  status public.website_status NOT NULL DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT false,
  total_orders INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_websites_publisher ON public.websites(publisher_id);
CREATE INDEX idx_websites_status ON public.websites(status);
CREATE INDEX idx_websites_niche ON public.websites(niche);
CREATE INDEX idx_websites_da ON public.websites(da);
CREATE INDEX idx_websites_price ON public.websites(price);

-- 6. Order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'in_progress', 'delivered', 'revision', 'completed', 'cancelled', 'disputed');

-- 7. Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
  website_id UUID REFERENCES public.websites(id) NOT NULL,
  publisher_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_url TEXT,
  anchor_text TEXT,
  article_content TEXT,
  proof_url TEXT,
  price NUMERIC(10,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_publisher ON public.orders(publisher_id);
CREATE INDEX idx_orders_website ON public.orders(website_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- 8. Transaction status enum
CREATE TYPE public.transaction_status AS ENUM ('pending', 'escrow', 'released', 'refunded');

-- 9. Transactions table (escrow + commission tracking)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
  publisher_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  publisher_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.15,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transactions_order ON public.transactions(order_id);
CREATE INDEX idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX idx_transactions_publisher ON public.transactions(publisher_id);

-- 10. Payout status enum
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'rejected');

-- 11. Payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payouts_publisher ON public.payouts(publisher_id);

-- 12. Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_order ON public.messages(order_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);

-- 13. Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) NOT NULL UNIQUE,
  website_id UUID REFERENCES public.websites(id) NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) NOT NULL,
  publisher_id UUID REFERENCES public.profiles(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reviews_website ON public.reviews(website_id);
CREATE INDEX idx_reviews_publisher ON public.reviews(publisher_id);

-- 14. Notification type enum
CREATE TYPE public.notification_type AS ENUM ('order', 'message', 'payment', 'review', 'system', 'dispute');

-- 15. Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);

-- 16. Disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) NOT NULL UNIQUE,
  initiated_by UUID REFERENCES public.profiles(id) NOT NULL,
  reason TEXT NOT NULL,
  resolution TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_disputes_order ON public.disputes(order_id);

-- =============================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- user_roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- profiles policies
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- websites policies
CREATE POLICY "Anyone can view approved websites" ON public.websites FOR SELECT USING (status = 'approved');
CREATE POLICY "Publishers can view own websites" ON public.websites FOR SELECT TO authenticated USING (publisher_id = auth.uid());
CREATE POLICY "Admins can view all websites" ON public.websites FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Publishers can insert websites" ON public.websites FOR INSERT TO authenticated WITH CHECK (publisher_id = auth.uid() AND public.has_role(auth.uid(), 'publisher'));
CREATE POLICY "Publishers can update own websites" ON public.websites FOR UPDATE TO authenticated USING (publisher_id = auth.uid());
CREATE POLICY "Admins can update any website" ON public.websites FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Publishers can delete own websites" ON public.websites FOR DELETE TO authenticated USING (publisher_id = auth.uid());
CREATE POLICY "Admins can delete any website" ON public.websites FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- orders policies
CREATE POLICY "Buyers can view own orders" ON public.orders FOR SELECT TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "Publishers can view orders for their websites" ON public.orders FOR SELECT TO authenticated USING (publisher_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid() AND public.has_role(auth.uid(), 'buyer'));
CREATE POLICY "Buyers can update own orders" ON public.orders FOR UPDATE TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "Publishers can update their orders" ON public.orders FOR UPDATE TO authenticated USING (publisher_id = auth.uid());
CREATE POLICY "Admins can update any order" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- transactions policies
CREATE POLICY "Buyers can view own transactions" ON public.transactions FOR SELECT TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "Publishers can view own transactions" ON public.transactions FOR SELECT TO authenticated USING (publisher_id = auth.uid());
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "System can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- payouts policies
CREATE POLICY "Publishers can view own payouts" ON public.payouts FOR SELECT TO authenticated USING (publisher_id = auth.uid());
CREATE POLICY "Admins can view all payouts" ON public.payouts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Publishers can request payouts" ON public.payouts FOR INSERT TO authenticated WITH CHECK (publisher_id = auth.uid() AND public.has_role(auth.uid(), 'publisher'));
CREATE POLICY "Admins can update payouts" ON public.payouts FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- messages policies
CREATE POLICY "Order participants can view messages" ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR publisher_id = auth.uid()))
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Order participants can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR publisher_id = auth.uid()))
  );

-- reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Buyers can create reviews" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid() AND
    public.has_role(auth.uid(), 'buyer') AND
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid() AND status = 'completed')
  );
CREATE POLICY "Buyers can update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (reviewer_id = auth.uid());

-- notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- disputes policies
CREATE POLICY "Order participants can view disputes" ON public.disputes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR publisher_id = auth.uid()))
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Order participants can create disputes" ON public.disputes FOR INSERT TO authenticated
  WITH CHECK (
    initiated_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR publisher_id = auth.uid()))
  );
CREATE POLICY "Admins can update disputes" ON public.disputes FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'buyer')
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON public.websites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Update website stats on review creation
CREATE OR REPLACE FUNCTION public.update_website_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.websites SET
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE website_id = NEW.website_id),
    total_orders = (SELECT COUNT(*) FROM public.orders WHERE website_id = NEW.website_id AND status = 'completed')
  WHERE id = NEW.website_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_website_rating();

-- =============================================
-- ENABLE REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
