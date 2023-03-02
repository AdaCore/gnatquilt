#pragma once

int function_in_header ()
{
    int x = 42;
    x += 1;
    if (x > 42)
        return x;
    return 0;
}
