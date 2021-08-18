procedure Main is
   procedure Eassert (T : Boolean) is
   begin
      pragma Annotate (Xcov, Exempt_On, "assert condition is never False");
      if not T then
         raise Program_Error;
      end if;
      pragma Annotate (Xcov, Exempt_Off);
   end Eassert;
begin
   Eassert (True);
end Main;
