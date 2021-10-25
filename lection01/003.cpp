#include <iostream>
#include <string>

using namespace std;

int main()
{
    cout << "What is your name?";
    string name;
    cin >> name;

    int age;

    do 
    {
	    cout << "How old are you?" << endl;
	    cin >> age;

	    if (age <= 0)
	    {
		   cout << "Wrong age" << endl;
	    }
    }
    while (age <= 0);

    cout << "Your birth year is " << (2021 - age) << endl;
    return 0;
}
