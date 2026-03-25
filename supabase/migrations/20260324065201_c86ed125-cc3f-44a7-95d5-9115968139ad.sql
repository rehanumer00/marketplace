-- Create trigger for new user signup (profile + role creation)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for review rating updates
CREATE OR REPLACE TRIGGER on_review_update_rating
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_website_rating();

-- Create trigger for updated_at on orders
CREATE OR REPLACE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create trigger for updated_at on websites
CREATE OR REPLACE TRIGGER websites_updated_at
  BEFORE UPDATE ON public.websites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create trigger for updated_at on profiles
CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create trigger for updated_at on transactions
CREATE OR REPLACE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create trigger for updated_at on payouts
CREATE OR REPLACE TRIGGER payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create trigger for updated_at on publisher_wallets
CREATE OR REPLACE TRIGGER publisher_wallets_updated_at
  BEFORE UPDATE ON public.publisher_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();