with Ada.Text_IO; use Ada.Text_IO;

procedure Main is
   function Within (L, H, X : Integer) return Boolean is
   begin
      return X >= L and then X <= H;
   end Within;

   --  Very long comment (to check that clicking on a link to a subprogram
   --  works.
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --
   --

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

begin

   --  T T -> T

   if Within (1, 3, X => 2) then
      Put_Line ("yay!");
   end if;

   --  F T -> F

   if Within (1, 3, X => 0) then
      Put_Line ("should not see this");
   end if;

   --  T F -> T

   if Not_Within (1, 3, X => 0) then
      Put_Line ("yay!");
   end if;

   --  F F -> F

   if Not_Within (1, 3, X => 2) then
      Put_Line ("should not see this");
   end if;
end;
