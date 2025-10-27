-- Function to update user role after signup
-- This function can be called from the client side to update the role

CREATE OR REPLACE FUNCTION update_user_role(user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the profile with the new role
  UPDATE profiles 
  SET role = new_role::user_role
  WHERE id = user_id;
  
  -- If no rows were updated, the profile might not exist yet
  -- In that case, we'll let the trigger handle it
  IF NOT FOUND THEN
    RAISE WARNING 'Profile not found for user %', user_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO authenticated;
