#include <iostream>

// using namespace std;
using std::cout;

int main()
{
    char ch = '@';
    bool b = true;
    int i = 42; // 4 byte * 8 = 32 bit; [-2^31;  2^31 - 1]
    float f = 2.71828;
    double d = 3.141592654;
    long int l = 1235151651;
    long double xx = 1e15;

    cout << ch << "\n";
    cout << b << "\n";  
    cout << i << "\n";
    cout << f << "\n";
    cout << d << "\n";
    cout << l << "\n";
    cout << xx <<"\n";
    
    cout << "char " << sizeof(ch) << "\n";
    cout << "bool " << sizeof(b) << "\n";  
    cout << "int " << sizeof(i) << "\n";
    cout << "float " << sizeof(f) << "\n";
    cout << "double " << sizeof(d) << "\n";
    cout << "long int " << sizeof(l) << "\n";
    cout << "long double" << sizeof(xx) <<"\n";
}
