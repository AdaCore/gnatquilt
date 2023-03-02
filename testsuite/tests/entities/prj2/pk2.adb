package body Pk2 is

   function F (X : Integer) return Integer is
   begin
      if X > 2 then
         return X + 1;
      else
         return X - 1;
      end if;
   end F;
end Pk2;
