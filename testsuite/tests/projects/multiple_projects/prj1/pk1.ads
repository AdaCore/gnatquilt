package Pk1 is
   function Within (L, H, X : Integer) return Boolean;

   function Not_Within (L, H, X : Integer) return Boolean;

   function Id (X : Integer) return Integer is
      (X);
end Pk1;
