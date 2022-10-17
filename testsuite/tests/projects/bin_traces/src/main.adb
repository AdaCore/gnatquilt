with Ada.Text_IO;

procedure Main is
   procedure Ignore is null;
   function Fact (N : Integer) return Integer is
      (if N = 1 then 1 else N * Fact (N - 1));
begin
   Ada.Text_IO.Put_Line ("Fact (1) = " & Integer'Image (Fact (1)));
end Main;
