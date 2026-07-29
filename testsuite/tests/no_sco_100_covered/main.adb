with Foo;

procedure Main is

   A : Boolean := False;
   B : Boolean := False;
   C : Boolean;

begin
   if A and then B then
      C := True;
      pragma Annotate (Xcov, Exempt_On, "Never executed");
      null;
      pragma Annotate (Xcov, Exempt_Off);
   else
      pragma Annotate (Xcov, Exempt_On, "Executed but still exempted");
      C := False;
      pragma Annotate (Xcov, Exempt_Off);
   end if;
end Main;
