package body Pk1 is
   function Within (L, H, X : Integer) return Boolean is
   begin
      return X >= L and then X <= H;
   end Within;

   function Not_Within (L, H, X : Integer) return Boolean is
      function Alias_Lt (L, R : Integer) return Boolean is (L < R);

      function Alias_Gt (L, R : Integer) return Boolean;

      function Alias_Gt (L, R : Integer) return Boolean is
      begin
         return L > R;
      end Alias_Gt;
   begin
      return Alias_Lt (X, L) or else X > H;
   end Not_Within;

end Pk1;
