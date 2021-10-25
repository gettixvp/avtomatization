#include <iostream>

using namespace std;

int main()
{
	int n = 1;
	while (n <= 10)
	{
		cout << n << "\t" << n * n << "\n";
		++n;
	}
	cout << "-----------------------" << endl;

	n = 1;
	do 
	{
		cout << n << "\t" << n * n << "\n";
		++n;
	}
	while(n <= 10);

	cout << "-----------------------" << endl;

	for (int n = 1; n <= 10; ++n)
		cout << n << "\t" << n * n << "\n";
}
