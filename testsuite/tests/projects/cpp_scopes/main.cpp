#include "foo.hh"
#include "bar.hh"
#include "pkg.hh"

template<typename T>
struct MyTClass
{
    MyTClass (T a, T b) { c = a + b; }

    ~MyTClass () { c++; }

    void method_one() { c++; }


private:
    T c;
};

class MyClass
{
public:
    int method_two(int x) { return x; }
};

template <typename T>
T template_function(T x) { return x + 1; }

extern "C"
{
    int normal_function(int x) { return x + 1; }
}


namespace my_namespace
{
    int function_in_namespace (int x) { return x + 1; }

    namespace
    {
        namespace named_namespace_again
        {
            int another_one (int x) { return x + 1; }
        }

        int function_in_anonymous_namespace (int x)
        {
            return named_namespace_again::another_one(x) + 1;
        }
    }

// Space to test navigation







































































    namespace
    {
        int in_second_anonymous_namespace (int x) { return x + 1; }
    }
}

int main()
{
    int x = 0;

    {
        int y = 42;
        x += y;
        x -= y;
    }

    template_function (x);

    my_namespace::function_in_namespace(x);
    my_namespace::function_in_anonymous_namespace (x);

    auto lambda = [](int x) { return x + 1; };
    lambda(x);

    MyTClass<int> y (x, 42);

    x = function_in_header ();
    x += decl_in_header ();
    x -= use_pkg ();

    return x;
}
