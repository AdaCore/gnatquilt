package body Pk1 is
   function Within (L, H, X : Integer) return Boolean is
   begin
      return X >= L and then X <= H;
   end Within;
end Pk1;
