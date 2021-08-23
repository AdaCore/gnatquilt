with Ada.Text_IO; use Ada.Text_IO;

with Pk1; use Pk1;

procedure T1 is
begin
   --  T T -> T
   if Within (1, 3, X => 2) then
      Put_Line ("yay!");
   end if;
   --  F T -> F
   if Within (1, 3, X => 0) then
      Put_Line ("should not see this");
   end if;
end T1;
