with Ada.Text_IO; use Ada.Text_IO;

package body Pkg is

   ---------
   -- Foo --
   ---------

   procedure Foo
     (Arbitrarily_Long_Variable_1 : Boolean;
      Arbitrarily_Long_Variable_2 : Boolean) is
   begin
      --  Check selection of a condition

      if (Arbitrarily_Long_Variable_1
          or else Arbitrarily_Long_Variable_2)
      then
         Put_Line ("Hello world");
      end if;

      --  Check selection of a decision spanning on multiple lines

      if (Arbitrarily_Long_Variable_1
          and then Arbitrarily_Long_Variable_2)
      then
         Put_Line ("Hello world");
      end if;

      --  Check selection of a statement

      if False then
         Put_Line ("Hello world");
      end if;
   end Foo;

end Pkg;
