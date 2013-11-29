with Ada.Text_IO;

function GNATquilt return Integer is
   procedure Log (Message : String);
   --  Write the given message to the standard output stream.

   ---------
   -- Log --
   ---------

   procedure Log (Message : String)
   is
      use Ada.Text_IO;
   begin
      Put_Line ("GNATquilt: " & Message);
   end Log;

   A : Integer := 0;
   B : Integer;

   Unused : Positive;

begin
   Log ("Hello World!");
   B := A + 1;
   Log (Integer'Image (B));
   return 0;
end GNATquilt;
